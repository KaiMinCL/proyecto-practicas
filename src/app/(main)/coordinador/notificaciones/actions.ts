'use server';

import { AuditoriaService } from '@/lib/services/auditoria';
import { authorizeCoordinador } from '@/lib/auth/checkRole';

export interface NotificacionEmail {
  id: number;
  fecha: Date;
  tipo: string;
  destinatario: {
    nombre: string;
    email: string;
  };
  asunto: string;
  exitoso: boolean;
  errorMessage?: string;
  entidadRelacionada?: {
    tipo: string;
    id: string;
  };
}

export interface EstadisticasNotificaciones {
  enviadasHoy: number;
  exitosasHoy: number;
  fallidasHoy: number;
  totalSemana: number;
  tasaExito: number;
}

export async function obtenerNotificacionesEmail(page: number = 1, limit: number = 20) {
  await authorizeCoordinador();

  try {
    const offset = (page - 1) * limit;
    
    // Obtener logs de envío de email
    const logs = await AuditoriaService.obtenerHistorial({
      accion: 'ENVIO_EMAIL_NOTIFICACION',
      limit,
      offset
    });

    const total = await AuditoriaService.contarLogs({
      accion: 'ENVIO_EMAIL_NOTIFICACION'
    });

    const notificaciones: NotificacionEmail[] = logs.map(log => {
      const detalles = log.detallesNuevos as Record<string, unknown>;
      return {
        id: log.id,
        fecha: log.fecha,
        tipo: (detalles?.tipoNotificacion as string) || 'Desconocido',
        destinatario: {
          nombre: (detalles?.destinatarioNombre as string) || 'Desconocido',
          email: (detalles?.destinatarioEmail as string) || 'Desconocido'
        },
        asunto: (detalles?.asunto as string) || 'Sin asunto',
        exitoso: (detalles?.exitoso as boolean) || false,
        errorMessage: detalles?.errorMessage as string,
        entidadRelacionada: {
          tipo: log.entidad,
          id: log.entidadId
        }
      };
    });

    return {
      notificaciones,
      total,
      hasMore: offset + limit < total
    };
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    throw new Error('Error al cargar las notificaciones');
  }
}

export async function obtenerEstadisticasNotificaciones(): Promise<EstadisticasNotificaciones> {
  await authorizeCoordinador();

  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(inicioSemana.getDate() - 7);

    // Logs de hoy
    const logsHoy = await AuditoriaService.obtenerHistorial({
      accion: 'ENVIO_EMAIL_NOTIFICACION',
      fechaDesde: hoy,
      fechaHasta: manana,
      limit: 1000 // Para obtener todos los de hoy
    });

    // Logs de la semana
    const logsSemana = await AuditoriaService.obtenerHistorial({
      accion: 'ENVIO_EMAIL_NOTIFICACION',
      fechaDesde: inicioSemana,
      fechaHasta: manana,
      limit: 1000 // Para obtener todos de la semana
    });

    const enviadasHoy = logsHoy.length;
    const exitosasHoy = logsHoy.filter(log => {
      const detalles = log.detallesNuevos as Record<string, unknown>;
      return detalles?.exitoso === true;
    }).length;
    const fallidasHoy = enviadasHoy - exitosasHoy;

    const totalSemana = logsSemana.length;
    const exitosasSemana = logsSemana.filter(log => {
      const detalles = log.detallesNuevos as Record<string, unknown>;
      return detalles?.exitoso === true;
    }).length;

    const tasaExito = totalSemana > 0 ? (exitosasSemana / totalSemana) * 100 : 0;

    return {
      enviadasHoy,
      exitosasHoy,
      fallidasHoy,
      totalSemana,
      tasaExito: Math.round(tasaExito * 10) / 10 // Redondear a 1 decimal
    };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return {
      enviadasHoy: 0,
      exitosasHoy: 0,
      fallidasHoy: 0,
      totalSemana: 0,
      tasaExito: 0
    };
  }
}
