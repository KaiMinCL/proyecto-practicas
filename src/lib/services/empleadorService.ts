import prisma from '@/lib/prisma';
import { CreateEmpleadorFormData } from '@/lib/validators/empleador';
import { hashPassword } from '@/lib/auth';
import { generateSecurePassword } from '@/lib/utils';

export interface CreateEmpleadorResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  initialPassword?: string;
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
}
