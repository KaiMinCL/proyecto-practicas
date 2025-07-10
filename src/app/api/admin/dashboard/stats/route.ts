import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (user.rol !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener estadísticas de usuarios
    const [usuariosTotal, usuariosActivos, usuariosInactivos] = await Promise.all([
      prisma.usuario.count(),
      prisma.usuario.count({ where: { estado: 'ACTIVO' } }),
      prisma.usuario.count({ where: { estado: 'INACTIVO' } })
    ]);

    // Obtener estadísticas de sedes
    const [sedesTotal, sedesActivas] = await Promise.all([
      prisma.sede.count(),
      prisma.sede.count({ where: { estado: 'ACTIVO' } })
    ]);

    // Obtener estadísticas de carreras
    const [carrerasTotal, carrerasActivas] = await Promise.all([
      prisma.carrera.count(),
      prisma.carrera.count({ where: { estado: 'ACTIVO' } })
    ]);

    // Obtener estadísticas de prácticas
    const [practicasTotal, practicasEnCurso, practicasPendientes, practicasFinalizadas] = await Promise.all([
      prisma.practica.count(),
      prisma.practica.count({ where: { estado: 'EN_CURSO' } }),
      prisma.practica.count({ where: { estado: { in: ['PENDIENTE', 'PENDIENTE_ACEPTACION_DOCENTE'] } } }),
      prisma.practica.count({ where: { estado: { in: ['CERRADA', 'EVALUACION_COMPLETA'] } } })
    ]);

    const stats = {
      usuarios: {
        total: usuariosTotal,
        activos: usuariosActivos,
        inactivos: usuariosInactivos
      },
      sedes: {
        total: sedesTotal,
        activas: sedesActivas
      },
      carreras: {
        total: carrerasTotal,
        activas: carrerasActivas
      },
      practicas: {
        total: practicasTotal,
        enCurso: practicasEnCurso,
        pendientes: practicasPendientes,
        finalizadas: practicasFinalizadas
      }
    };

    return NextResponse.json({ success: true, data: stats });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
