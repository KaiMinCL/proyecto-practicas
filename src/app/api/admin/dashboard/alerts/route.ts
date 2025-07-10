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

    const alerts = [];

    // Prácticas sin docente asignado
    const practicasSinDocente = await prisma.practica.count({
      where: {
        docenteId: undefined,
        estado: { in: ['PENDIENTE', 'PENDIENTE_ACEPTACION_DOCENTE'] }
      }
    });

    if (practicasSinDocente > 0) {
      alerts.push({
        id: 'practicas-sin-docente',
        type: 'warning',
        title: 'Prácticas sin docente asignado',
        description: `${practicasSinDocente} prácticas necesitan asignación de docente tutor`,
        count: practicasSinDocente
      });
    }

    // Prácticas pendientes de aprobación
    const practicasPendientes = await prisma.practica.count({
      where: {
        estado: 'PENDIENTE_ACEPTACION_DOCENTE'
      }
    });

    if (practicasPendientes > 0) {
      alerts.push({
        id: 'practicas-pendientes',
        type: 'info',
        title: 'Prácticas pendientes de aprobación',
        description: `${practicasPendientes} prácticas esperan aprobación del docente`,
        count: practicasPendientes
      });
    }

    // Usuarios inactivos
    const usuariosInactivos = await prisma.usuario.count({
      where: { estado: 'INACTIVO' }
    });

    if (usuariosInactivos > 0) {
      alerts.push({
        id: 'usuarios-inactivos',
        type: 'warning',
        title: 'Usuarios inactivos',
        description: `${usuariosInactivos} usuarios están marcados como inactivos`,
        count: usuariosInactivos
      });
    }

    // Prácticas próximas a vencer (próximas 7 días)
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + 7);

    const practicasProximasVencer = await prisma.practica.count({
      where: {
        fechaTermino: {
          lte: fechaLimite
        },
        estado: 'EN_CURSO'
      }
    });

    if (practicasProximasVencer > 0) {
      alerts.push({
        id: 'practicas-proximas-vencer',
        type: 'warning',
        title: 'Prácticas próximas a finalizar',
        description: `${practicasProximasVencer} prácticas finalizan en los próximos 7 días`,
        count: practicasProximasVencer
      });
    }

    return NextResponse.json({ success: true, data: alerts });

  } catch (error) {
    console.error('Error fetching admin alerts:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
