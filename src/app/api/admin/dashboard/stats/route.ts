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

    // Ejecutar todas las consultas de conteo en paralelo para mayor eficiencia
    const [
      // Usuarios
      usuariosTotal,
      usuariosActivos,
      usuariosInactivos,
      // Sedes
      sedesTotal,
      sedesActivas,
      // Carreras
      carrerasTotal,
      carrerasActivas,
      // Prácticas
      practicasTotal,
      practicasEnCurso,
      practicasPendientes,
      practicasFinalizadas,
      // Centros de Práctica (NUEVO)
      centrosTotal,
      centrosActivos,
    ] = await Promise.all([
      // Consultas de Usuarios
      prisma.usuario.count(),
      prisma.usuario.count({ where: { estado: 'ACTIVO' } }),
      prisma.usuario.count({ where: { estado: 'INACTIVO' } }),
      // Consultas de Sedes
      prisma.sede.count(),
      prisma.sede.count({ where: { estado: 'ACTIVO' } }),
      // Consultas de Carreras
      prisma.carrera.count(),
      prisma.carrera.count({ where: { estado: 'ACTIVO' } }),
      // Consultas de Prácticas
      prisma.practica.count(),
      prisma.practica.count({ where: { estado: 'EN_CURSO' } }),
      prisma.practica.count({ where: { estado: { in: ['PENDIENTE', 'PENDIENTE_ACEPTACION_DOCENTE'] } } }),
      prisma.practica.count({ where: { estado: { in: ['CERRADA', 'EVALUACION_COMPLETA'] } } }),
      // Consultas de Centros de Práctica (NUEVO)
      prisma.centroPractica.count(),
      prisma.centroPractica.count({ where: { practicas: { some: {} } } }), // Cuenta centros con al menos una práctica
    ]);

    // Construir el objeto de respuesta final
    const stats = {
      usuarios: {
        total: usuariosTotal,
        activos: usuariosActivos,
        inactivos: usuariosInactivos,
      },
      sedes: {
        total: sedesTotal,
        activas: sedesActivas,
      },
      carreras: {
        total: carrerasTotal,
        activas: carrerasActivas,
      },
      practicas: {
        total: practicasTotal,
        enCurso: practicasEnCurso,
        pendientes: practicasPendientes,
        finalizadas: practicasFinalizadas,
      },
      // Añadir el nuevo objeto de centros (NUEVO)
      centros: {
        total: centrosTotal,
        activos: centrosActivos,
      },
    };

    return NextResponse.json({ success: true, data: stats });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}