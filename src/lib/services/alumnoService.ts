import prisma from '@/lib/prisma';
import { CreateAlumnoFormData } from '@/lib/validators';
import { hashPassword } from '@/lib/auth';
import { generateSecurePassword } from '@/lib/utils';

export interface CreateAlumnoResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  initialPassword?: string;
}

export class AlumnoService {
  /**
   * Crea un nuevo alumno y su cuenta de usuario asociada.
   * @param data Los datos del alumno a crear
   * @returns Objeto con el resultado de la operación
   */  
  static async createAlumnoUser(data: CreateAlumnoFormData): Promise<CreateAlumnoResponse> {
    try {
      // 1. Verificar que el RUT no exista como usuario alumno
      const existingUser = await prisma.usuario.findFirst({
        select: {
          id: true,
          rut: true
        },
        where: {
          rut: data.rut,
          rol: {
            nombre: 'Alumno'
          }
        }
      });

      if (existingUser) {
        return {
          success: false,
          message: 'Ya existe un alumno registrado con este RUT.',
          errors: {
            rut: ['Ya existe un alumno registrado con este RUT.']
          }
        };
      }

      // 2. Verificar que la carrera exista
      const carrera = await prisma.carrera.findUnique({
        where: { id: data.carreraId }
      });

      if (!carrera) {
        return {
          success: false,
          message: 'La carrera seleccionada no existe.',
          errors: {
            carreraId: ['La carrera seleccionada no existe.']
          }
        };
      }

      // 3. Generar contraseña inicial
      const initialPassword = generateSecurePassword();
      const hashedPassword = await hashPassword(initialPassword);      
      // 4. Crear el usuario y alumno en una transacción
      await prisma.$transaction(async (tx) => {
        // 4.1 Crear el usuario
        const usuario = await tx.usuario.create({
          data: {
            rut: data.rut,
            nombre: data.nombre,
            apellido: data.apellido,
            password: hashedPassword,
            email: '', // El email se puede actualizar después
            estado: 'ACTIVO',
            rol: {
              connect: {
                nombre: 'Alumno'
              }
            }
          }
        });

        // 4.2 Crear el alumno
        await tx.alumno.create({
          data: {
            usuario: {
              connect: {
                id: usuario.id
              }
            },
            carrera: {
              connect: {
                id: data.carreraId
              }
            }
          }
        });

        return usuario;
      });

      return {
        success: true,
        message: 'Alumno creado exitosamente.',
        initialPassword
      };

    } catch (error) {
      console.error('Error al crear alumno:', error);
      return {
        success: false,
        message: 'Error al crear el alumno.',
        errors: {
          general: ['Ha ocurrido un error inesperado. Por favor, intente de nuevo.']
        }
      };
    }
  }
}
