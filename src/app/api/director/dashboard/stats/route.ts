import { NextResponse } from 'next/server';
import { verifyUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await verifyUserSession();
    if (!user || user.rol !== 'DIRECTOR_CARRERA' || !user.carreraId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Estadísticas de alumnos de la carrera
    const [totalAlumnos, alumnosActivos, alumnosInactivos] = await Promise.all([
      prisma.alumno.count({ where: { carreraId: user.carreraId } }),
      prisma.alumno.count({ where: { carreraId: user.carreraId, usuario: { estado: 'ACTIVO' } } }),
      prisma.alumno.count({ where: { carreraId: user.carreraId, usuario: { estado: 'INACTIVO' } } })
    ]);

    // Estadísticas de prácticas de la carrera
    const [practicasTotal, practicasEnCurso, practicasPendientes, practicasFinalizadas] = await Promise.all([
      prisma.practica.count({ where: { carreraId: user.carreraId } }),
      prisma.practica.count({ where: { carreraId: user.carreraId, estado: 'EN_CURSO' } }),
      prisma.practica.count({ where: { carreraId: user.carreraId, estado: { in: ['PENDIENTE', 'PENDIENTE_ACEPTACION_DOCENTE'] } } }),
      prisma.practica.count({ where: { carreraId: user.carreraId, estado: { in: ['CERRADA', 'EVALUACION_COMPLETA'] } } })
    ]);

    // Estadísticas de documentos de la carrera
    const documentosTotal = await prisma.documentoApoyo.count({ where: { carreraId: user.carreraId } });

    const stats = {
      usuarios: {
        total: totalAlumnos,
        activos: alumnosActivos,
        inactivos: alumnosInactivos
      },
      practicas: {
        total: practicasTotal,
        enCurso: practicasEnCurso,
        pendientes: practicasPendientes,
        finalizadas: practicasFinalizadas
      },
      documentos: {
        total: documentosTotal
      }
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching director stats:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
