import { prisma } from '@/lib/prisma';
import { AccionAuditoria } from '@prisma/client';
import { NextRequest } from 'next/server';

// Tipos para los detalles de auditoría
interface DetallesAuditoria {
  [key: string]: unknown;
}

interface LogAuditoriaParams {
  accion: AccionAuditoria;
  entidad: string;
  entidadId: string;
  usuarioId: number;
  descripcion?: string;
  detallesPrevios?: DetallesAuditoria;
  detallesNuevos?: DetallesAuditoria;
  metadatos?: DetallesAuditoria;
  request?: NextRequest;
}

export class AuditoriaService {
  /**
   * Registra una acción en el log de auditoría
   */
  static async registrarAccion({
    accion,
    entidad,
    entidadId,
    usuarioId,
    descripcion,
    detallesPrevios,
    detallesNuevos,
    metadatos,
    request
  }: LogAuditoriaParams) {
    try {
      // Extraer información de la request si está disponible
      const ipAddress = request?.headers.get('x-forwarded-for') || 
        request?.headers.get('x-real-ip') || 
        request?.headers.get('cf-connecting-ip') ||
        'unknown';
      
      const userAgent = request?.headers.get('user-agent') || 'unknown';

      await prisma.logAuditoria.create({
        data: {
          accion,
          entidad,
          entidadId,
          usuarioId,
          descripcion,
          detallesPrevios: detallesPrevios ? JSON.parse(JSON.stringify(detallesPrevios)) : null,
          detallesNuevos: detallesNuevos ? JSON.parse(JSON.stringify(detallesNuevos)) : null,
          metadatos: metadatos ? JSON.parse(JSON.stringify(metadatos)) : null,
          ipAddress: ipAddress.toString(),
          userAgent
        }
      });
    } catch (error) {
      // Log el error pero no fallar la operación principal
      console.error('Error al registrar auditoría:', error);
    }
  }

  /**
   * Registra el login de un usuario
   */
  static async registrarLogin(usuarioId: number, exitoso: boolean, request?: NextRequest, motivo?: string) {
    await this.registrarAccion({
      accion: exitoso ? 'LOGIN_EXITOSO' : 'LOGIN_FALLIDO',
      entidad: 'Usuario',
      entidadId: usuarioId.toString(),
      usuarioId,
      descripcion: exitoso ? 'Usuario inició sesión exitosamente' : `Login fallido: ${motivo || 'Credenciales inválidas'}`,
      metadatos: { exitoso, motivo },
      request
    });
  }

  /**
   * Registra el logout de un usuario
   */
  static async registrarLogout(usuarioId: number, request?: NextRequest) {
    await this.registrarAccion({
      accion: 'LOGOUT',
      entidad: 'Usuario',
      entidadId: usuarioId.toString(),
      usuarioId,
      descripcion: 'Usuario cerró sesión',
      request
    });
  }

  /**
   * Registra la anulación de una práctica
   */
  static async registrarAnulacionPractica(
    practicaId: number,
    usuarioId: number,
    motivo: string,
    detallesPractica: {
      estadoAnterior: string;
      alumno: string;
      carrera: string;
      rut: string;
      directorNombre: string;
    },
    request?: NextRequest
  ) {
    await this.registrarAccion({
      accion: 'ANULAR_PRACTICA',
      entidad: 'Practica',
      entidadId: practicaId.toString(),
      usuarioId,
      descripcion: `Práctica anulada por ${detallesPractica.directorNombre}`,
      detallesPrevios: {
        estado: detallesPractica.estadoAnterior,
        alumno: detallesPractica.alumno,
        carrera: detallesPractica.carrera
      },
      detallesNuevos: {
        estado: 'ANULADA',
        motivo,
        fechaAnulacion: new Date()
      },
      metadatos: {
        motivo,
        alumnoRut: detallesPractica.rut,
        director: detallesPractica.directorNombre
      },
      request
    });
  }

  /**
   * Registra la creación de una práctica
   */
  static async registrarCreacionPractica(
    practicaId: number,
    usuarioId: number,
    detallesPractica: {
      tipo: string;
      carrera: string;
      alumno: string;
      fechaInicio: string;
      fechaTermino: string;
    },
    request?: NextRequest
  ) {
    await this.registrarAccion({
      accion: 'CREAR_PRACTICA',
      entidad: 'Practica',
      entidadId: practicaId.toString(),
      usuarioId,
      descripcion: `Nueva práctica creada para ${detallesPractica.alumno}`,
      detallesNuevos: detallesPractica,
      metadatos: {
        tipo: detallesPractica.tipo,
        carrera: detallesPractica.carrera,
        alumno: detallesPractica.alumno
      },
      request
    });
  }

  /**
   * Registra completar Acta 1 por coordinador
   */
  static async registrarCompletarActa1Coordinador(
    practicaId: number,
    usuarioId: number,
    detalles: {
      alumno: string;
      docente: string;
      fechaInicio: string;
      fechaTermino: string;
    },
    request?: NextRequest
  ) {
    await this.registrarAccion({
      accion: 'COMPLETAR_ACTA1_COORDINADOR',
      entidad: 'Practica',
      entidadId: practicaId.toString(),
      usuarioId,
      descripcion: `Acta 1 completada por coordinador para ${detalles.alumno}`,
      detallesNuevos: detalles,
      metadatos: {
        docenteAsignado: detalles.docente,
        fechaInicio: detalles.fechaInicio,
        fechaTermino: detalles.fechaTermino
      },
      request
    });
  }

  /**
   * Registra completar Acta 1 por alumno
   */
  static async registrarCompletarActa1Alumno(
    practicaId: number,
    usuarioId: number,
    detalles: {
      centroPractica: string;
      jefeDirecto: string;
      practicaDistancia: boolean;
    },
    request?: NextRequest
  ) {
    await this.registrarAccion({
      accion: 'COMPLETAR_ACTA1_ALUMNO',
      entidad: 'Practica',
      entidadId: practicaId.toString(),
      usuarioId,
      descripcion: 'Acta 1 completada por alumno',
      detallesNuevos: detalles,
      metadatos: {
        centroPractica: detalles.centroPractica,
        jefeDirecto: detalles.jefeDirecto,
        practicaDistancia: detalles.practicaDistancia
      },
      request
    });
  }

  /**
   * Registra aceptación/rechazo de Acta 1 por docente
   */
  static async registrarRevisionActa1Docente(
    practicaId: number,
    usuarioId: number,
    aceptada: boolean,
    motivo: string | null,
    request?: NextRequest
  ) {
    await this.registrarAccion({
      accion: aceptada ? 'ACEPTAR_ACTA1_DOCENTE' : 'RECHAZAR_ACTA1_DOCENTE',
      entidad: 'Practica',
      entidadId: practicaId.toString(),
      usuarioId,
      descripcion: aceptada 
        ? 'Acta 1 aceptada por docente' 
        : `Acta 1 rechazada por docente: ${motivo}`,
      metadatos: {
        aceptada,
        motivo,
        fecha: new Date()
      },
      request
    });
  }

  /**
   * Registra subida de informe de práctica
   */
  static async registrarSubidaInforme(
    practicaId: number,
    usuarioId: number,
    detallesInforme: {
      nombreArchivo: string;
      tamaño: number;
      url: string;
    },
    request?: NextRequest
  ) {
    await this.registrarAccion({
      accion: 'SUBIR_INFORME_PRACTICA',
      entidad: 'Practica',
      entidadId: practicaId.toString(),
      usuarioId,
      descripcion: 'Informe de práctica subido por alumno',
      detallesNuevos: detallesInforme,
      metadatos: {
        nombreArchivo: detallesInforme.nombreArchivo,
        tamaño: detallesInforme.tamaño,
        url: detallesInforme.url
      },
      request
    });
  }

  /**
   * Registra evaluación de informe por docente
   */
  static async registrarEvaluacionInforme(
    practicaId: number,
    usuarioId: number,
    evaluacion: {
      id: number;
      nota: number;
      comentarios?: string;
    },
    request?: NextRequest
  ) {
    await this.registrarAccion({
      accion: 'COMPLETAR_EVALUACION_INFORME',
      entidad: 'EvaluacionInformeDocente',
      entidadId: evaluacion.id.toString(),
      usuarioId,
      descripcion: `Informe evaluado con nota ${evaluacion.nota}`,
      detallesNuevos: evaluacion,
      metadatos: {
        practicaId,
        nota: evaluacion.nota,
        comentarios: evaluacion.comentarios
      },
      request
    });
  }

  /**
   * Registra evaluación por empleador
   */
  static async registrarEvaluacionEmpleador(
    practicaId: number,
    usuarioId: number,
    evaluacion: {
      id: number;
      notaFinal: number;
      empleador: string;
    },
    request?: NextRequest
  ) {
    await this.registrarAccion({
      accion: 'COMPLETAR_EVALUACION_EMPLEADOR',
      entidad: 'EvaluacionEmpleador',
      entidadId: evaluacion.id.toString(),
      usuarioId,
      descripcion: `Evaluación del empleador completada con nota ${evaluacion.notaFinal}`,
      detallesNuevos: evaluacion,
      metadatos: {
        practicaId,
        notaFinal: evaluacion.notaFinal,
        empleador: evaluacion.empleador
      },
      request
    });
  }

  /**
   * Registra generación de alerta manual
   */
  static async registrarAlertaManual(
    practicaId: number,
    usuarioId: number,
    alerta: {
      id: number;
      asunto: string;
      destinatario: string;
    },
    request?: NextRequest
  ) {
    await this.registrarAccion({
      accion: 'GENERAR_ALERTA_MANUAL',
      entidad: 'AlertaManual',
      entidadId: alerta.id.toString(),
      usuarioId,
      descripcion: `Alerta manual enviada: ${alerta.asunto}`,
      detallesNuevos: alerta,
      metadatos: {
        practicaId,
        asunto: alerta.asunto,
        destinatario: alerta.destinatario
      },
      request
    });
  }

  /**
   * Registra el envío de notificaciones por correo electrónico
   */
  static async registrarEnvioEmail(
    usuarioId: number,
    destinatarioId: number,
    tipoNotificacion: string,
    detallesEmail: {
      destinatarioEmail: string;
      destinatarioNombre: string;
      asunto: string;
      exitoso: boolean;
      emailId?: string;
      errorMessage?: string;
    },
    entidadRelacionada?: {
      tipo: string; // 'Practica', 'Usuario', etc.
      id: string;
    },
    request?: NextRequest
  ) {
    await this.registrarAccion({
      accion: 'ENVIO_NOTIFICACION' as AccionAuditoria,
      entidad: entidadRelacionada?.tipo || 'Sistema',
      entidadId: entidadRelacionada?.id || 'N/A',
      usuarioId,
      descripcion: detallesEmail.exitoso 
        ? `Email enviado exitosamente: ${tipoNotificacion} a ${detallesEmail.destinatarioNombre}`
        : `Error al enviar email: ${tipoNotificacion} a ${detallesEmail.destinatarioNombre}`,
      detallesNuevos: {
        tipoNotificacion,
        destinatarioId,
        destinatarioEmail: detallesEmail.destinatarioEmail,
        destinatarioNombre: detallesEmail.destinatarioNombre,
        asunto: detallesEmail.asunto,
        exitoso: detallesEmail.exitoso,
        emailId: detallesEmail.emailId,
        errorMessage: detallesEmail.errorMessage,
        fechaEnvio: new Date()
      },
      metadatos: {
        tipoNotificacion,
        destinatarioId,
        exitoso: detallesEmail.exitoso,
        emailId: detallesEmail.emailId
      },
      request
    });
  }

  /**
   * Obtiene el historial de auditoría filtrado
   */
  static async obtenerHistorial({
    entidad,
    entidadId,
    usuarioId,
    accion,
    fechaDesde,
    fechaHasta,
    limit = 100,
    offset = 0
  }: {
    entidad?: string;
    entidadId?: string;
    usuarioId?: number;
    accion?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: Record<string, unknown> = {};

    if (entidad) where.entidad = entidad;
    if (entidadId) where.entidadId = entidadId;
    if (usuarioId) where.usuarioId = usuarioId;
    if (accion) where.accion = accion;
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) (where.fecha as Record<string, unknown>).gte = fechaDesde;
      if (fechaHasta) (where.fecha as Record<string, unknown>).lte = fechaHasta;
    }

    return await prisma.logAuditoria.findMany({
      where,
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            email: true,
            rol: {
              select: { nombre: true }
            }
          }
        }
      },
      orderBy: { fecha: 'desc' },
      take: limit,
      skip: offset
    });
  }

  /**
   * Cuenta el número total de logs que coinciden con los filtros
   */
  static async contarLogs({
    entidad,
    entidadId,
    usuarioId,
    accion,
    fechaDesde,
    fechaHasta
  }: {
    entidad?: string;
    entidadId?: string;
    usuarioId?: number;
    accion?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
  }) {
    const where: DetallesAuditoria = {};

    if (entidad) where.entidad = entidad;
    if (entidadId) where.entidadId = entidadId;
    if (usuarioId) where.usuarioId = usuarioId;
    if (accion) where.accion = accion;
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) (where.fecha as Record<string, unknown>).gte = fechaDesde;
      if (fechaHasta) (where.fecha as Record<string, unknown>).lte = fechaHasta;
    }

    return await prisma.logAuditoria.count({ where: where as Record<string, unknown> });
  }
}
