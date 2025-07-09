'use server';

import { AuditoriaService } from '@/lib/services/auditoria';
import { authorizeDocente } from '@/lib/auth/checkRole';

export interface NotificacionEmailDocente {
  id: number;
  fecha: Date;
  tipo: string;
  alumno: {
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

export interface EstadisticasNotificacionesDocente {
  enviadasHoy: number;
  exitosasHoy: number;
  fallidasHoy: number;
  totalSemana: number;
  tasaExito: number;
}

export async function obtenerNotificacionesEmailDocente(page: number = 1, limit: number = 20) {
  await authorizeDocente();

  try {
    const offset = (page - 1) * limit;
    
    // Obtener logs de envío de email dirigidos al docente actual
    const logs = await AuditoriaService.obtenerHistorial({
      accion: 'ENVIO_EMAIL_NOTIFICACION',
      limit,
      offset
    });

    // Filtrar solo los emails dirigidos al docente actual
    const logsDocente = logs.filter(log => {
      const detalles = log.detallesNuevos as Record<string, unknown>;
      const tipoNotificacion = detalles?.tipoNotificacion as string;
      return tipoNotificacion === 'NOTIFICACION_DOCENTE_ACTA1_COMPLETADA';
    });

    const notificaciones: NotificacionEmailDocente[] = logsDocente.map(log => {
      const detalles = log.detallesNuevos as Record<string, unknown>;
      return {
        id: log.id,
        fecha: log.fecha,
        tipo: (detalles?.tipoNotificacion as string) || 'Desconocido',
        alumno: {
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
      total: logsDocente.length,
      hasMore: offset + limit < logsDocente.length
    };
  } catch (error) {
    console.error('Error al obtener notificaciones del docente:', error);
    throw new Error('Error al cargar las notificaciones');
  }
}

export async function obtenerEstadisticasNotificacionesDocente(): Promise<EstadisticasNotificacionesDocente> {
  await authorizeDocente();

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
      limit: 1000
    });

    // Logs de la semana
    const logsSemana = await AuditoriaService.obtenerHistorial({
      accion: 'ENVIO_EMAIL_NOTIFICACION',
      fechaDesde: inicioSemana,
      fechaHasta: manana,
      limit: 1000
    });

    // Filtrar solo notificaciones para docentes
    const logsDocenteHoy = logsHoy.filter(log => {
      const detalles = log.detallesNuevos as Record<string, unknown>;
      return detalles?.tipoNotificacion === 'NOTIFICACION_DOCENTE_ACTA1_COMPLETADA';
    });

    const logsDocenteSemana = logsSemana.filter(log => {
      const detalles = log.detallesNuevos as Record<string, unknown>;
      return detalles?.tipoNotificacion === 'NOTIFICACION_DOCENTE_ACTA1_COMPLETADA';
    });

    const enviadasHoy = logsDocenteHoy.length;
    const exitosasHoy = logsDocenteHoy.filter(log => {
      const detalles = log.detallesNuevos as Record<string, unknown>;
      return detalles?.exitoso === true;
    }).length;
    const fallidasHoy = enviadasHoy - exitosasHoy;

    const totalSemana = logsDocenteSemana.length;
    const exitosasSemana = logsDocenteSemana.filter(log => {
      const detalles = log.detallesNuevos as Record<string, unknown>;
      return detalles?.exitoso === true;
    }).length;

    const tasaExito = totalSemana > 0 ? (exitosasSemana / totalSemana) * 100 : 0;

    return {
      enviadasHoy,
      exitosasHoy,
      fallidasHoy,
      totalSemana,
      tasaExito: Math.round(tasaExito * 10) / 10
    };
  } catch (error) {
    console.error('Error al obtener estadísticas del docente:', error);
    return {
      enviadasHoy: 0,
      exitosasHoy: 0,
      fallidasHoy: 0,
      totalSemana: 0,
      tasaExito: 0
    };
  }
}
