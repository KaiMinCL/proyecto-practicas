import prisma from '@/lib/prisma';
import { EmailService } from '@/lib/email';
import { AuditoriaService } from '@/lib/services/auditoria';
import { addDays, differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EstadoPractica } from '@prisma/client';

export type CriticidadPractica = 'NORMAL' | 'BAJO' | 'CRITICO';

export interface PracticaPendiente {
  id: number;
  alumno: {
    id: number;
    usuario: {
      nombre: string;
      apellido: string;
      rut: string;
      email: string;
    };
  };
  docente: {
    id: number;
    usuario: {
      nombre: string;
      apellido: string;
      email: string;
    };
  } | null;
  carrera: {
    id: number;
    nombre: string;
    sede: {
      id: number;
      nombre: string;
    } | null;
  };
  fechaInicio: Date;
  fechaTermino: Date;
  estado: string;
  tipoPractica: string;
  centroPractica: {
    nombreEmpresa: string;
  } | null;
  diasRetraso: number;
  criticidad: CriticidadPractica;
}

export interface ResumenAlertasPorCoordinador {
  coordinadorId: number;
  coordinadorNombre: string;
  coordinadorEmail: string;
  sedeId: number;
  sedeNombre: string;
  carrerasIds: number[];
  carrerasNombres: string[];
  practicasPendientes: PracticaPendiente[];
  resumen: {
    total: number;
    criticas: number;
    bajas: number;
    normales: number;
  };
}

export interface AlertaManualData {
  practicaId: number;
  asunto?: string;
  mensaje: string;
  enviadoPor: string;
  enviadoEmail: string;
  destinatario: {
    nombre: string;
    email: string;
  };
}

/**
 * Servicio para gestionar alertas automáticas de prácticas
 */
export class AlertasPracticasService {
  
  /**
   * Configuración para determinar la criticidad de las prácticas pendientes
   */
  private static readonly CONFIGURACION_CRITICIDAD = {
    // Días de gracia después de la fecha de término
    DIAS_GRACIA: 5,
    // Umbral para clasificar como CRÍTICO (días de retraso)
    DIAS_CRITICO: 15,
    // Umbral para clasificar como BAJO (días de retraso)  
    DIAS_BAJO: 7,
    // Estados que consideramos como "no cerradas"
    ESTADOS_NO_CERRADOS: [
      'PENDIENTE',
      'PENDIENTE_ACEPTACION_DOCENTE', 
      'RECHAZADA_DOCENTE',
      'EN_CURSO',
      'FINALIZADA_PENDIENTE_EVAL',
      'EVALUACION_COMPLETA'
    ] as const satisfies readonly EstadoPractica[],
    // Estados que consideramos como cerradas (no alertar)
    ESTADOS_CERRADOS: ['CERRADA', 'ANULADA']
  };

  /**
   * Configuración para alertas de plazos
   */
  private static readonly CONFIGURACION_PLAZOS = {
    // Plazo para completar Acta 1 (días desde fecha inicio)
    PLAZO_ACTA_1: 5,
    // Plazo para aceptación docente (días desde completado por alumno)
    PLAZO_ACEPTACION_DOCENTE: 5,
    // Días antes del vencimiento para enviar alerta
    DIAS_ALERTA_PREVIA: 1,
    // Días antes de la fecha término para alertar
    DIAS_ALERTA_TERMINO: 7,
    // Días después de fecha término para alertar informe
    DIAS_ALERTA_INFORME: 3
  };

  /**
   * Determina la criticidad de una práctica basada en los días de retraso
   */
  private static determinaCriticidad(diasRetraso: number): CriticidadPractica {
    if (diasRetraso >= this.CONFIGURACION_CRITICIDAD.DIAS_CRITICO) {
      return 'CRITICO';
    } else if (diasRetraso >= this.CONFIGURACION_CRITICIDAD.DIAS_BAJO) {
      return 'BAJO';
    }
    return 'NORMAL';
  }

  /**
   * Identifica prácticas que han pasado su fecha de término y no están cerradas
   */
  static async identificarPracticasPendientes(): Promise<PracticaPendiente[]> {
    try {
      const hoy = new Date();
      const fechaLimiteConGracia = addDays(hoy, -this.CONFIGURACION_CRITICIDAD.DIAS_GRACIA);

      const practicasPendientes = await prisma.practica.findMany({
        where: {
          fechaTermino: {
            lt: fechaLimiteConGracia
          },
          estado: {
            in: [...this.CONFIGURACION_CRITICIDAD.ESTADOS_NO_CERRADOS] as EstadoPractica[]
          }
        },
        include: {
          alumno: {
            include: {
              usuario: {
                select: {
                  nombre: true,
                  apellido: true, 
                  rut: true,
                  email: true
                }
              },
              carrera: {
                include: {
                  sede: {
                    select: {
                      id: true,
                      nombre: true
                    }
                  }
                }
              }
            }
          },
          docente: {
            include: {
              usuario: {
                select: {
                  nombre: true,
                  apellido: true,
                  email: true
                }
              }
            }
          },
          centroPractica: {
            select: {
              nombreEmpresa: true
            }
          }
        },
        orderBy: [
          { fechaTermino: 'asc' },
          { alumno: { usuario: { apellido: 'asc' } } }
        ]
      });

      return practicasPendientes.map((practica: PrismaQueryResult) => {
        const diasRetraso = differenceInDays(hoy, practica.fechaTermino);
        const criticidad = this.determinaCriticidad(diasRetraso);

        return {
          id: practica.id,
          alumno: {
            id: practica.alumno.id,
            usuario: practica.alumno.usuario
          },
          docente: practica.docente ? {
            id: practica.docente.id,
            usuario: practica.docente.usuario
          } : null,
          carrera: {
            id: practica.alumno.carrera.id,
            nombre: practica.alumno.carrera.nombre,
            sede: practica.alumno.carrera.sede
          },
          fechaInicio: practica.fechaInicio,
          fechaTermino: practica.fechaTermino,
          estado: practica.estado,
          tipoPractica: practica.tipo,
          centroPractica: practica.centroPractica,
          diasRetraso,
          criticidad
        };
      });

    } catch (error) {
      console.error('Error al identificar prácticas pendientes:', error);
      throw new Error('No se pudieron obtener las prácticas pendientes');
    }
  }

  /**
   * HU-42: Identificar prácticas con Acta 1 próxima a expirar (alumno)
   */
  static async identificarPracticasActa1PorExpirar(): Promise<Array<{
    id: number;
    alumno: {
      email: string;
      nombre: string;
      apellido: string;
      rut: string;
    };
    fechaInicio: Date;
    carrera: {
      nombre: string;
      sede: { nombre: string } | null;
    };
    diasRestantes: number;
  }>> {
    try {
      const hoy = new Date();
      // const fechaLimiteAlerta = addDays(hoy, this.CONFIGURACION_PLAZOS.DIAS_ALERTA_PREVIA);

      const practicas = await prisma.practica.findMany({
        where: {
          estado: 'PENDIENTE',
          fechaCompletadoAlumno: null,
          fechaInicio: {
            lte: addDays(hoy, -(this.CONFIGURACION_PLAZOS.PLAZO_ACTA_1 - this.CONFIGURACION_PLAZOS.DIAS_ALERTA_PREVIA))
          },
          // Verificar que no se haya enviado ya una alerta
          NOT: {
            alertasManuales: {
              some: {
                asunto: {
                  contains: 'Recordatorio: Acta 1 expira mañana'
                }
              }
            }
          }
        },
        include: {
          alumno: {
            include: {
              usuario: {
                select: {
                  email: true,
                  nombre: true,
                  apellido: true,
                  rut: true
                }
              },
              carrera: {
                include: {
                  sede: {
                    select: {
                      nombre: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      return practicas.map(practica => {
        const fechaLimiteActa1 = addDays(practica.fechaInicio, this.CONFIGURACION_PLAZOS.PLAZO_ACTA_1);
        const diasRestantes = differenceInDays(fechaLimiteActa1, hoy);

        return {
          id: practica.id,
          alumno: {
            email: practica.alumno.usuario.email,
            nombre: practica.alumno.usuario.nombre,
            apellido: practica.alumno.usuario.apellido,
            rut: practica.alumno.usuario.rut
          },
          fechaInicio: practica.fechaInicio,
          carrera: {
            nombre: practica.alumno.carrera.nombre,
            sede: practica.alumno.carrera.sede
          },
          diasRestantes
        };
      });

    } catch (error) {
      console.error('Error al identificar prácticas con Acta 1 por expirar:', error);
      throw new Error('No se pudieron obtener las prácticas con Acta 1 por expirar');
    }
  }

  /**
   * HU-43: Identificar prácticas con aceptación docente próxima a expirar
   */
  static async identificarPracticasAceptacionDocentePorExpirar(): Promise<Array<{
    id: number;
    docente: {
      email: string;
      nombre: string;
      apellido: string;
    };
    alumno: {
      nombre: string;
      apellido: string;
      rut: string;
    };
    fechaCompletadoAlumno: Date;
    carrera: {
      nombre: string;
      sede: { nombre: string } | null;
    };
    diasRestantes: number;
  }>> {
    try {
      const hoy = new Date();

      const practicas = await prisma.practica.findMany({
        where: {
          estado: 'PENDIENTE_ACEPTACION_DOCENTE',
          fechaCompletadoAlumno: {
            not: null,
            lte: addDays(hoy, -(this.CONFIGURACION_PLAZOS.PLAZO_ACEPTACION_DOCENTE - this.CONFIGURACION_PLAZOS.DIAS_ALERTA_PREVIA))
          },
          // Verificar que no se haya enviado ya una alerta
          NOT: {
            alertasManuales: {
              some: {
                asunto: {
                  contains: 'Recordatorio: Aceptación de supervisión expira mañana'
                }
              }
            }
          }
        },
        include: {
          alumno: {
            include: {
              usuario: {
                select: {
                  nombre: true,
                  apellido: true,
                  rut: true
                }
              },
              carrera: {
                include: {
                  sede: {
                    select: {
                      nombre: true
                    }
                  }
                }
              }
            }
          },
          docente: {
            include: {
              usuario: {
                select: {
                  email: true,
                  nombre: true,
                  apellido: true
                }
              }
            }
          }
        }
      });

      return practicas.map(practica => {
        const fechaLimiteAceptacion = addDays(practica.fechaCompletadoAlumno!, this.CONFIGURACION_PLAZOS.PLAZO_ACEPTACION_DOCENTE);
        const diasRestantes = differenceInDays(fechaLimiteAceptacion, hoy);

        return {
          id: practica.id,
          docente: {
            email: practica.docente.usuario.email,
            nombre: practica.docente.usuario.nombre,
            apellido: practica.docente.usuario.apellido
          },
          alumno: {
            nombre: practica.alumno.usuario.nombre,
            apellido: practica.alumno.usuario.apellido,
            rut: practica.alumno.usuario.rut
          },
          fechaCompletadoAlumno: practica.fechaCompletadoAlumno!,
          carrera: {
            nombre: practica.alumno.carrera.nombre,
            sede: practica.alumno.carrera.sede
          },
          diasRestantes
        };
      });

    } catch (error) {
      console.error('Error al identificar prácticas con aceptación docente por expirar:', error);
      throw new Error('No se pudieron obtener las prácticas con aceptación docente por expirar');
    }
  }

  /**
   * HU-44: Identificar prácticas con otros hitos próximos
   */
  static async identificarPracticasHitosProximos(): Promise<{
    terminoProximo: Array<{
      id: number;
      alumno: { email: string; nombre: string; apellido: string; rut: string };
      docente: { email: string; nombre: string; apellido: string } | null;
      fechaTermino: Date;
      carrera: { nombre: string; sede: { nombre: string } | null };
      diasRestantes: number;
    }>;
    informePendiente: Array<{
      id: number;
      alumno: { email: string; nombre: string; apellido: string; rut: string };
      docente: { email: string; nombre: string; apellido: string } | null;
      fechaTermino: Date;
      carrera: { nombre: string; sede: { nombre: string } | null };
      diasVencido: number;
    }>;
  }> {
    try {
      const hoy = new Date();
      const fechaLimiteTermino = addDays(hoy, this.CONFIGURACION_PLAZOS.DIAS_ALERTA_TERMINO);
      const fechaLimiteInforme = addDays(hoy, -this.CONFIGURACION_PLAZOS.DIAS_ALERTA_INFORME);

      // Prácticas próximas a terminar
      const practicasTerminoProximo = await prisma.practica.findMany({
        where: {
          estado: 'EN_CURSO',
          fechaTermino: {
            gte: hoy,
            lte: fechaLimiteTermino
          }
        },
        include: {
          alumno: {
            include: {
              usuario: {
                select: {
                  email: true,
                  nombre: true,
                  apellido: true,
                  rut: true
                }
              },
              carrera: {
                include: {
                  sede: {
                    select: {
                      nombre: true
                    }
                  }
                }
              }
            }
          },
          docente: {
            include: {
              usuario: {
                select: {
                  email: true,
                  nombre: true,
                  apellido: true
                }
              }
            }
          }
        }
      });

      // Prácticas terminadas sin informe
      const practicasInformePendiente = await prisma.practica.findMany({
        where: {
          estado: 'FINALIZADA_PENDIENTE_EVAL',
          fechaTermino: {
            lte: fechaLimiteInforme
          },
          informeUrl: null
        },
        include: {
          alumno: {
            include: {
              usuario: {
                select: {
                  email: true,
                  nombre: true,
                  apellido: true,
                  rut: true
                }
              },
              carrera: {
                include: {
                  sede: {
                    select: {
                      nombre: true
                    }
                  }
                }
              }
            }
          },
          docente: {
            include: {
              usuario: {
                select: {
                  email: true,
                  nombre: true,
                  apellido: true
                }
              }
            }
          }
        }
      });

      return {
        terminoProximo: practicasTerminoProximo.map(practica => ({
          id: practica.id,
          alumno: {
            email: practica.alumno.usuario.email,
            nombre: practica.alumno.usuario.nombre,
            apellido: practica.alumno.usuario.apellido,
            rut: practica.alumno.usuario.rut
          },
          docente: practica.docente ? {
            email: practica.docente.usuario.email,
            nombre: practica.docente.usuario.nombre,
            apellido: practica.docente.usuario.apellido
          } : null,
          fechaTermino: practica.fechaTermino,
          carrera: {
            nombre: practica.alumno.carrera.nombre,
            sede: practica.alumno.carrera.sede
          },
          diasRestantes: differenceInDays(practica.fechaTermino, hoy)
        })),
        informePendiente: practicasInformePendiente.map(practica => ({
          id: practica.id,
          alumno: {
            email: practica.alumno.usuario.email,
            nombre: practica.alumno.usuario.nombre,
            apellido: practica.alumno.usuario.apellido,
            rut: practica.alumno.usuario.rut
          },
          docente: practica.docente ? {
            email: practica.docente.usuario.email,
            nombre: practica.docente.usuario.nombre,
            apellido: practica.docente.usuario.apellido
          } : null,
          fechaTermino: practica.fechaTermino,
          carrera: {
            nombre: practica.alumno.carrera.nombre,
            sede: practica.alumno.carrera.sede
          },
          diasVencido: differenceInDays(hoy, practica.fechaTermino)
        }))
      };

    } catch (error) {
      console.error('Error al identificar prácticas con hitos próximos:', error);
      throw new Error('No se pudieron obtener las prácticas con hitos próximos');
    }
  }

  /**
   * HU-46: Enviar alerta manual a un alumno
   */
  static async enviarAlertaManual(data: AlertaManualData): Promise<{
    success: boolean;
    error?: string;
    alertaId?: number;
  }> {
    try {
      // Verificar que la práctica existe
      const practica = await prisma.practica.findUnique({
        where: { id: data.practicaId },
        include: {
          alumno: {
            include: {
              usuario: {
                select: {
                  id: true,
                  email: true,
                  nombre: true,
                  apellido: true
                }
              }
            }
          }
        }
      });

      if (!practica) {
        return {
          success: false,
          error: 'Práctica no encontrada'
        };
      }

      // Registrar la alerta en la base de datos
      const alertaManual = await prisma.alertaManual.create({
        data: {
          practicaId: data.practicaId,
          asunto: data.asunto,
          mensaje: data.mensaje,
          enviadoPor: data.enviadoPor
        }
      });

      // Enviar el correo
      const emailResult = await EmailService.enviarAlertaManual({
        destinatarioEmail: practica.alumno.usuario.email,
        destinatarioNombre: `${practica.alumno.usuario.nombre} ${practica.alumno.usuario.apellido}`,
        asunto: data.asunto || 'Alerta de Práctica',
        mensaje: data.mensaje,
        enviadoPor: data.enviadoPor,
        practicaId: data.practicaId
      });

      if (!emailResult.success) {
        return {
          success: false,
          error: emailResult.error
        };
      }

      // Registrar auditoría
      await AuditoriaService.registrarEnvioEmail(
        1, // Sistema
        practica.alumno.usuario.id,
        'ENVIO_ALERTA_MANUAL',
        {
          destinatarioEmail: practica.alumno.usuario.email,
          destinatarioNombre: `${practica.alumno.usuario.nombre} ${practica.alumno.usuario.apellido}`,
          asunto: data.asunto || 'Alerta de Práctica',
          exitoso: true,
          emailId: emailResult.emailId
        },
        {
          tipo: 'AlertaManual',
          id: alertaManual.id.toString()
        }
      );

      return {
        success: true,
        alertaId: alertaManual.id
      };

    } catch (error) {
      console.error('Error al enviar alerta manual:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtener historial de alertas manuales para una práctica
   */
  static async obtenerHistorialAlertasManuales(practicaId: number) {
    try {
      const alertas = await prisma.alertaManual.findMany({
        where: {
          practicaId
        },
        orderBy: {
          fecha: 'desc'
        }
      });

      return alertas;
    } catch (error) {
      console.error('Error al obtener historial de alertas manuales:', error);
      throw new Error('No se pudo obtener el historial de alertas manuales');
    }
  }

  /**
   * Ejecutar todas las alertas automáticas
   */
  static async ejecutarTodasLasAlertasAutomaticas(): Promise<{
    success: boolean;
    alertasEnviadas: number;
    errores: string[];
  }> {
    const errores: string[] = [];
    let alertasEnviadas = 0;

    try {
      console.log('Iniciando proceso completo de alertas automáticas...');

      // 1. Alertas de prácticas sin cerrar (HU-45)
      const resultadoPendientes = await this.ejecutarAlertasAutomaticas();
      alertasEnviadas += resultadoPendientes.alertasEnviadas;
      errores.push(...resultadoPendientes.errores);

      // 2. Alertas de Acta 1 por expirar (HU-42)
      const practicasActa1 = await this.identificarPracticasActa1PorExpirar();
      for (const practica of practicasActa1) {
        try {
          const emailResult = await EmailService.enviarAlertaExpiracionActa1({
            alumnoEmail: practica.alumno.email,
            alumnoNombre: practica.alumno.nombre,
            alumnoApellido: practica.alumno.apellido,
            carreraNombre: practica.carrera.nombre,
            sedeNombre: practica.carrera.sede?.nombre || 'Sin sede',
            diasRestantes: practica.diasRestantes,
            practicaId: practica.id
          });

          if (emailResult.success) {
            alertasEnviadas++;
            // Registrar que se envió la alerta para evitar duplicados
            await prisma.alertaManual.create({
              data: {
                practicaId: practica.id,
                asunto: 'Recordatorio: Acta 1 expira mañana',
                mensaje: 'Alerta automática de expiración de Acta 1',
                enviadoPor: 'Sistema'
              }
            });
          } else {
            errores.push(`Error enviando alerta Acta 1 a ${practica.alumno.email}: ${emailResult.error}`);
          }
        } catch (error) {
          errores.push(`Error crítico enviando alerta Acta 1 a ${practica.alumno.email}: ${error}`);
        }
      }

      // 3. Alertas de aceptación docente por expirar (HU-43)
      const practicasAceptacion = await this.identificarPracticasAceptacionDocentePorExpirar();
      for (const practica of practicasAceptacion) {
        try {
          const emailResult = await EmailService.enviarAlertaExpiracionAceptacionDocente({
            docenteEmail: practica.docente.email,
            docenteNombre: practica.docente.nombre,
            docenteApellido: practica.docente.apellido,
            alumnoNombre: practica.alumno.nombre,
            alumnoApellido: practica.alumno.apellido,
            alumnoRut: practica.alumno.rut,
            carreraNombre: practica.carrera.nombre,
            sedeNombre: practica.carrera.sede?.nombre || 'Sin sede',
            diasRestantes: practica.diasRestantes,
            practicaId: practica.id
          });

          if (emailResult.success) {
            alertasEnviadas++;
            // Registrar que se envió la alerta para evitar duplicados
            await prisma.alertaManual.create({
              data: {
                practicaId: practica.id,
                asunto: 'Recordatorio: Aceptación de supervisión expira mañana',
                mensaje: 'Alerta automática de expiración de aceptación docente',
                enviadoPor: 'Sistema'
              }
            });
          } else {
            errores.push(`Error enviando alerta aceptación docente a ${practica.docente.email}: ${emailResult.error}`);
          }
        } catch (error) {
          errores.push(`Error crítico enviando alerta aceptación docente a ${practica.docente.email}: ${error}`);
        }
      }

      // 4. Alertas de hitos próximos (HU-44)
      const hitosProximos = await this.identificarPracticasHitosProximos();
      
      // Alertas de término próximo
      for (const practica of hitosProximos.terminoProximo) {
        try {
          const emailResult = await EmailService.enviarAlertaTerminoProximo({
            alumnoEmail: practica.alumno.email,
            alumnoNombre: practica.alumno.nombre,
            alumnoApellido: practica.alumno.apellido,
            fechaTermino: practica.fechaTermino,
            diasRestantes: practica.diasRestantes,
            carreraNombre: practica.carrera.nombre,
            sedeNombre: practica.carrera.sede?.nombre || 'Sin sede',
            practicaId: practica.id
          });

          if (emailResult.success) {
            alertasEnviadas++;
          } else {
            errores.push(`Error enviando alerta término próximo a ${practica.alumno.email}: ${emailResult.error}`);
          }

          // También enviar al docente si existe
          if (practica.docente) {
            const emailResultDocente = await EmailService.enviarAlertaTerminoProximoDocente({
              docenteEmail: practica.docente.email,
              docenteNombre: practica.docente.nombre,
              docenteApellido: practica.docente.apellido,
              alumnoNombre: practica.alumno.nombre,
              alumnoApellido: practica.alumno.apellido,
              fechaTermino: practica.fechaTermino,
              diasRestantes: practica.diasRestantes,
              carreraNombre: practica.carrera.nombre,
              sedeNombre: practica.carrera.sede?.nombre || 'Sin sede',
              practicaId: practica.id
            });

            if (emailResultDocente.success) {
              alertasEnviadas++;
            } else {
              errores.push(`Error enviando alerta término próximo docente a ${practica.docente.email}: ${emailResultDocente.error}`);
            }
          }
        } catch (error) {
          errores.push(`Error crítico enviando alerta término próximo: ${error}`);
        }
      }

      // Alertas de informe pendiente
      for (const practica of hitosProximos.informePendiente) {
        try {
          const emailResult = await EmailService.enviarAlertaInformePendiente({
            alumnoEmail: practica.alumno.email,
            alumnoNombre: practica.alumno.nombre,
            alumnoApellido: practica.alumno.apellido,
            fechaTermino: practica.fechaTermino,
            diasVencido: practica.diasVencido,
            carreraNombre: practica.carrera.nombre,
            sedeNombre: practica.carrera.sede?.nombre || 'Sin sede',
            practicaId: practica.id
          });

          if (emailResult.success) {
            alertasEnviadas++;
          } else {
            errores.push(`Error enviando alerta informe pendiente a ${practica.alumno.email}: ${emailResult.error}`);
          }
        } catch (error) {
          errores.push(`Error crítico enviando alerta informe pendiente: ${error}`);
        }
      }

      console.log(`Proceso completo de alertas terminado. Alertas enviadas: ${alertasEnviadas}, Errores: ${errores.length}`);

      return {
        success: errores.length < (alertasEnviadas + errores.length),
        alertasEnviadas,
        errores
      };

    } catch (error) {
      console.error('Error crítico en el proceso completo de alertas:', error);
      return {
        success: false,
        alertasEnviadas,
        errores: [...errores, `Error crítico: ${error}`]
      };
    }
  }

  /**
   * Ejecuta el proceso completo de alertas automáticas
   */
  static async ejecutarAlertasAutomaticas(): Promise<{
    success: boolean;
    alertasEnviadas: number;
    errores: string[];
  }> {
    const errores: string[] = [];
    let alertasEnviadas = 0;

    try {
      console.log('Iniciando proceso de alertas automáticas de prácticas...');

      // 1. Identificar prácticas pendientes
      const practicasPendientes = await this.identificarPracticasPendientes();
      
      if (practicasPendientes.length === 0) {
        console.log('No se encontraron prácticas pendientes de cierre');
        return { success: true, alertasEnviadas: 0, errores: [] };
      }

      console.log(`Encontradas ${practicasPendientes.length} prácticas pendientes de cierre`);

      // 2. Agrupar por coordinadores
      const resumenesCoordinadores = await this.agruparPorCoordinador(practicasPendientes);
      
      // 3. Agrupar por directores de carrera
      const resumenesDirectores = await this.agruparPorDirectorCarrera(practicasPendientes);

      // 4. Enviar alertas a coordinadores
      for (const resumen of resumenesCoordinadores) {
        try {
          const emailResult = await EmailService.enviarAlertaPracticasPendientes(resumen, 'COORDINADOR');
          
          if (emailResult.success) {
            alertasEnviadas++;
            
            // Registrar auditoría del envío
            await AuditoriaService.registrarEnvioEmail(
              1, // Sistema (usuario id 1 o usar un usuario del sistema)
              resumen.coordinadorId,
              'ALERTA_PRACTICAS_PENDIENTES',
              {
                destinatarioEmail: resumen.coordinadorEmail,
                destinatarioNombre: resumen.coordinadorNombre,
                asunto: `Alerta: ${resumen.resumen.total} prácticas pendientes de cierre`,
                exitoso: true,
                emailId: emailResult.emailId
              },
              {
                tipo: 'AlertaPracticas',
                id: `coord-${resumen.coordinadorId}`
              }
            );
          } else {
            errores.push(`Error enviando alerta a coordinador ${resumen.coordinadorNombre}: ${emailResult.error}`);
          }
        } catch (error) {
          errores.push(`Error crítico enviando alerta a coordinador ${resumen.coordinadorNombre}: ${error}`);
        }
      }

      // 5. Enviar alertas a directores de carrera
      for (const resumen of resumenesDirectores) {
        try {
          const emailResult = await EmailService.enviarAlertaPracticasPendientes(resumen, 'DIRECTOR_CARRERA');
          
          if (emailResult.success) {
            alertasEnviadas++;
            
            // Registrar auditoría del envío
            await AuditoriaService.registrarEnvioEmail(
              1, // Sistema
              resumen.coordinadorId,
              'ALERTA_PRACTICAS_PENDIENTES',
              {
                destinatarioEmail: resumen.coordinadorEmail,
                destinatarioNombre: resumen.coordinadorNombre,
                asunto: `Alerta: ${resumen.resumen.total} prácticas pendientes de cierre`,
                exitoso: true,
                emailId: emailResult.emailId
              },
              {
                tipo: 'AlertaPracticas',
                id: `dc-${resumen.coordinadorId}`
              }
            );
          } else {
            errores.push(`Error enviando alerta a director ${resumen.coordinadorNombre}: ${emailResult.error}`);
          }
        } catch (error) {
          errores.push(`Error crítico enviando alerta a director ${resumen.coordinadorNombre}: ${error}`);
        }
      }

      console.log(`Proceso completado. Alertas enviadas: ${alertasEnviadas}, Errores: ${errores.length}`);

      return {
        success: errores.length < (alertasEnviadas + errores.length),
        alertasEnviadas,
        errores
      };

    } catch (error) {
      console.error('Error crítico en el proceso de alertas automáticas:', error);
      return {
        success: false,
        alertasEnviadas,
        errores: [...errores, `Error crítico: ${error}`]
      };
    }
  }

  /**
   * Obtiene estadísticas de prácticas pendientes para dashboard
   */
  static async obtenerEstadisticasPracticasPendientes(sedeId?: number) {
    try {
      const practicasPendientes = await this.identificarPracticasPendientes();
      
      let practicasFiltradas = practicasPendientes;
      if (sedeId) {
        practicasFiltradas = practicasPendientes.filter(
          p => p.carrera.sede?.id === sedeId
        );
      }

      const estadisticas = {
        total: practicasFiltradas.length,
        criticas: practicasFiltradas.filter(p => p.criticidad === 'CRITICO').length,
        bajas: practicasFiltradas.filter(p => p.criticidad === 'BAJO').length,
        normales: practicasFiltradas.filter(p => p.criticidad === 'NORMAL').length,
        porCarrera: {} as Record<string, number>,
        promedioRetrasoEnDias: 0
      };

      // Agrupar por carrera
      practicasFiltradas.forEach(practica => {
        const nombreCarrera = practica.carrera.nombre;
        estadisticas.porCarrera[nombreCarrera] = (estadisticas.porCarrera[nombreCarrera] || 0) + 1;
      });

      // Calcular promedio de retraso
      if (practicasFiltradas.length > 0) {
        const totalRetraso = practicasFiltradas.reduce((sum, p) => sum + p.diasRetraso, 0);
        estadisticas.promedioRetrasoEnDias = Math.round(totalRetraso / practicasFiltradas.length);
      }

      return estadisticas;

    } catch (error) {
      console.error('Error al obtener estadísticas de prácticas pendientes:', error);
      throw new Error('No se pudieron obtener las estadísticas');
    }
  }

  /**
   * Agrupa prácticas pendientes por coordinador
   */
  private static async agruparPorCoordinador(practicasPendientes: PracticaPendiente[]): Promise<ResumenAlertasPorCoordinador[]> {
    try {
      const coordinadores = await prisma.usuario.findMany({
        where: {
          rol: { nombre: 'COORDINADOR' },
          estado: 'ACTIVO'
        },
        include: {
          sede: true
        }
      });

      const resumenesCoordinadores: ResumenAlertasPorCoordinador[] = [];

      for (const coordinador of coordinadores) {
        // Filtrar prácticas que corresponden a la sede del coordinador
        const practicasCoordinador = practicasPendientes.filter(
          practica => practica.carrera.sede?.id === coordinador.sedeId
        );

        if (practicasCoordinador.length > 0) {
          // Obtener carreras únicas de las prácticas
          const carrerasUnicas = Array.from(
            new Set(practicasCoordinador.map(p => p.carrera.id))
          );
          
          const carrerasNombres = Array.from(
            new Set(practicasCoordinador.map(p => p.carrera.nombre))
          );

          const resumen = {
            total: practicasCoordinador.length,
            criticas: practicasCoordinador.filter(p => p.criticidad === 'CRITICO').length,
            bajas: practicasCoordinador.filter(p => p.criticidad === 'BAJO').length,
            normales: practicasCoordinador.filter(p => p.criticidad === 'NORMAL').length
          };

          resumenesCoordinadores.push({
            coordinadorId: coordinador.id,
            coordinadorNombre: `${coordinador.nombre} ${coordinador.apellido}`,
            coordinadorEmail: coordinador.email,
            sedeId: coordinador.sedeId!,
            sedeNombre: coordinador.sede?.nombre || 'Sin sede',
            carrerasIds: carrerasUnicas,
            carrerasNombres,
            practicasPendientes: practicasCoordinador,
            resumen
          });
        }
      }

      return resumenesCoordinadores;

    } catch (error) {
      console.error('Error al agrupar por coordinador:', error);
      throw new Error('No se pudieron agrupar las prácticas por coordinador');
    }
  }

  /**
   * Agrupa prácticas pendientes por director de carrera
   */
  private static async agruparPorDirectorCarrera(practicasPendientes: PracticaPendiente[]): Promise<ResumenAlertasPorCoordinador[]> {
    try {
      const directores = await prisma.usuario.findMany({
        where: {
          rol: { nombre: 'DIRECTOR_CARRERA' },
          estado: 'ACTIVO'
        },
        include: {
          sede: true
        }
      });

      const resumenesDirectores: ResumenAlertasPorCoordinador[] = [];

      for (const director of directores) {
        // Filtrar prácticas que corresponden a la sede del director
        const practicasDirector = practicasPendientes.filter(
          practica => practica.carrera.sede?.id === director.sedeId
        );

        if (practicasDirector.length > 0) {
          // Obtener carreras únicas de las prácticas
          const carrerasUnicas = Array.from(
            new Set(practicasDirector.map(p => p.carrera.id))
          );
          
          const carrerasNombres = Array.from(
            new Set(practicasDirector.map(p => p.carrera.nombre))
          );

          const resumen = {
            total: practicasDirector.length,
            criticas: practicasDirector.filter(p => p.criticidad === 'CRITICO').length,
            bajas: practicasDirector.filter(p => p.criticidad === 'BAJO').length,
            normales: practicasDirector.filter(p => p.criticidad === 'NORMAL').length
          };

          resumenesDirectores.push({
            coordinadorId: director.id,
            coordinadorNombre: `${director.nombre} ${director.apellido}`,
            coordinadorEmail: director.email,
            sedeId: director.sedeId!,
            sedeNombre: director.sede?.nombre || 'Sin sede',
            carrerasIds: carrerasUnicas,
            carrerasNombres,
            practicasPendientes: practicasDirector,
            resumen
          });
        }
      }

      return resumenesDirectores;

    } catch (error) {
      console.error('Error al agrupar por director de carrera:', error);
      throw new Error('No se pudieron agrupar las prácticas por director de carrera');
    }
  }

  /**
   * Envía notificación al docente cuando un alumno sube su informe (HU-48)
   */
  static async notificarDocenteInformeSubido(practicaId: number): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Obtener los datos de la práctica
      const practica = await prisma.practica.findUnique({
        where: { id: practicaId },
        include: {
          alumno: {
            include: {
              usuario: {
                select: {
                  nombre: true,
                  apellido: true,
                  rut: true
                }
              },
              carrera: {
                select: {
                  nombre: true,
                  sede: {
                    select: {
                      nombre: true
                    }
                  }
                }
              }
            }
          },
          docente: {
            include: {
              usuario: {
                select: {
                  id: true,
                  email: true,
                  nombre: true,
                  apellido: true
                }
              }
            }
          },
          centroPractica: {
            select: {
              nombreEmpresa: true
            }
          }
        }
      });

      if (!practica) {
        return {
          success: false,
          error: 'Práctica no encontrada'
        };
      }

      if (!practica.docente || !practica.docente.usuario.email) {
        return {
          success: false,
          error: 'No se encontró el docente asignado o no tiene email'
        };
      }

      if (!practica.informeUrl) {
        return {
          success: false,
          error: 'No se ha subido el informe aún'
        };
      }

      // Enviar el correo
      const emailResult = await EmailService.notificarDocenteInformeSubido({
        docenteEmail: practica.docente.usuario.email,
        docenteNombre: `${practica.docente.usuario.nombre} ${practica.docente.usuario.apellido}`,
        alumnoNombre: `${practica.alumno.usuario.nombre} ${practica.alumno.usuario.apellido}`,
        alumnoRut: practica.alumno.usuario.rut,
        carreraNombre: practica.alumno.carrera.nombre,
        sedeNombre: practica.alumno.carrera.sede?.nombre || 'Sede no especificada',
        centroPractica: practica.centroPractica?.nombreEmpresa || 'Centro no especificado',
        fechaSubida: format(new Date(practica.updatedAt), 'dd/MM/yyyy HH:mm', { locale: es }),
        practicaId: practica.id
      });

      if (!emailResult.success) {
        return {
          success: false,
          error: emailResult.error || 'Error al enviar correo'
        };
      }

      // Registrar auditoría
      await AuditoriaService.registrarEnvioEmail(
        1, // Sistema
        practica.docente.usuario.id,
        'NOTIFICACION_DOCENTE_INFORME_SUBIDO',
        {
          destinatarioEmail: practica.docente.usuario.email,
          destinatarioNombre: `${practica.docente.usuario.nombre} ${practica.docente.usuario.apellido}`,
          asunto: `Informe de Práctica Subido - ${practica.alumno.usuario.nombre} ${practica.alumno.usuario.apellido}`,
          exitoso: true,
          emailId: emailResult.emailId
        },
        {
          tipo: 'Practica',
          id: practica.id.toString()
        }
      );

      return {
        success: true
      };
    } catch (error) {
      console.error('Error al notificar docente informe subido:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}

type PrismaQueryResult = {
  id: number;
  fechaInicio: Date;
  fechaTermino: Date;
  estado: EstadoPractica;
  tipo: string;
  alumno: {
    id: number;
    usuario: {
      nombre: string;
      apellido: string;
      rut: string;
      email: string;
    };
    carrera: {
      id: number;
      nombre: string;
      sede: {
        id: number;
        nombre: string;
      };
    };
  };
  docente: {
    id: number;
    usuario: {
      nombre: string;
      apellido: string;
      email: string;
    };
  } | null;
  centroPractica: {
    nombreEmpresa: string;
  } | null;
};
