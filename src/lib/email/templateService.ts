import { promises as fs } from 'fs';
import path from 'path';

/**
 * Servicio para manejar plantillas HTML de emails
 */
export class EmailTemplateService {
  private static readonly TEMPLATES_DIR = path.join(process.cwd(), 'src', 'lib', 'email', 'templates');
  
  /**
   * Carga y procesa una plantilla HTML
   */
  private static async loadTemplate(templateName: string): Promise<string> {
    try {
      const templatePath = path.join(this.TEMPLATES_DIR, `${templateName}.html`);
      const template = await fs.readFile(templatePath, 'utf-8');
      return template;
    } catch (error) {
      console.error(`Error loading template ${templateName}:`, error);
      throw new Error(`Could not load email template: ${templateName}`);
    }
  }

  /**
   * Reemplaza variables en la plantilla usando un simple sistema de marcadores
   */
  private static processTemplate(template: string, data: Record<string, unknown>): string {
    let processed = template;
    
    // Reemplazar variables básicas
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, String(value || ''));
    });

    // Agregar datos comunes
    const now = new Date();
    const commonData = {
      fechaActual: new Intl.DateTimeFormat('es-CL', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(now),
      año: now.getFullYear().toString()
    };

    Object.entries(commonData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value);
    });

    return processed;
  }

  /**
   * Formatea una fecha para mostrar en el email
   */
  private static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  /**
   * Genera HTML para alerta de expiración de Acta 1
   */
  static async generateAlertaExpiracionActa1(data: {
    alumnoNombre: string;
    alumnoApellido: string;
    carreraNombre: string;
    sedeNombre: string;
    diasRestantes: number;
    loginUrl: string;
  }): Promise<string> {
    const template = await this.loadTemplate('alerta-expiracion-acta1');
    return this.processTemplate(template, {
      ...data,
      loginUrl: data.loginUrl
    });
  }

  /**
   * Genera HTML para alerta de expiración de aceptación docente
   */
  static async generateAlertaExpiracionAceptacionDocente(data: {
    docenteNombre: string;
    docenteApellido: string;
    alumnoNombre: string;
    alumnoApellido: string;
    alumnoRut: string;
    carreraNombre: string;
    sedeNombre: string;
    diasRestantes: number;
    loginUrl: string;
  }): Promise<string> {
    const template = await this.loadTemplate('alerta-expiracion-aceptacion-docente');
    return this.processTemplate(template, {
      ...data,
      loginUrl: data.loginUrl
    });
  }

  /**
   * Genera HTML para alerta de término próximo (alumno)
   */
  static async generateAlertaTerminoProximo(data: {
    alumnoNombre: string;
    alumnoApellido: string;
    fechaTermino: Date;
    diasRestantes: number;
    carreraNombre: string;
    sedeNombre: string;
    loginUrl: string;
  }): Promise<string> {
    const template = await this.loadTemplate('alerta-termino-proximo');
    return this.processTemplate(template, {
      ...data,
      fechaTermino: this.formatDate(data.fechaTermino),
      loginUrl: data.loginUrl
    });
  }

  /**
   * Genera HTML para alerta de término próximo (docente)
   */
  static async generateAlertaTerminoProximoDocente(data: {
    docenteNombre: string;
    docenteApellido: string;
    alumnoNombre: string;
    alumnoApellido: string;
    fechaTermino: Date;
    diasRestantes: number;
    carreraNombre: string;
    sedeNombre: string;
    loginUrl: string;
  }): Promise<string> {
    const template = await this.loadTemplate('alerta-termino-proximo-docente');
    return this.processTemplate(template, {
      ...data,
      fechaTermino: this.formatDate(data.fechaTermino),
      loginUrl: data.loginUrl
    });
  }

  /**
   * Genera HTML para alerta de informe pendiente
   */
  static async generateAlertaInformePendiente(data: {
    alumnoNombre: string;
    alumnoApellido: string;
    fechaTermino: Date;
    diasVencido: number;
    carreraNombre: string;
    sedeNombre: string;
    loginUrl: string;
  }): Promise<string> {
    const template = await this.loadTemplate('alerta-informe-pendiente');
    return this.processTemplate(template, {
      ...data,
      fechaTermino: this.formatDate(data.fechaTermino),
      loginUrl: data.loginUrl
    });
  }

  /**
   * Genera HTML para alerta manual
   */
  static async generateAlertaManual(data: {
    destinatarioNombre: string;
    mensaje: string;
    enviadoPor: string;
    loginUrl: string;
  }): Promise<string> {
    const template = await this.loadTemplate('alerta-manual');
    return this.processTemplate(template, {
      ...data,
      loginUrl: data.loginUrl
    });
  }

  /**
   * Genera el HTML para la alerta de informe subido al docente
   */
  static async generateAlertaInformeSubidoDocente(data: {
    docenteNombre: string;
    alumnoNombre: string;
    alumnoRut: string;
    carreraNombre: string;
    sedeNombre: string;
    centroPractica: string;
    fechaSubida: string;
    evaluacionUrl: string;
  }): Promise<string> {
    const template = await this.loadTemplate('alerta-informe-subido-docente');
    return this.processTemplate(template, data);
  }

  /**
   * Genera el HTML para la alerta de Acta 1 completada al docente
   */
  static async generateAlertaActa1CompletadaDocente(data: {
    docenteNombre: string;
    docenteApellido: string;
    alumnoNombre: string;
    alumnoApellido: string;
    alumnoRut: string;
    carreraNombre: string;
    sedeNombre: string;
    centroPractica: string;
    fechaInicio: string;
    fechaTermino: string;
    loginUrl: string;
  }): Promise<string> {
    const template = await this.loadTemplate('alerta-acta1-completada-docente');
    return this.processTemplate(template, data);
  }
}
