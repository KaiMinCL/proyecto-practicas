import prisma from '@/lib/prisma';
import { CreateEmpleadorFormData } from '@/lib/validators/empleador';
import { EvaluacionEmpleadorInput } from '@/lib/validators/evaluacion';
import { hashPassword } from '@/lib/auth-utils';
import { generateSecurePassword } from '@/lib/utils';

export interface CreateEmpleadorResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  initialPassword?: string;
}

export interface PracticaAsignada {
  id: number;
  alumno: {
    id: number;
    usuario: {
      nombre: string;
      apellido: string;
      email: string;
    };
    carrera: {
      nombre: string;
    };
  };
  tipo: string;
  fechaInicio: Date;
  fechaTermino: Date;
  estado: string;
  centroPractica?: {
    nombreEmpresa: string;
  } | null;
  evaluacionEmpleador?: {
    id: number;
    nota: number;
    fecha: Date;
  } | null;
  actaFinal?: {
    notaFinal: number;
  } | null;
}

export interface EmpleadorPracticasResponse {
  success: boolean;
  message: string;
  practicas?: PracticaAsignada[];
  errors?: Record<string, string[]>;
}

export interface GuardarEvaluacionResponse {
  success: boolean;
  message: string;
  evaluacionId?: number;
  errors?: Record<string, string[]>;
}

export class EmpleadorService {
  /**
   * Crea un nuevo empleador y su cuenta de usuario asociada.
   * @param data Los datos del empleador a crear
   * @returns Objeto con el resultado de la operación
   */
  static async createEmpleadorUser(data: CreateEmpleadorFormData): Promise<CreateEmpleadorResponse> {
    try {
      // 1. Verificar que el email no exista como usuario empleador
      const existingUser = await prisma.usuario.findFirst({
        select: {
          id: true,
          email: true
        },
        where: {
          email: data.email,
          rol: {
            nombre: 'Empleador'
          }
        }
      });

      if (existingUser) {
        return {
          success: false,
          message: 'Ya existe un empleador registrado con este email.',
          errors: {
            email: ['Ya existe un empleador registrado con este email.']
          }
        };
      }

      // 2. Verificar que el centro de práctica exista
      const centroPractica = await prisma.centroPractica.findUnique({
        where: { id: data.centroPracticaId }
      });

      if (!centroPractica) {
        return {
          success: false,
          message: 'El centro de práctica seleccionado no existe.',
          errors: {
            centroPracticaId: ['El centro de práctica seleccionado no existe.']
          }
        };
      }

      // 3. Generar contraseña inicial
      const initialPassword = generateSecurePassword();
      const hashedPassword = await hashPassword(initialPassword);

      // 4. Crear el usuario y empleador en una transacción
      await prisma.$transaction(async (tx) => {
        // 4.1 Crear el usuario
        const usuario = await tx.usuario.create({
          data: {
            rut: data.rut,
            nombre: data.nombre,
            apellido: data.apellido,
            email: data.email,
            password: hashedPassword,
            claveInicialVisible: true,
            estado: 'ACTIVO',
            rol: {
              connect: {
                nombre: 'Empleador'
              }
            }
          }
        });

        // 4.2 Crear el empleador y su relación con el centro de práctica
        const empleador = await tx.empleador.create({
          data: {
            usuario: {
              connect: {
                id: usuario.id
              }
            },
            centros: {
              create: {
                centroPractica: {
                  connect: {
                    id: data.centroPracticaId
                  }
                }
              }
            }
          }
        });

        return empleador;
      });

      return {
        success: true,
        message: 'Empleador creado exitosamente.',
        initialPassword
      };

    } catch (error) {
      console.error('Error al crear empleador:', error);
      return {
        success: false,
        message: 'Error al crear el empleador.',
        errors: {
          general: ['Ha ocurrido un error inesperado. Por favor, intente de nuevo.']
        }
      };
    }
  }
  /**
   * Obtiene las prácticas asignadas a un empleador específico.
   * @param empleadorId El ID del empleador
   * @returns Objeto con el resultado de la operación
   */
  static async getPracticasByEmpleador(empleadorId: number): Promise<EmpleadorPracticasResponse> {
    try {
      // Primero obtener los centros de práctica del empleador
      const empleadorCentros = await prisma.empleadorCentro.findMany({
        where: {
          empleadorId
        },
        select: {
          centroPracticaId: true
        }
      });

      const centroIds = empleadorCentros.map(ec => ec.centroPracticaId);

      // Obtener prácticas de esos centros que están EN_CURSO o FINALIZADA_PENDIENTE_EVAL
      const practicasRaw = await prisma.practica.findMany({
        where: {
          centroPracticaId: {
            in: centroIds
          },
          estado: {
            in: ['EN_CURSO', 'FINALIZADA_PENDIENTE_EVAL', 'EVALUACION_COMPLETA']
          }
        },
        include: {
          alumno: {
            include: {
              usuario: true,
              carrera: true
            }
          },
          centroPractica: true,
          evaluacionEmpleador: true,
          actaFinal: true
        },
        orderBy: {
          fechaInicio: 'desc'
        }
      });

      // Mapear a la estructura esperada
      const practicas: PracticaAsignada[] = practicasRaw.map(practica => ({
        id: practica.id,
        alumno: {
          id: practica.alumno.id,
          usuario: {
            nombre: practica.alumno.usuario.nombre,
            apellido: practica.alumno.usuario.apellido,
            email: practica.alumno.usuario.email
          },
          carrera: {
            nombre: practica.alumno.carrera.nombre
          }
        },
        tipo: practica.tipo,
        fechaInicio: practica.fechaInicio,
        fechaTermino: practica.fechaTermino,
        estado: practica.estado,
        centroPractica: practica.centroPractica ? {
          nombreEmpresa: practica.centroPractica.nombreEmpresa
        } : null,
        evaluacionEmpleador: practica.evaluacionEmpleador ? {
          id: practica.evaluacionEmpleador.id,
          nota: practica.evaluacionEmpleador.nota,
          fecha: practica.evaluacionEmpleador.fecha
        } : null,
        actaFinal: practica.actaFinal ? {
          notaFinal: practica.actaFinal.notaFinal
        } : null
      }));

      return {
        success: true,
        message: 'Prácticas obtenidas exitosamente.',
        practicas
      };

    } catch (error) {
      console.error('Error al obtener prácticas del empleador:', error);
      return {
        success: false,
        message: 'Error al obtener las prácticas del empleador.',
        errors: {
          general: ['Ha ocurrido un error inesperado. Por favor, intente de nuevo.']
        }
      };
    }
  }

  /**
   * Obtiene una práctica específica asignada a un empleador.
   * @param empleadorId El ID del empleador
   * @param practicaId El ID de la práctica
   * @returns Objeto con el resultado de la operación
   */
  static async getPracticaByEmpleador(empleadorId: number, practicaId: number): Promise<EmpleadorPracticasResponse> {
    try {
      // Verificar que el empleador tenga acceso a esta práctica
      const empleadorCentros = await prisma.empleadorCentro.findMany({
        where: {
          empleadorId
        },
        select: {
          centroPracticaId: true
        }
      });

      const centroIds = empleadorCentros.map(ec => ec.centroPracticaId);

      const practicaRaw = await prisma.practica.findFirst({
        where: {
          id: practicaId,
          centroPracticaId: {
            in: centroIds
          }
        },
        include: {
          alumno: {
            include: {
              usuario: true,
              carrera: true
            }
          },
          centroPractica: true,
          evaluacionEmpleador: true,
          actaFinal: true
        }
      });

      if (!practicaRaw) {
        return {
          success: false,
          message: 'Práctica no encontrada o no tiene acceso a ella.',
          errors: {
            practica: ['Práctica no encontrada o no tiene acceso a ella.']
          }
        };
      }

      // Mapear a la estructura esperada
      const practica: PracticaAsignada = {
        id: practicaRaw.id,
        alumno: {
          id: practicaRaw.alumno.id,
          usuario: {
            nombre: practicaRaw.alumno.usuario.nombre,
            apellido: practicaRaw.alumno.usuario.apellido,
            email: practicaRaw.alumno.usuario.email
          },
          carrera: {
            nombre: practicaRaw.alumno.carrera.nombre
          }
        },
        tipo: practicaRaw.tipo,
        fechaInicio: practicaRaw.fechaInicio,
        fechaTermino: practicaRaw.fechaTermino,
        estado: practicaRaw.estado,
        centroPractica: practicaRaw.centroPractica ? {
          nombreEmpresa: practicaRaw.centroPractica.nombreEmpresa
        } : null,
        evaluacionEmpleador: practicaRaw.evaluacionEmpleador ? {
          id: practicaRaw.evaluacionEmpleador.id,
          nota: practicaRaw.evaluacionEmpleador.nota,
          fecha: practicaRaw.evaluacionEmpleador.fecha
        } : null,
        actaFinal: practicaRaw.actaFinal ? {
          notaFinal: practicaRaw.actaFinal.notaFinal
        } : null
      };

      return {
        success: true,
        message: 'Práctica obtenida exitosamente.',
        practicas: [practica]
      };

    } catch (error) {
      console.error('Error al obtener práctica del empleador:', error);
      return {
        success: false,
        message: 'Error al obtener la práctica del empleador.',
        errors: {
          general: ['Ha ocurrido un error inesperado. Por favor, intente de nuevo.']
        }
      };
    }
  }
  /**
   * Guarda o actualiza una evaluación de empleador para una práctica.
   * @param empleadorId El ID del empleador que realiza la evaluación
   * @param evaluacionData Los datos de la evaluación
   * @returns Objeto con el resultado de la operación
   */
  static async guardarEvaluacion(empleadorId: number, evaluacionData: EvaluacionEmpleadorInput): Promise<GuardarEvaluacionResponse> {
    try {
      console.log(`[EmpleadorService] Guardando evaluación - Empleador: ${empleadorId}, Práctica: ${evaluacionData.practicaId}`);
      
      // 1. Verificar que el empleador tenga acceso a esta práctica
      const empleadorCentros = await prisma.empleadorCentro.findMany({
        where: {
          empleadorId
        },
        select: {
          centroPracticaId: true
        }
      });

      const centroIds = empleadorCentros.map(ec => ec.centroPracticaId);
      console.log(`[EmpleadorService] Centros del empleador: ${centroIds.join(', ')}`);

      const practica = await prisma.practica.findFirst({
        where: {
          id: evaluacionData.practicaId,
          centroPracticaId: {
            in: centroIds
          }
        }
      });

      if (!practica) {
        console.log(`[EmpleadorService] Práctica no encontrada o sin acceso - ID: ${evaluacionData.practicaId}`);
        return {
          success: false,
          message: 'Práctica no encontrada o no tiene acceso a ella.',
          errors: {
            practica: ['Práctica no encontrada o no tiene acceso a ella.']
          }
        };
      }

      // 2. Verificar que la práctica esté en estado válido para evaluación
      const estadosValidos = ['EN_CURSO', 'FINALIZADA_PENDIENTE_EVAL', 'EVALUACION_COMPLETA'];
      if (!estadosValidos.includes(practica.estado)) {
        console.log(`[EmpleadorService] Estado de práctica inválido: ${practica.estado}`);
        return {
          success: false,
          message: 'La práctica no está en un estado válido para evaluación.',
          errors: {
            estado: ['La práctica no está en un estado válido para evaluación.']
          }
        };
      }

      // 3. Validar que la nota final esté en rango válido
      if (evaluacionData.notaFinal < 1 || evaluacionData.notaFinal > 7) {
        console.log(`[EmpleadorService] Nota final fuera de rango: ${evaluacionData.notaFinal}`);
        return {
          success: false,
          message: 'La nota final debe estar entre 1.0 y 7.0.',
          errors: {
            notaFinal: ['La nota final debe estar entre 1.0 y 7.0.']
          }
        };
      }

      // 4. Guardar o actualizar la evaluación
      const evaluacionGuardada = await prisma.evaluacionEmpleador.upsert({
        where: {
          practicaId: evaluacionData.practicaId
        },
        update: {
          nota: evaluacionData.notaFinal,
          comentarios: evaluacionData.comentarios || null
        },
        create: {
          practicaId: evaluacionData.practicaId,
          nota: evaluacionData.notaFinal,
          comentarios: evaluacionData.comentarios || null
        }
      });

      console.log(`[EmpleadorService] Evaluación guardada con ID: ${evaluacionGuardada.id}`);

      // 5. Actualizar el estado de la práctica si es necesario
      if (practica.estado === 'FINALIZADA_PENDIENTE_EVAL') {
        await prisma.practica.update({
          where: { id: evaluacionData.practicaId },
          data: { estado: 'EVALUACION_COMPLETA' }
        });
        console.log(`[EmpleadorService] Estado de práctica actualizado a EVALUACION_COMPLETA`);
      }

      return {
        success: true,
        message: 'Evaluación guardada exitosamente.',
        evaluacionId: evaluacionGuardada.id
      };

    } catch (error) {
      console.error('[EmpleadorService] Error al guardar evaluación:', error);
      return {
        success: false,
        message: 'Error al guardar la evaluación.',
        errors: {
          general: ['Ha ocurrido un error inesperado. Por favor, intente de nuevo.']
        }
      };
    }
  }

  /**
   * Obtiene una evaluación existente de empleador para una práctica.
   * @param empleadorId El ID del empleador
   * @param practicaId El ID de la práctica
   * @returns Objeto con la evaluación si existe
   */
  static async getEvaluacion(empleadorId: number, practicaId: number) {
    try {
      // Verificar acceso del empleador a la práctica
      const empleadorCentros = await prisma.empleadorCentro.findMany({
        where: {
          empleadorId
        },
        select: {
          centroPracticaId: true
        }
      });

      const centroIds = empleadorCentros.map(ec => ec.centroPracticaId);

      const evaluacion = await prisma.evaluacionEmpleador.findFirst({
        where: {
          practicaId,
          practica: {
            centroPracticaId: {
              in: centroIds
            }
          }
        },
        include: {
          practica: {
            include: {
              alumno: {
                include: {
                  usuario: true,
                  carrera: true
                }
              },
              centroPractica: true
            }
          }
        }
      });

      return evaluacion;

    } catch (error) {
      console.error('Error al obtener evaluación:', error);
      return null;
    }
  }
}
