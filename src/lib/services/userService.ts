import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { generateInitialPassword } from '@/lib/utils';
import { CreateUserFormData } from '@/lib/validators';
import { Prisma } from '@prisma/client';

export interface CreateUserResponse {
  success: boolean;
  message: string;
  initialPassword?: string;
  errors?: Record<string, string[]>;
}

/**
 * Servicio para la creación de usuarios en el sistema.
 * Maneja la creación de diferentes tipos de usuarios (DC, Coord, Doc).
 */
export class UserService {
  /**
   * Crea un nuevo usuario en el sistema.
   * @param data Los datos del nuevo usuario
   * @returns Objeto con el resultado de la operación
   */
  static async createUser(data: CreateUserFormData): Promise<CreateUserResponse> {
    try {
      // 1. Validar que el RUT y email no existan
      const existingUser = await prisma.usuario.findFirst({
        where: {
          OR: [
            { rut: data.rut },
            { email: data.email }
          ]
        }
      });

      if (existingUser) {
        return {
          success: false,
          message: "Usuario no pudo ser creado.",
          errors: {
            general: ["Ya existe un usuario con este RUT o email."]
          }
        };
      }

      // 2. Obtener rol por nombre
      const rol = await prisma.rol.findUnique({
        where: { nombre: data.rol }
      });

      if (!rol) {
        return {
          success: false,
          message: "Rol no encontrado.",
          errors: {
            rol: ["El rol especificado no existe."]
          }
        };
      }

      // 3. Generar contraseña inicial y hashearla
      const initialPassword = generateInitialPassword();
      const hashedPassword = await hashPassword(initialPassword);

      // 4. Crear el usuario
      const user = await prisma.usuario.create({
        data: {
          rut: data.rut,
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          password: hashedPassword,
          claveInicialVisible: true,
          estado: 'ACTIVO',
          rolId: rol.id,
          sedeId: data.sedeId,
        },
        include: {
          rol: true,
        }
      });

      // 5. Si es docente, crear el registro en la tabla Docente
      if (data.rol === 'Docente') {
        await prisma.docente.create({
          data: {
            usuarioId: user.id
          }
        });
      }

      return {
        success: true,
        message: "Usuario creado exitosamente.",
        initialPassword
      };

    } catch (error) {
      console.error('Error al crear usuario:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Manejar errores específicos de Prisma
        if (error.code === 'P2002') {
          return {
            success: false,
            message: "Error de datos duplicados.",
            errors: {
              general: ["Ya existe un usuario con este RUT o email."]
            }
          };
        }
      }
      
      return {
        success: false,
        message: "Error al crear el usuario.",
        errors: {
          general: ["Ha ocurrido un error inesperado. Por favor, intente de nuevo."]
        }
      };
    }
  }
}
