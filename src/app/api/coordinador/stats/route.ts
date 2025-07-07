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

    // Obtener estadísticas relevantes para el coordinador
    const [
      totalAlumnos,
      alumnosConPracticaActiva,
      totalEmpleadores,
      empleadoresActivos,
      practicasEsteMes,
      documentosSubidos,
      practicasPendientesRevision
    ] = await Promise.all([
      // Total de alumnos
      prisma.alumno.count(),
      
      // Alumnos con práctica activa
      prisma.alumno.count({
        where: {
          practicas: {
            some: {
              estado: {
                in: ['EN_CURSO', 'PENDIENTE', 'PENDIENTE_ACEPTACION_DOCENTE']
              }
            }
          }
        }
      }),
      
      // Total de empleadores
      prisma.empleador.count(),
      
      // Empleadores activos
      prisma.empleador.count({
        where: {
          usuario: {
            estado: 'ACTIVO'
          }
        }
      }),
      
      // Prácticas iniciadas este mes
      prisma.practica.count({
        where: {
          fechaInicio: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      
      // Documentos subidos
      prisma.documentoApoyo.count(),
      
      // Prácticas pendientes de revisión
      prisma.practica.count({
        where: {
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
