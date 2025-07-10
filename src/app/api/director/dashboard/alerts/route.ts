import { NextResponse } from 'next/server';
import { verifyUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await verifyUserSession();
    if (!user || user.rol !== 'DIRECTOR_CARRERA' || !user.carreraId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const alerts = [];

    // Prácticas sin docente asignado en la carrera
    const practicasSinDocente = await prisma.practica.count({
      where: {
        carreraId: user.carreraId,
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

    // Prácticas pendientes de aprobación en la carrera
    const practicasPendientes = await prisma.practica.count({
      where: {
        carreraId: user.carreraId,
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

    // Alumnos inactivos en la carrera
    const alumnosInactivos = await prisma.alumno.count({
      where: { carreraId: user.carreraId, usuario: { estado: 'INACTIVO' } }
    });
    if (alumnosInactivos > 0) {
      alerts.push({
        id: 'alumnos-inactivos',
        type: 'warning',
        title: 'Alumnos inactivos',
        description: `${alumnosInactivos} alumnos están marcados como inactivos`,
        count: alumnosInactivos
      });
    }

    // Prácticas próximas a vencer (próximos 7 días) en la carrera
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + 7);
    const practicasProximasVencer = await prisma.practica.count({
      where: {
        carreraId: user.carreraId,
        fechaTermino: { lte: fechaLimite },
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
    console.error('Error fetching director alerts:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
