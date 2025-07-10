import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'DIRECTOR_CARRERA', 'COORDINADOR'].includes(user.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sedeId = searchParams.get('sedeId');
    const carreraId = searchParams.get('carreraId');
    const anioAcademico = searchParams.get('anioAcademico');
    const nombreAlumno = searchParams.get('nombreAlumno');
    const rutAlumno = searchParams.get('rutAlumno');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {
      informeUrl: { not: null }, // Solo prácticas con informe
      estado: { in: ['EVALUACION_COMPLETA', 'CERRADA'] } // Solo prácticas evaluadas
    };

    if (sedeId) {
      where.carrera = { sedeId: parseInt(sedeId) };
    }

    if (carreraId) {
      where.carreraId = parseInt(carreraId);
    }

    if (anioAcademico) {
      const anio = parseInt(anioAcademico);
      where.fechaInicio = {
        gte: new Date(`${anio}-01-01`),
        lt: new Date(`${anio + 1}-01-01`)
      };
    }

    if (nombreAlumno) {
      where.alumno = {
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
        usuario: {
          rut: { contains: rutAlumno, mode: 'insensitive' }
        }
      };
    }

    // Obtener informes
    const [informes, total] = await Promise.all([
      prisma.practica.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaTermino: 'desc' },
        include: {
          alumno: {
            include: {
              usuario: {
                select: {
                  nombre: true,
                  apellido: true,
                  rut: true
                }
              }
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
        }
      }),
      prisma.practica.count({ where })
    ]);

    const totalPaginas = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        informes,
        total,
        totalPaginas,
        paginaActual: page
      }
    });

  } catch (error) {
    console.error('Error fetching repositorio informes:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Endpoint para obtener opciones de filtros
export async function POST(request: NextRequest) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'DIRECTOR_CARRERA', 'COORDINADOR'].includes(user.rol)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener sedes
    const sedes = await prisma.sede.findMany({
      where: { estado: 'ACTIVO' },
      select: {
        id: true,
        nombre: true
      }
    });

    // Obtener carreras
    const carreras = await prisma.carrera.findMany({
      where: { estado: 'ACTIVO' },
      select: {
        id: true,
        nombre: true,
        sedeId: true
      }
    });

    // Obtener años disponibles (últimos 5 años)
    const currentYear = new Date().getFullYear();
    const aniosDisponibles = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return NextResponse.json({
      success: true,
      data: {
        sedes,
        carreras,
        aniosDisponibles
      }
    });

  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
