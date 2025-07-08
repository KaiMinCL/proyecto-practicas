import { Resend } from 'resend';

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
      
      const { data: emailResult, error } = await resend.emails.send({
        from: 'Sistema de Prácticas <practicas@instituto.edu>',
        to: [data.alumnoEmail],
        subject: 'Completa tu Acta 1 de Supervisión de Práctica',
        html: generateActa1NotificationHTML(data, loginUrl),
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
   * Envía notificación al docente cuando un alumno completa el Acta 1
   */
  static async notificarDocenteActa1Completada(data: DocenteNotificationData): Promise<{
    success: boolean;
    error?: string;
    emailId?: string;
  }> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const practicaUrl = `${baseUrl}/docente/practicas-pendientes/${data.practicaId}/revisar-acta`;
      
      const { data: emailResult, error } = await resend.emails.send({
        from: 'Sistema de Prácticas <practicas@instituto.edu>',
        to: [data.docenteEmail],
        subject: `Acta 1 completada - ${data.alumnoNombre} ${data.alumnoApellido}`,
        html: generateDocenteActa1NotificationHTML(data, practicaUrl),
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
}

/**
 * Genera el HTML del email de notificación para completar Acta 1
 */
function generateActa1NotificationHTML(data: EmailNotificationData, loginUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Completa tu Acta 1 de Supervisión de Práctica</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #007F7C;
        }
        .header h1 {
            color: #007F7C;
            margin: 0;
            font-size: 24px;
        }
        .header p {
            color: #666;
            margin: 5px 0 0 0;
        }
        .content {
            margin-bottom: 30px;
        }
        .highlight-box {
            background-color: #f0f9ff;
            border-left: 4px solid #00B0FF;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .credentials-box {
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .credentials-box h3 {
            color: #007F7C;
            margin-top: 0;
        }
        .credential-item {
            margin: 8px 0;
            font-family: 'Courier New', monospace;
            background-color: #ffffff;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid #e0e0e0;
        }
        .deadline-alert {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        }
        .deadline-alert strong {
            color: #856404;
        }
        .cta-button {
            display: inline-block;
            background-color: #007F7C;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        .cta-button:hover {
            background-color: #005f5c;
        }
        .instructions {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .instructions h3 {
            color: #007F7C;
            margin-top: 0;
        }
        .instructions ol {
            margin: 0;
            padding-left: 20px;
        }
        .instructions li {
            margin-bottom: 8px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .practice-details {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        .practice-details h4 {
            color: #007F7C;
            margin-top: 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            padding: 5px 0;
        }
        .detail-label {
            font-weight: bold;
            color: #555;
        }
        .detail-value {
            color: #333;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Sistema de Gestión de Prácticas</h1>
            <p>Instituto de Educación Superior</p>
        </div>

        <div class="content">
            <h2>¡Hola ${data.alumnoNombre} ${data.alumnoApellido}!</h2>
            
            <p>Te informamos que se ha <strong>iniciado el registro de tu práctica</strong> en nuestro sistema. Es momento de completar la información faltante en el <strong>Acta 1 de Supervisión de Práctica</strong>.</p>

            <div class="practice-details">
                <h4>📋 Detalles de tu Práctica</h4>
                <div class="detail-row">
                    <span class="detail-label">Carrera:</span>
                    <span class="detail-value">${data.carreraNombre}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Sede:</span>
                    <span class="detail-value">${data.sedeNombre}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Fecha de Inicio:</span>
                    <span class="detail-value">${data.fechaInicio}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Fecha de Término:</span>
                    <span class="detail-value">${data.fechaTermino}</span>
                </div>
            </div>

            <div class="credentials-box">
                <h3>🔐 Tus Credenciales de Acceso</h3>
                <p>Utiliza los siguientes datos para ingresar al sistema:</p>
                <div class="credential-item">
                    <strong>Usuario (RUT):</strong> ${data.alumnoRut}
                </div>
                <div class="credential-item">
                    <strong>Contraseña:</strong> ${data.alumnoPassword}
                </div>
                <p><em>Nota: Te recomendamos cambiar tu contraseña después del primer ingreso por seguridad.</em></p>
            </div>

            <div class="deadline-alert">
                <strong>⏰ PLAZO IMPORTANTE:</strong><br>
                Tienes <strong>${data.plazoCompletarActa} días</strong> para completar el Acta 1 desde la fecha de este correo.
            </div>

            <div style="text-align: center;">
                <a href="${loginUrl}" class="cta-button">
                    🚀 Acceder al Sistema
                </a>
            </div>

            <div class="instructions">
                <h3>📝 Instrucciones para Completar el Acta 1</h3>
                <ol>
                    <li><strong>Ingresa al sistema</strong> usando el enlace de arriba y tus credenciales.</li>
                    <li><strong>Navega a "Mis Prácticas"</strong> en el menú principal.</li>
                    <li><strong>Busca tu práctica</strong> con estado "Pendiente" y haz clic en "Completar Acta".</li>
                    <li><strong>Completa la información requerida:</strong>
                        <ul>
                            <li>Dirección del Centro de Práctica</li>
                            <li>Departamento donde realizarás la práctica</li>
                            <li>Datos del Jefe Directo (nombre, cargo, contactos)</li>
                            <li>Principales tareas a desempeñar</li>
                            <li>Indica si es práctica a distancia</li>
                        </ul>
                    </li>
                    <li><strong>Sube tu fotografía</strong> para el perfil (opcional pero recomendado).</li>
                    <li><strong>Revisa y envía</strong> la información para que sea validada por tu docente tutor.</li>
                </ol>
            </div>

            <div class="highlight-box">
                <p><strong>💡 Importante:</strong> Una vez que completes y envíes el Acta 1, tu docente tutor recibirá una notificación para validar la información. Solo después de su aprobación podrás continuar con el proceso de práctica.</p>
            </div>

            <div class="highlight-box">
                <p><strong>❓ ¿Necesitas ayuda?</strong> Si tienes problemas para acceder al sistema o completar el formulario, contacta a tu coordinador de carrera.</p>
            </div>
        </div>

        <div class="footer">
            <p>Este es un mensaje automático del Sistema de Gestión de Prácticas.</p>
            <p>Por favor, no respondas a este correo.</p>
            <p><em>© ${new Date().getFullYear()} Instituto de Educación Superior</em></p>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Genera el HTML del email de notificación al docente cuando un alumno completa el Acta 1
 */
function generateDocenteActa1NotificationHTML(data: DocenteNotificationData, practicaUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acta 1 Lista para Revisión</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #007F7C 0%, #005F5C 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 30px 20px;
        }
        .alert-box {
            background-color: #e8f5e8;
            border-left: 4px solid #28a745;
            padding: 20px;
            margin: 20px 0;
            border-radius: 6px;
        }
        .alert-box h3 {
            margin: 0 0 10px 0;
            color: #155724;
            font-size: 18px;
        }
        .alert-box p {
            margin: 0;
            color: #155724;
        }
        .student-info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .student-info h3 {
            margin: 0 0 15px 0;
            color: #007F7C;
            font-size: 18px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-item {
            background-color: white;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e9ecef;
        }
        .info-label {
            font-weight: 600;
            color: #495057;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .info-value {
            font-size: 14px;
            color: #212529;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #007F7C 0%, #005F5C 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(0, 127, 124, 0.3);
            transition: all 0.3s ease;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 127, 124, 0.4);
        }
        .instructions {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .instructions h3 {
            color: #007F7C;
            margin: 0 0 15px 0;
        }
        .instructions ol {
            margin: 0;
            padding-left: 20px;
        }
        .instructions li {
            margin-bottom: 8px;
        }
        .highlight-box {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
        }
        .footer p {
            margin: 5px 0;
        }
        @media only screen and (max-width: 600px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
            .header h1 {
                font-size: 24px;
            }
            .content {
                padding: 20px 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Acta 1 Lista para Revisión</h1>
            <p>Nuevo alumno asignado - Supervisión de Práctica</p>
        </div>
        
        <div class="content">
            <div class="alert-box">
                <h3>🎯 Acción Requerida</h3>
                <p>Un alumno ha completado su Acta 1 y está listo para ser supervisado por ti. Se requiere tu revisión y aceptación formal.</p>
            </div>

            <h2>👋 Hola ${data.docenteNombre} ${data.docenteApellido}</h2>
            <p>Te informamos que tienes un nuevo alumno asignado para supervisión de práctica:</p>

            <div class="student-info">
                <h3>👨‍🎓 Información del Alumno</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Nombre Completo</div>
                        <div class="info-value">${data.alumnoNombre} ${data.alumnoApellido}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">RUT</div>
                        <div class="info-value">${data.alumnoRut}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Carrera</div>
                        <div class="info-value">${data.carreraNombre}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Sede</div>
                        <div class="info-value">${data.sedeNombre}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Centro de Práctica</div>
                        <div class="info-value">${data.centroPractica}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Período</div>
                        <div class="info-value">${data.fechaInicio} - ${data.fechaTermino}</div>
                    </div>
                </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${practicaUrl}" class="cta-button">
                    📝 Revisar y Aceptar Acta 1
                </a>
            </div>

            <div class="instructions">
                <h3>📋 Próximos Pasos</h3>
                <ol>
                    <li><strong>Revisa el Acta 1:</strong> Verifica toda la información completada por el alumno, incluyendo datos del centro de práctica y tareas asignadas.</li>
                    <li><strong>Valida la información:</strong> Confirma que los datos del empleador, ubicación y descripción de tareas sean correctos y apropiados.</li>
                    <li><strong>Acepta o rechaza:</strong> Toma una decisión sobre la supervisión de la práctica basándote en la información proporcionada.</li>
                    <li><strong>Comunica tu decisión:</strong> El sistema notificará automáticamente al alumno y coordinador sobre tu decisión.</li>
                </ol>
            </div>

            <div class="highlight-box">
                <p><strong>💡 Importante:</strong> Una vez que aceptes la supervisión, serás el responsable de evaluar el desempeño del alumno y su informe final de práctica. El seguimiento y apoyo durante el período de práctica será fundamental para el éxito del estudiante.</p>
            </div>

            <div class="highlight-box">
                <p><strong>❓ ¿Necesitas más información?</strong> Si tienes dudas sobre el proceso de supervisión o necesitas información adicional sobre el centro de práctica, contacta al coordinador de carrera correspondiente.</p>
            </div>
        </div>

        <div class="footer">
            <p>Este es un mensaje automático del Sistema de Gestión de Prácticas.</p>
            <p>Por favor, no respondas a este correo.</p>
            <p><em>© ${new Date().getFullYear()} Instituto de Educación Superior</em></p>
        </div>
    </div>
</body>
</html>
  `;
}