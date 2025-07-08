import prisma from '@/lib/prisma';
import { EmailService, type AlertaPracticasPendientesData } from '@/lib/email';
import { AuditoriaService } from '@/lib/services/auditoria';
import { addDays, format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

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

/**
 * Servicio para gestionar alertas automáticas de prácticas sin cerrar
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
    ] as const,
    // Estados que consideramos como cerradas (no alertar)
    ESTADOS_CERRADOS: ['CERRADA', 'ANULADA']
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
            in: this.CONFIGURACION_CRITICIDAD.ESTADOS_NO_CERRADOS as any
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

      return practicasPendientes.map(practica => {
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
   * Agrupa las prácticas pendientes por coordinador/sede para envío de alertas
   */
  static async agruparPorCoordinador(practicasPendientes: PracticaPendiente[]): Promise<ResumenAlertasPorCoordinador[]> {
    try {
      // Obtener coordinadores activos con sus sedes/carreras asignadas
      const coordinadores = await prisma.usuario.findMany({
        where: {
          rol: { nombre: 'COORDINADOR' },
          estado: 'ACTIVO'
        },
        include: {
          sede: true
        }
      });

      const resumenes: ResumenAlertasPorCoordinador[] = [];

      for (const coordinador of coordinadores) {
        if (!coordinador.sede) continue;

        // Filtrar prácticas que corresponden a la sede del coordinador
        const practicasDelCoordinador = practicasPendientes.filter(
          practica => practica.carrera.sede?.id === coordinador.sede!.id
        );

        if (practicasDelCoordinador.length === 0) continue;

        // Obtener carreras únicas para este coordinador
        const carrerasUnicas = [...new Set(practicasDelCoordinador.map(p => p.carrera.id))];
        const carrerasNombres = [...new Set(practicasDelCoordinador.map(p => p.carrera.nombre))];

        // Calcular resumen de criticidad
        const resumen = {
          total: practicasDelCoordinador.length,
          criticas: practicasDelCoordinador.filter(p => p.criticidad === 'CRITICO').length,
          bajas: practicasDelCoordinador.filter(p => p.criticidad === 'BAJO').length,
          normales: practicasDelCoordinador.filter(p => p.criticidad === 'NORMAL').length
        };

        resumenes.push({
          coordinadorId: coordinador.id,
          coordinadorNombre: `${coordinador.nombre} ${coordinador.apellido}`,
          coordinadorEmail: coordinador.email,
          sedeId: coordinador.sede.id,
          sedeNombre: coordinador.sede.nombre,
          carrerasIds: carrerasUnicas,
          carrerasNombres,
          practicasPendientes: practicasDelCoordinador,
          resumen
        });
      }

      return resumenes;

    } catch (error) {
      console.error('Error al agrupar prácticas por coordinador:', error);
      throw new Error('No se pudieron agrupar las prácticas por coordinador');
    }
  }

  /**
   * También envía alertas a Directores de Carrera
   */
  static async agruparPorDirectorCarrera(practicasPendientes: PracticaPendiente[]): Promise<ResumenAlertasPorCoordinador[]> {
    try {
      // Obtener directores de carrera activos
      const directores = await prisma.usuario.findMany({
        where: {
          rol: { nombre: 'DIRECTOR_CARRERA' },
          estado: 'ACTIVO'
        },
        include: {
          sede: true
        }
      });

      const resumenes: ResumenAlertasPorCoordinador[] = [];

      for (const director of directores) {
        if (!director.sede) continue;

        // Filtrar prácticas que corresponden a la sede del director
        const practicasDelDirector = practicasPendientes.filter(
          practica => practica.carrera.sede?.id === director.sede!.id
        );

        if (practicasDelDirector.length === 0) continue;

        // Obtener carreras únicas para este director
        const carrerasUnicas = [...new Set(practicasDelDirector.map(p => p.carrera.id))];
        const carrerasNombres = [...new Set(practicasDelDirector.map(p => p.carrera.nombre))];

        // Calcular resumen de criticidad
        const resumen = {
          total: practicasDelDirector.length,
          criticas: practicasDelDirector.filter(p => p.criticidad === 'CRITICO').length,
          bajas: practicasDelDirector.filter(p => p.criticidad === 'BAJO').length,
          normales: practicasDelDirector.filter(p => p.criticidad === 'NORMAL').length
        };

        resumenes.push({
          coordinadorId: director.id,
          coordinadorNombre: `${director.nombre} ${director.apellido}`,
          coordinadorEmail: director.email,
          sedeId: director.sede.id,
          sedeNombre: director.sede.nombre,
          carrerasIds: carrerasUnicas,
          carrerasNombres,
          practicasPendientes: practicasDelDirector,
          resumen
        });
      }

      return resumenes;

    } catch (error) {
      console.error('Error al agrupar prácticas por director de carrera:', error);
      throw new Error('No se pudieron agrupar las prácticas por director de carrera');
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
}
