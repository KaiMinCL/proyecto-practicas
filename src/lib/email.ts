import { Resend } from 'resend';
import { EmailTemplateService } from './email/templateService';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailNotificationData {
  alumnoEmail: string;
  alumnoNombre: string;
  alumnoApellido: string;
  alumnoRut: string;
  alumnoPassword: string;
  carreraNombre: string;
  sedeNombre: string;
  fechaInicio: string;
  fechaTermino: string;
  plazoCompletarActa: number; // días
}

export interface DocenteNotificationData {
  docenteEmail: string;
  docenteNombre: string;
  docenteApellido: string;
  alumnoNombre: string;
  alumnoApellido: string;
  alumnoRut: string;
  carreraNombre: string;
  sedeNombre: string;
  fechaInicio: string;
  fechaTermino: string;
  practicaId: number;
  centroPractica: string;
}

export interface AlertaPracticasPendientesData {
  coordinadorId: number;
  coordinadorNombre: string;
  coordinadorEmail: string;
  sedeId: number;
  sedeNombre: string;
  carrerasIds: number[];
  carrerasNombres: string[];
  practicasPendientes: Array<{
    id: number;
    alumno: {
      usuario: {
        nombre: string;
        apellido: string;
        rut: string;
      };
    };
    docente: {
      usuario: {
        nombre: string;
        apellido: string;
      };
    } | null;
    carrera: {
      nombre: string;
    };
    fechaTermino: Date;
    diasRetraso: number;
    criticidad: 'NORMAL' | 'BAJO' | 'CRITICO';
    centroPractica: {
      nombreEmpresa: string;
    } | null;
  }>;
  resumen: {
    total: number;
    criticas: number;
    bajas: number;
    normales: number;
  };
}

export class EmailService {
  /**
   * Envía notificación al alumno para completar el Acta 1
   */
  static async notificarAlumnoCompletarActa1(data: EmailNotificationData): Promise<{
    success: boolean;
    error?: string;
    emailId?: string;
  }> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const loginUrl = `${baseUrl}/`;
      
      const htmlContent = await EmailTemplateService.generateAlertaExpiracionActa1({
        alumnoNombre: data.alumnoNombre,
        alumnoApellido: data.alumnoApellido,
        carreraNombre: data.carreraNombre,
        sedeNombre: data.sedeNombre,
        diasRestantes: data.plazoCompletarActa,
        loginUrl: loginUrl
      });
      
      const { data: emailResult, error } = await resend.emails.send({
        from: 'Sistema de Prácticas <practicas@instituto.edu>',
        to: [data.alumnoEmail],
        subject: 'Completa tu Acta 1 de Supervisión de Práctica',
        html: htmlContent,
      });

      if (error) {
        console.error('Error al enviar email:', error);
        return {
          success: false,
          error: error.message || 'Error al enviar el email'
        };
      }

      return {
        success: true,
        emailId: emailResult?.id
      };
    } catch (error) {
      console.error('Error crítico al enviar email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Envía notificación al docente sobre nueva práctica asignada
   */
  static async notificarDocenteNuevaPractica(data: DocenteNotificationData): Promise<{
    success: boolean;
    error?: string;
    emailId?: string;
  }> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const loginUrl = `${baseUrl}/docente/practicas/${data.practicaId}`;
      
      const htmlContent = await EmailTemplateService.generateAlertaExpiracionAceptacionDocente({
        docenteNombre: data.docenteNombre,
        docenteApellido: data.docenteApellido,
        alumnoNombre: data.alumnoNombre,
        alumnoApellido: data.alumnoApellido,
        alumnoRut: data.alumnoRut,
        carreraNombre: data.carreraNombre,
        sedeNombre: data.sedeNombre,
        diasRestantes: 7, // Default days for new practice
        loginUrl: loginUrl
      });
      
      const { data: emailResult, error } = await resend.emails.send({
        from: 'Sistema de Prácticas <practicas@instituto.edu>',
        to: [data.docenteEmail],
        subject: `Nueva práctica asignada: ${data.alumnoNombre} ${data.alumnoApellido}`,
        html: htmlContent,
      });

      if (error) {
        console.error('Error al enviar email al docente:', error);
        return {
          success: false,
          error: error.message || 'Error al enviar el email'
        };
      }

      return {
        success: true,
        emailId: emailResult?.id
      };
    } catch (error) {
      console.error('Error crítico al enviar email al docente:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Notifica al docente que el alumno ha completado el Acta 1
   */
  static async notificarDocenteActa1Completada(data: {
    docenteEmail: string;
    docenteNombre: string;
    docenteApellido: string;
    alumnoNombre: string;
    alumnoApellido: string;
    alumnoRut: string;
    carreraNombre: string;
    sedeNombre: string;
    fechaInicio: string;
    fechaTermino: string;
    practicaId: number;
    centroPractica: string;
  }): Promise<{
    success: boolean;
    error?: string;
    emailId?: string;
  }> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const loginUrl = `${baseUrl}/login`;

      const htmlContent = await EmailTemplateService.generateAlertaActa1CompletadaDocente({
        docenteNombre: data.docenteNombre,
        docenteApellido: data.docenteApellido,
        alumnoNombre: data.alumnoNombre,
        alumnoApellido: data.alumnoApellido,
        alumnoRut: data.alumnoRut,
        carreraNombre: data.carreraNombre,
        sedeNombre: data.sedeNombre,
        centroPractica: data.centroPractica,
        fechaInicio: data.fechaInicio,
        fechaTermino: data.fechaTermino,
        loginUrl: loginUrl
      });

      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
        to: data.docenteEmail,
        subject: 'Acta 1 Completada - Revisión Pendiente',
        html: htmlContent,
      });

      return {
        success: true,
        emailId: result.data?.id,
      };
    } catch (error) {
      console.error('Error al enviar notificación de Acta 1 completada:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Envía alerta sobre prácticas pendientes de cierre a coordinadores y directores
   */
  static async enviarAlertaPracticasPendientes(
    data: AlertaPracticasPendientesData, 
    tipoReceptor: 'COORDINADOR' | 'DIRECTOR_CARRERA'
  ): Promise<{
    success: boolean;
    error?: string;
    emailId?: string;
  }> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const dashboardUrl = tipoReceptor === 'COORDINADOR' 
        ? `${baseUrl}/coordinador/practicas/gestion`
        : `${baseUrl}/admin/reportes`;

      const tituloRol = tipoReceptor === 'COORDINADOR' ? 'Coordinador' : 'Director de Carrera';
      
      let asunto = `Alerta: ${data.resumen.total} práctica${data.resumen.total > 1 ? 's' : ''} pendiente${data.resumen.total > 1 ? 's' : ''} de cierre`;
      if (data.resumen.criticas > 0) {
        asunto += ` (${data.resumen.criticas} crítica${data.resumen.criticas > 1 ? 's' : ''})`;
      }

      const { data: emailResult, error } = await resend.emails.send({
        from: 'Sistema de Prácticas <practicas@instituto.edu>',
        to: [data.coordinadorEmail],
        subject: asunto,
        html: `<html><body><h2>Alerta de Prácticas Pendientes</h2><p>Estimado ${tituloRol}, tiene prácticas pendientes de revisión.</p><p><a href="${dashboardUrl}">Acceder al dashboard</a></p></body></html>`,
      });

      if (error) {
        console.error('Error al enviar alerta de prácticas pendientes:', error);
        return {
          success: false,
          error: error.message || 'Error al enviar la alerta'
        };
      }

      return {
        success: true,
        emailId: emailResult?.id
      };
    } catch (error) {
      console.error('Error crítico al enviar alerta de prácticas pendientes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * HU-42: Envía alerta de expiración de Acta 1 a alumno
   */
  static async enviarAlertaExpiracionActa1(data: {
    alumnoEmail: string;
    alumnoNombre: string;
    alumnoApellido: string;
    carreraNombre: string;
    sedeNombre: string;
    diasRestantes: number;
    practicaId: number;
  }): Promise<{
    success: boolean;
    error?: string;
    emailId?: string;
  }> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const loginUrl = `${baseUrl}/alumno/practicas/${data.practicaId}`;
      
      const html = await EmailTemplateService.generateAlertaExpiracionActa1({
        alumnoNombre: data.alumnoNombre,
        alumnoApellido: data.alumnoApellido,
        carreraNombre: data.carreraNombre,
        sedeNombre: data.sedeNombre,
        diasRestantes: data.diasRestantes,
        loginUrl
      });

      const { data: emailResult, error } = await resend.emails.send({
        from: 'Sistema de Prácticas <practicas@instituto.edu>',
        to: [data.alumnoEmail],
        subject: 'Recordatorio: Tu plazo para completar el Acta 1 expira mañana',
        html,
      });

      if (error) {
        console.error('Error al enviar alerta de expiración Acta 1:', error);
        return {
          success: false,
          error: error.message || 'Error al enviar el email'
        };
      }

      return {
        success: true,
        emailId: emailResult?.id
      };
    } catch (error) {
      console.error('Error crítico al enviar alerta de expiración Acta 1:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * HU-43: Envía alerta de expiración de aceptación docente
   */
  static async enviarAlertaExpiracionAceptacionDocente(data: {
    docenteEmail: string;
    docenteNombre: string;
    docenteApellido: string;
    alumnoNombre: string;
    alumnoApellido: string;
    alumnoRut: string;
    carreraNombre: string;
    sedeNombre: string;
    diasRestantes: number;
    practicaId: number;
  }): Promise<{
    success: boolean;
    error?: string;
    emailId?: string;
  }> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const loginUrl = `${baseUrl}/docente/practicas/${data.practicaId}`;
      
      const html = await EmailTemplateService.generateAlertaExpiracionAceptacionDocente({
        docenteNombre: data.docenteNombre,
        docenteApellido: data.docenteApellido,
        alumnoNombre: data.alumnoNombre,
        alumnoApellido: data.alumnoApellido,
        alumnoRut: data.alumnoRut,
        carreraNombre: data.carreraNombre,
        sedeNombre: data.sedeNombre,
        diasRestantes: data.diasRestantes,
        loginUrl
      });

      const { data: emailResult, error } = await resend.emails.send({
        from: 'Sistema de Prácticas <practicas@instituto.edu>',
        to: [data.docenteEmail],
        subject: 'Recordatorio: Tu plazo para aceptar la supervisión expira mañana',
        html,
      });

      if (error) {
        console.error('Error al enviar alerta de expiración aceptación docente:', error);
        return {
          success: false,
          error: error.message || 'Error al enviar el email'
        };
      }

      return {
        success: true,
        emailId: emailResult?.id
      };
    } catch (error) {
      console.error('Error crítico al enviar alerta de expiración aceptación docente:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * HU-44: Envía alerta de término próximo a alumno
   */
  static async enviarAlertaTerminoProximo(data: {
    alumnoEmail: string;
    alumnoNombre: string;
    alumnoApellido: string;
    fechaTermino: Date;
    diasRestantes: number;
    carreraNombre: string;
    sedeNombre: string;
    practicaId: number;
  }): Promise<{
    success: boolean;
    error?: string;
    emailId?: string;
  }> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const loginUrl = `${baseUrl}/alumno/practicas/${data.practicaId}`;
      
      const html = await EmailTemplateService.generateAlertaTerminoProximo({
        alumnoNombre: data.alumnoNombre,
        alumnoApellido: data.alumnoApellido,
        fechaTermino: data.fechaTermino,
        diasRestantes: data.diasRestantes,
        carreraNombre: data.carreraNombre,
        sedeNombre: data.sedeNombre,
        loginUrl
      });

      const { data: emailResult, error } = await resend.emails.send({
        from: 'Sistema de Prácticas <practicas@instituto.edu>',
        to: [data.alumnoEmail],
        subject: `Recordatorio: Tu práctica termina en ${data.diasRestantes} días`,
        html,
      });

      if (error) {
        console.error('Error al enviar alerta de término próximo:', error);
        return {
          success: false,
          error: error.message || 'Error al enviar el email'
        };
      }

      return {
        success: true,
        emailId: emailResult?.id
      };
    } catch (error) {
      console.error('Error crítico al enviar alerta de término próximo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * HU-44: Envía alerta de término próximo a docente
   */
  static async enviarAlertaTerminoProximoDocente(data: {
    docenteEmail: string;
    docenteNombre: string;
    docenteApellido: string;
    alumnoNombre: string;
    alumnoApellido: string;
    fechaTermino: Date;
    diasRestantes: number;
    carreraNombre: string;
    sedeNombre: string;
    practicaId: number;
  }): Promise<{
    success: boolean;
    error?: string;
    emailId?: string;
  }> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const loginUrl = `${baseUrl}/docente/practicas/${data.practicaId}`;
      
      const html = await EmailTemplateService.generateAlertaTerminoProximoDocente({
        docenteNombre: data.docenteNombre,
        docenteApellido: data.docenteApellido,
        alumnoNombre: data.alumnoNombre,
        alumnoApellido: data.alumnoApellido,
        fechaTermino: data.fechaTermino,
        diasRestantes: data.diasRestantes,
        carreraNombre: data.carreraNombre,
        sedeNombre: data.sedeNombre,
        loginUrl
      });

      const { data: emailResult, error } = await resend.emails.send({
        from: 'Sistema de Prácticas <practicas@instituto.edu>',
        to: [data.docenteEmail],
        subject: `Recordatorio: Práctica de ${data.alumnoNombre} ${data.alumnoApellido} termina en ${data.diasRestantes} días`,
        html,
      });

      if (error) {
        console.error('Error al enviar alerta de término próximo docente:', error);
        return {
          success: false,
          error: error.message || 'Error al enviar el email'
        };
      }

      return {
        success: true,
        emailId: emailResult?.id
      };
    } catch (error) {
      console.error('Error crítico al enviar alerta de término próximo docente:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * HU-44: Envía alerta de informe pendiente
   */
  static async enviarAlertaInformePendiente(data: {
    alumnoEmail: string;
    alumnoNombre: string;
    alumnoApellido: string;
    fechaTermino: Date;
    diasVencido: number;
    carreraNombre: string;
    sedeNombre: string;
    practicaId: number;
  }): Promise<{
    success: boolean;
    error?: string;
    emailId?: string;
  }> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const loginUrl = `${baseUrl}/alumno/practicas/${data.practicaId}`;
      
      const html = await EmailTemplateService.generateAlertaInformePendiente({
        alumnoNombre: data.alumnoNombre,
        alumnoApellido: data.alumnoApellido,
        fechaTermino: data.fechaTermino,
        diasVencido: data.diasVencido,
        carreraNombre: data.carreraNombre,
        sedeNombre: data.sedeNombre,
        loginUrl
      });

      const { data: emailResult, error } = await resend.emails.send({
        from: 'Sistema de Prácticas <practicas@instituto.edu>',
        to: [data.alumnoEmail],
        subject: `Urgente: Informe de práctica pendiente (${data.diasVencido} días de retraso)`,
        html,
      });

      if (error) {
        console.error('Error al enviar alerta de informe pendiente:', error);
        return {
          success: false,
          error: error.message || 'Error al enviar el email'
        };
      }

      return {
        success: true,
        emailId: emailResult?.id
      };
    } catch (error) {
      console.error('Error crítico al enviar alerta de informe pendiente:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * HU-46: Envía alerta manual a alumno
   */
  static async enviarAlertaManual(data: {
    destinatarioEmail: string;
    destinatarioNombre: string;
    asunto: string;
    mensaje: string;
    enviadoPor: string;
    practicaId: number;
  }): Promise<{
    success: boolean;
    error?: string;
    emailId?: string;
  }> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const loginUrl = `${baseUrl}/alumno/practicas/${data.practicaId}`;
      
      const html = await EmailTemplateService.generateAlertaManual({
        destinatarioNombre: data.destinatarioNombre,
        mensaje: data.mensaje,
        enviadoPor: data.enviadoPor,
        loginUrl
      });

      const { data: emailResult, error } = await resend.emails.send({
        from: 'Sistema de Prácticas <practicas@instituto.edu>',
        to: [data.destinatarioEmail],
        subject: data.asunto,
        html,
      });

      if (error) {
        console.error('Error al enviar alerta manual:', error);
        return {
          success: false,
          error: error.message || 'Error al enviar el email'
        };
      }

      return {
        success: true,
        emailId: emailResult?.id
      };
    } catch (error) {
      console.error('Error crítico al enviar alerta manual:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Notifica al docente cuando un alumno sube su informe de práctica (HU-48)
   */
  static async notificarDocenteInformeSubido(data: {
    docenteEmail: string;
    docenteNombre: string;
    alumnoNombre: string;
    alumnoRut: string;
    carreraNombre: string;
    sedeNombre: string;
    centroPractica: string;
    fechaSubida: string;
    practicaId: number;
  }): Promise<{
    success: boolean;
    error?: string;
    emailId?: string;
  }> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const evaluacionUrl = `${baseUrl}/docente/practicas/${data.practicaId}/evaluar-informe`;

      const htmlContent = await EmailTemplateService.generateAlertaInformeSubidoDocente({
        docenteNombre: data.docenteNombre,
        alumnoNombre: data.alumnoNombre,
        alumnoRut: data.alumnoRut,
        carreraNombre: data.carreraNombre,
        sedeNombre: data.sedeNombre,
        centroPractica: data.centroPractica,
        fechaSubida: data.fechaSubida,
        evaluacionUrl: evaluacionUrl
      });

      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
        to: data.docenteEmail,
        subject: `Informe de Práctica Subido - ${data.alumnoNombre}`,
        html: htmlContent,
      });

      return {
        success: true,
        emailId: result.data?.id,
      };
    } catch (error) {
      console.error('Error al enviar notificación de informe subido:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }
}