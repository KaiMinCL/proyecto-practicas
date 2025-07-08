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

    // Obtener estadísticas básicas y últimos estudiantes
    const [practicas, estadisticasRaw] = await Promise.all([
      // Últimas prácticas para obtener estudiantes recientes
      prisma.practica.findMany({
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
                  rut: true
                }
              },
              carrera: {
                select: {
                  nombre: true
                }
              }
            }
          }
        },
        orderBy: {
          fechaInicio: 'desc'
        },
        take: 20 // Tomar más para luego agrupar por estudiante
      }),
      
      // Estadísticas generales
      prisma.practica.groupBy({
        by: ['estado'],
        where: {
          docenteId: docente.id
        },
        _count: {
          id: true
        }
      })
    ]);

    // Agrupar por estudiante para obtener únicos y sus estadísticas
    const estudiantesMap = new Map();
    
    practicas.forEach(practica => {
      const estudianteId = practica.alumno.id;
      
      if (!estudiantesMap.has(estudianteId)) {
        estudiantesMap.set(estudianteId, {
          id: practica.alumno.id,
          usuario: practica.alumno.usuario,
          carrera: practica.alumno.carrera,
          estadoActual: practica.estado,
          fechaUltimaPractica: practica.fechaInicio,
          totalPracticas: 0
        });
      }

      const estudiante = estudiantesMap.get(estudianteId);
      
      // Actualizar estado actual con la práctica más reciente
      if (practica.fechaInicio > estudiante.fechaUltimaPractica) {
        estudiante.estadoActual = practica.estado;
        estudiante.fechaUltimaPractica = practica.fechaInicio;
      }
      
      estudiante.totalPracticas++;
    });

    const estudiantes = Array.from(estudiantesMap.values());

    // Calcular estadísticas
    const totalEstudiantes = estudiantes.length;
    const estudiantesActivos = estudiantes.filter(e => 
      ['PENDIENTE', 'PENDIENTE_ACEPTACION_DOCENTE', 'EN_CURSO', 'FINALIZADA_PENDIENTE_EVAL'].includes(e.estadoActual)
    ).length;

    const practicasEnCurso = estadisticasRaw
      .filter(stat => stat.estado === 'EN_CURSO')
      .reduce((sum, stat) => sum + stat._count.id, 0);

    const estadisticas = {
      totalEstudiantes,
      estudiantesActivos,
      practicasEnCurso
    };

    return NextResponse.json({
      success: true,
      data: {
        estudiantes: estudiantes.slice(0, 10), // Máximo 10 para el resumen
        estadisticas
      }
    });

  } catch (error) {
    console.error('Error al obtener resumen de estudiantes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
