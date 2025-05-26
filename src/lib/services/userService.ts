import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { generateInitialPassword } from '@/lib/utils';
import { CreateUserFormData, UpdateUserFormData } from '@/lib/validators';
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
      const existingUserByRut = await prisma.usuario.findUnique({
        where: { rut: data.rut }
      });

      const existingUserByEmail = await prisma.usuario.findUnique({
        where: { email: data.email }
      });

      const errors: Record<string, string[]> = {};

      if (existingUserByRut) {
        errors.rut = ["Ya existe un usuario con este RUT."];
      }

      if (existingUserByEmail) {
        errors.email = ["Ya existe un usuario con este email."];
      }

      if (Object.keys(errors).length > 0) {
        return {
          success: false,
          message: "Usuario no pudo ser creado debido a datos duplicados.",
          errors
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

  /**
   * Obtiene un usuario por su ID.
   * @param id ID del usuario a buscar
   * @returns El usuario si existe, null si no
   */
  static async getUserById(id: number) {
    try {
      const user = await prisma.usuario.findUnique({
        where: { id },
        include: {
          rol: true,
          sede: true,
        },
      });

      return user;
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      return null;
    }
  }

  /**
   * Actualiza los datos de un usuario existente.
   * @param data Los datos actualizados del usuario
   * @returns Objeto con el resultado de la operación
   */
  static async updateUser(data: UpdateUserFormData): Promise<CreateUserResponse> {
    try {
      // 1. Verificar que el email no exista (excepto para el mismo usuario)
      const existingUserByEmail = await prisma.usuario.findFirst({
        where: {
          AND: [
            { email: data.email },
            { id: { not: data.id } }
          ]
        }
      });

      if (existingUserByEmail) {
        return {
          success: false,
          message: "No se pudo actualizar el usuario.",
          errors: {
            email: ["Ya existe otro usuario con este email."]
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

      // 3. Actualizar el usuario
      const user = await prisma.usuario.update({
        where: { id: data.id },
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          rolId: rol.id,
          sedeId: data.sedeId,
        },
        include: {
          rol: true,
        }
      });

      // 4. Actualizar o crear registro de docente según corresponda
      if (data.rol === 'Docente') {
        await prisma.docente.upsert({
          where: { usuarioId: user.id },
          create: { usuarioId: user.id },
          update: {}
        });
      } else {
        // Si el usuario era docente y ahora no, eliminar el registro
        await prisma.docente.deleteMany({
          where: { usuarioId: user.id }
        });
      }

      return {
        success: true,
        message: "Usuario actualizado exitosamente."
      };

    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      return {
        success: false,
        message: "Error al actualizar el usuario.",
        errors: {
          general: ["Ha ocurrido un error inesperado. Por favor, intente de nuevo."]
        }
      };
    }
  }

  /**
   * Desactiva un usuario en el sistema.
   * @param id ID del usuario a desactivar
   * @returns Objeto con el resultado de la operación
   */
  static async deactivateUser(id: number): Promise<CreateUserResponse> {
    try {
      const usuario = await prisma.usuario.update({
        where: { id },
        data: {
          estado: 'INACTIVO'
        },
        include: {
          rol: true
        }
      });

      return {
        success: true,
        message: "Usuario desactivado exitosamente."
      };

    } catch (error) {
      console.error('Error al desactivar usuario:', error);
      return {
        success: false,
        message: "Error al desactivar el usuario.",
        errors: {
          general: ["Ha ocurrido un error inesperado. Por favor, intente de nuevo."]
        }
      };
    }
  }

  /**
   * Reactiva un usuario en el sistema.
   * @param id ID del usuario a reactivar
   * @returns Objeto con el resultado de la operación
   */
  static async reactivateUser(id: number): Promise<CreateUserResponse> {
    try {
      const usuario = await prisma.usuario.update({
        where: { id },
        data: {
          estado: 'ACTIVO'
        },
        include: {
          rol: true
        }
      });

      return {
        success: true,
        message: "Usuario reactivado exitosamente."
      };

    } catch (error) {
      console.error('Error al reactivar usuario:', error);
      return {
        success: false,
        message: "Error al reactivar el usuario.",
        errors: {
          general: ["Ha ocurrido un error inesperado. Por favor, intente de nuevo."]
        }
      };
    }
  }
}
