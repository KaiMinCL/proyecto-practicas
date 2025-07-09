import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const userPayload = await getUserSession();

    if (!userPayload) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (userPayload.rol !== 'DOCENTE') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo docentes pueden acceder.' },
        { status: 403 }
      );
    }

    // Obtener el docente actual
    const docente = await prisma.docente.findFirst({
      where: {
        usuario: {
          rut: userPayload.rut
        }
      }
    });

    if (!docente) {
      return NextResponse.json(
        { error: 'Docente no encontrado' },
        { status: 404 }
      );
    }

    // Obtener todas las prácticas del docente con información de estudiantes
    const practicas = await prisma.practica.findMany({
      where: {
        docenteId: docente.id
      },
      include: {
        alumno: {
          include: {
            usuario: {
              select: {
                nombre: true,
                apellido: true,
                rut: true,
                email: true
              }
            },
            carrera: {
              select: {
                id: true,
                nombre: true,
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
        centroPractica: {
          select: {
            nombreEmpresa: true
          }
        }
      },
      orderBy: [
        { fechaInicio: 'desc' },
        { alumno: { usuario: { apellido: 'asc' } } }
      ]
    });

    // Agrupar por estudiante y obtener el historial
    const estudiantesMap = new Map();

    practicas.forEach(practica => {
      const estudianteId = practica.alumno.id;
      
      if (!estudiantesMap.has(estudianteId)) {
        estudiantesMap.set(estudianteId, {
          id: practica.alumno.id,
          usuario: practica.alumno.usuario,
          carrera: practica.alumno.carrera,
          practicas: [],
          estadoActual: practica.estado,
          fechaUltimaPractica: practica.fechaInicio,
          totalPracticas: 0
        });
      }

      const estudiante = estudiantesMap.get(estudianteId);
      estudiante.practicas.push({
        id: practica.id,
        tipo: practica.tipo,
        estado: practica.estado,
        fechaInicio: practica.fechaInicio,
        fechaTermino: practica.fechaTermino,
        centroPractica: practica.centroPractica
      });

      // Actualizar estado actual con la práctica más reciente
      if (practica.fechaInicio > estudiante.fechaUltimaPractica) {
        estudiante.estadoActual = practica.estado;
        estudiante.fechaUltimaPractica = practica.fechaInicio;
      }

      estudiante.totalPracticas++;
    });

    const estudiantes = Array.from(estudiantesMap.values());

    // Estadísticas
    const estadisticas = {
      totalEstudiantes: estudiantes.length,
      estudiantesActivos: estudiantes.filter(e => 
        ['PENDIENTE', 'PENDIENTE_ACEPTACION_DOCENTE', 'EN_CURSO', 'FINALIZADA_PENDIENTE_EVAL'].includes(e.estadoActual)
      ).length,
      estudiantesFinalizados: estudiantes.filter(e => 
        ['CERRADA', 'EVALUACION_COMPLETA'].includes(e.estadoActual)
      ).length,
      totalPracticas: practicas.length,
      practicasEnCurso: practicas.filter(p => p.estado === 'EN_CURSO').length,
      practicasPendientes: practicas.filter(p => 
        ['PENDIENTE', 'PENDIENTE_ACEPTACION_DOCENTE'].includes(p.estado)
      ).length
    };

    return NextResponse.json({
      success: true,
      data: {
        estudiantes,
        estadisticas,
        docente: {
          id: docente.id,
          nombre: userPayload.nombre,
          apellido: userPayload.apellido
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener estudiantes supervisados:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
