import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (user.rol !== 'COORDINADOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const pagina = parseInt(searchParams.get('pagina') || '1');
    const limite = parseInt(searchParams.get('limite') || '20');
    const sedeId = searchParams.get('sedeId');
    const carreraId = searchParams.get('carreraId');
    const anioAcademico = searchParams.get('anioAcademico');
    const semestre = searchParams.get('semestre');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const nombreAlumno = searchParams.get('nombreAlumno');
    const rutAlumno = searchParams.get('rutAlumno');

    const skip = (pagina - 1) * limite;

    // Construir filtros base
    const where: any = {
      informeUrl: { not: null }, // Solo prácticas con informe
      // Los coordinadores solo pueden ver informes de su sede
      ...(user.sedeId && {
        alumno: {
          carrera: {
            sedeId: user.sedeId
          }
        }
      })
    };

    // Aplicar filtros adicionales
    if (sedeId && sedeId !== 'todas') {
      where.alumno = {
        ...where.alumno,
        carrera: {
          ...where.alumno?.carrera,
          sedeId: parseInt(sedeId)
        }
      };
    }

    if (carreraId && carreraId !== 'todas') {
      where.alumno = {
        ...where.alumno,
        carreraId: parseInt(carreraId)
      };
    }

    if (anioAcademico && anioAcademico !== 'todos') {
      const anio = parseInt(anioAcademico);
      where.fechaTermino = {
        gte: new Date(`${anio}-01-01`),
        lte: new Date(`${anio}-12-31`)
      };
    }

    if (semestre && semestre !== 'ambos') {
      const semestreNum = parseInt(semestre);
      const anio = anioAcademico ? parseInt(anioAcademico) : new Date().getFullYear();
      
      if (semestreNum === 1) {
        where.fechaTermino = {
          ...where.fechaTermino,
          gte: new Date(`${anio}-01-01`),
          lte: new Date(`${anio}-07-31`)
        };
      } else if (semestreNum === 2) {
        where.fechaTermino = {
          ...where.fechaTermino,
          gte: new Date(`${anio}-08-01`),
          lte: new Date(`${anio}-12-31`)
        };
      }
    }

    if (fechaDesde) {
      where.fechaTermino = {
        ...where.fechaTermino,
        gte: new Date(fechaDesde)
      };
    }

    if (fechaHasta) {
      where.fechaTermino = {
        ...where.fechaTermino,
        lte: new Date(fechaHasta)
      };
    }

    if (nombreAlumno) {
      where.alumno = {
        ...where.alumno,
        usuario: {
          OR: [
            { nombre: { contains: nombreAlumno, mode: 'insensitive' } },
            { apellido: { contains: nombreAlumno, mode: 'insensitive' } }
          ]
        }
      };
    }

    if (rutAlumno) {
      where.alumno = {
        ...where.alumno,
        usuario: {
          ...where.alumno?.usuario,
          rut: { contains: rutAlumno, mode: 'insensitive' }
        }
      };
    }

    // Contar total de registros
    const total = await prisma.practica.count({
      where: where
    });

    // Obtener los informes con paginación
    const informes = await prisma.practica.findMany({
      where: where,
      include: {
        alumno: {
          include: {
            usuario: {
              select: {
                nombre: true,
                apellido: true,
                rut: true
              }
            },
            carrera: {
              include: {
                sede: {
                  select: {
                    id: true,
                    nombre: true
                  }
                }
              }
            }
          }
        },
        docente: {
          include: {
            usuario: {
              select: {
                nombre: true,
                apellido: true
              }
            }
          }
        },
        evaluacionDocente: {
          select: {
            nota: true,
            fecha: true
          }
        }
      },
      orderBy: {
        fechaTermino: 'desc'
      },
      skip: skip,
      take: limite
    });

    const totalPaginas = Math.ceil(total / limite);

    return NextResponse.json({
      informes: informes.map(practica => ({
        id: practica.id,
        alumno: {
          usuario: practica.alumno.usuario
        },
        carrera: {
          id: practica.alumno.carrera.id,
          nombre: practica.alumno.carrera.nombre,
          sede: practica.alumno.carrera.sede
        },
        docente: practica.docente,
        informeUrl: practica.informeUrl,
        fechaTermino: practica.fechaTermino,
        tipo: practica.tipo,
        evaluacionDocente: practica.evaluacionDocente
      })),
      total,
      totalPaginas,
      paginaActual: pagina
    });

  } catch (error) {
    console.error('Error al obtener repositorio de informes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
