import prisma from '@/lib/prisma';
import { CreateAlumnoFormData } from '@/lib/validators';
import { hashPassword } from '@/lib/auth-utils';
import { generateSecurePassword } from '@/lib/utils';
import { Prisma } from '@prisma/client';

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

  /**
   * Obtiene una lista de alumnos formateada para selección en formularios.
   * Incluye RUT, nombre completo, y detalles de su carrera y sede.
   */
  static async getAlumnosParaSeleccion() {
    try {
      const alumnos = await prisma.alumno.findMany({
        where: {
          usuario: {
            estado: 'ACTIVO', 
          },
        },
        select: {
          id: true,
          usuario: {
            select: {
              rut: true,
              nombre: true,
              apellido: true,
            },
          },
          carrera: {
            select: {
              id: true,
              nombre: true,
              horasPracticaLaboral: true,
              horasPracticaProfesional: true,
              sede: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
        orderBy: [
          { usuario: { apellido: 'asc' } },
          { usuario: { nombre: 'asc' } },
        ],
      });

      const formattedAlumnos = alumnos.map(a => ({
        value: a.id,
        label: `${a.usuario.apellido}, <span class="math-inline">\{a\.usuario\.nombre\} \(</span>{a.usuario.rut}) - Carrera: ${a.carrera.nombre} (Sede: ${a.carrera.sede.nombre})`,
        rut: a.usuario.rut,
        nombreCompleto: `${a.usuario.nombre} ${a.usuario.apellido}`,
        carreraId: a.carrera.id,
        carreraNombre: a.carrera.nombre,
        carreraHorasLaboral: a.carrera.horasPracticaLaboral,
        carreraHorasProfesional: a.carrera.horasPracticaProfesional,
        sedeIdDeCarrera: a.carrera.sede.id,
        sedeNombreDeCarrera: a.carrera.sede.nombre,
      }));
      return { success: true, data: formattedAlumnos };
    } catch (error) {
      console.error('Error al obtener alumnos para selección:', error);
      return { success: false, error: 'No se pudieron obtener los alumnos.' };
    }
  }

  /**
   * Actualiza la URL de la foto de perfil para un Alumno específico.
   * @param alumnoId El ID del registro Alumno.
   * @param fotoUrl La nueva URL de la foto.
   */
  static async updateFotoUrl(alumnoId: number, fotoUrl: string) {
    try {
      const updatedAlumno = await prisma.alumno.update({
        where: { id: alumnoId },
        data: { fotoUrl: fotoUrl },
      });
      return { success: true, data: updatedAlumno };
    } catch (error) {
      console.error(`Error al actualizar foto de perfil para el alumno ID ${alumnoId}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // Error de registro no encontrado
        return { success: false, error: 'Alumno no encontrado para actualizar la foto.' };
      }
      return { success: false, error: 'Error al guardar la URL de la foto en la base de datos.' };
    }
  }
}
