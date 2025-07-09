import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyUserSession } from '@/lib/auth';

export async function GET() {
  try {
    // Verificar autenticación
    const user = await verifyUserSession();
    if (!user || user.rol !== 'COORDINADOR') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Restricción por sede asignada al coordinador
    if (!user.sedeId) {
      return NextResponse.json(
        { error: 'Coordinador sin sede asignada' },
        { status: 400 }
      );
    }

    // Obtener estadísticas relevantes para el coordinador - Solo de su sede
    const [
      totalAlumnos,
      alumnosConPracticaActiva,
      totalEmpleadores,
      empleadoresActivos,
      practicasEsteMes,
      documentosSubidos,
      practicasPendientesRevision
    ] = await Promise.all([
      // Total de alumnos - Solo de la sede del coordinador
      prisma.alumno.count({
        where: {
          carrera: {
            sedeId: user.sedeId
          }
        }
      }),
      
      // Alumnos con práctica activa - Solo de la sede del coordinador
      prisma.alumno.count({
        where: {
          carrera: {
            sedeId: user.sedeId
          },
          practicas: {
            some: {
              estado: {
                in: ['EN_CURSO', 'PENDIENTE', 'PENDIENTE_ACEPTACION_DOCENTE']
              }
            }
          }
        }
      }),
      
      // Total de empleadores - Solo activos en la sede
      prisma.empleador.count({
        where: {
          centros: {
            some: {
              centroPractica: {
                practicas: {
                  some: {
                    carrera: {
                      sedeId: user.sedeId
                    }
                  }
                }
              }
            }
          }
        }
      }),
      
      // Empleadores activos - Solo relacionados con la sede
      prisma.empleador.count({
        where: {
          usuario: {
            estado: 'ACTIVO'
          },
          centros: {
            some: {
              centroPractica: {
                practicas: {
                  some: {
                    carrera: {
                      sedeId: user.sedeId
                    }
                  }
                }
              }
            }
          }
        }
      }),
      
      // Prácticas iniciadas este mes - Solo de la sede del coordinador
      prisma.practica.count({
        where: {
          carrera: {
            sedeId: user.sedeId
          },
          fechaInicio: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      
      // Documentos subidos - Solo de la sede del coordinador
      prisma.documentoApoyo.count({
        where: {
          sedeId: user.sedeId
        }
      }),
      
      // Prácticas pendientes de revisión - Solo de la sede del coordinador
      prisma.practica.count({
        where: {
          carrera: {
            sedeId: user.sedeId
          },
          estado: {
            in: ['PENDIENTE', 'PENDIENTE_ACEPTACION_DOCENTE']
          }
        }
      })
    ]);

    const stats = {
      totalAlumnos,
      alumnosConPracticaActiva,
      totalEmpleadores,
      empleadoresActivos,
      practicasEsteMes,
      documentosSubidos,
      practicasPendientesRevision
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error al obtener estadísticas del coordinador:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
