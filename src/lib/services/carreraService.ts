import prisma from '@/lib/prisma';
import type { CarreraInput } from '@/lib/validators/carrera'; 
import { Prisma, type Estado } from '@prisma/client';

export class CarreraService {
  /**
   * Obtiene todas las carreras, incluyendo la información de la sede asociada.
   */
  static async getCarreras() {
    try {
      const carreras = await prisma.carrera.findMany({
        include: {
          sede: { // Incluye el nombre de la sede para mostrar en la tabla
            select: {
              id: true,
              nombre: true,
            },
          },
        },
        orderBy: [ // Ordenar por nombre de sede y luego por nombre de carrera
          { sede: { nombre: 'asc' } },
          { nombre: 'asc' },
        ],
      });
      return { success: true, data: carreras };
    } catch (error) {
      console.error('Error al obtener carreras:', error);
      return { success: false, error: 'Error al obtener las carreras.' };
    }
  }

  /**
   * Crea una nueva carrera.
   * Verifica la unicidad del nombre de la carrera dentro de la sede.
   */
  static async createCarrera(data: CarreraInput) {
    try {
      // Verificar que no exista una carrera con el mismo nombre en la misma sede
      const existingCarrera = await prisma.carrera.findUnique({
        where: {
          nombre_sedeId: {
            nombre: data.nombre,
            sedeId: data.sedeId,
          },
        },
      });

      if (existingCarrera) {
        return {
          success: false,
          error: `Ya existe una carrera con el nombre "${data.nombre}" en la sede seleccionada.`,
        };
      }

      const carrera = await prisma.carrera.create({
        data: {
          ...data,
          estado: 'ACTIVO', // Por defecto al crear
        },
        include: { // Devolver con la info de la sede para consistencia
            sede: { select: { id: true, nombre: true }}
        }
      });
      return { success: true, data: carrera };
    } catch (error) {
      console.error('Error al crear carrera:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { success: false, error: 'Error de unicidad: Ya existe una carrera con este nombre en la sede.'};
      }
      return { success: false, error: 'Error al crear la carrera.' };
    }
  }

  /**
   * Obtiene una carrera por su ID.
   */
  static async getCarreraById(id: number) {
    try {
      const carrera = await prisma.carrera.findUnique({
        where: { id },
        include: {
          sede: { select: { id: true, nombre: true } },
        },
      });
      if (!carrera) {
        return { success: false, error: 'Carrera no encontrada.' };
      }
      return { success: true, data: carrera };
    } catch (error) {
      console.error(`Error al obtener carrera con ID ${id}:`, error);
      return { success: false, error: 'Error al obtener la carrera.' };
    }
  }


  /**
   * Actualiza una carrera existente.
   * Verifica la unicidad del nombre de la carrera dentro de la sede si el nombre o sede cambian.
   */
  static async updateCarrera(id: number, data: CarreraInput) {
    try {
      // Verificar que la carrera actual existe
      const currentCarrera = await prisma.carrera.findUnique({ where: { id } });
      if (!currentCarrera) {
        return { success: false, error: 'Carrera no encontrada para actualizar.' };
      }

      // Si el nombre o sedeId ha cambiado, verificar la unicidad del nuevo nombre en la (nueva o misma) sede
      if (data.nombre !== currentCarrera.nombre || data.sedeId !== currentCarrera.sedeId) {
        const existingCarreraWithNewName = await prisma.carrera.findUnique({
          where: {
            nombre_sedeId: {
              nombre: data.nombre,
              sedeId: data.sedeId,
            },
            // Asegurarse de que no sea la misma carrera que estamos editando
            NOT: {
              id: id, 
            },
          },
        });

        if (existingCarreraWithNewName) {
          return {
            success: false,
            error: `Ya existe otra carrera con el nombre "${data.nombre}" en la sede seleccionada.`,
          };
        }
      }
      
      const carrera = await prisma.carrera.update({
        where: { id },
        data: {
          ...data,
          // estado no se modifica aquí, se usa activate/deactivate
        },
        include: { // Devolver con la info de la sede para consistencia
            sede: { select: { id: true, nombre: true }}
        }
      });
      return { success: true, data: carrera };
    } catch (error) {
      console.error(`Error al actualizar carrera con ID ${id}:`, error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { success: false, error: 'Error de unicidad: Ya existe una carrera con este nombre en la sede.'};
      }
      return { success: false, error: 'Error al actualizar la carrera.' };
    }
  }

  /**
   * Cambia el estado de una carrera (ACTIVO/INACTIVO).
   */
  private static async toggleCarreraEstado(id: number, nuevoEstado: Estado) {
    try {
      const carreraExists = await prisma.carrera.findUnique({ where: { id } });
      if (!carreraExists) {
        return { success: false, error: `Carrera no encontrada para ${nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar'}.` };
      }

       if (carreraExists.estado === nuevoEstado) {
        return { 
            success: true, 
            data: carreraExists,
            message: `La carrera ya se encuentra ${nuevoEstado === 'ACTIVO' ? 'activa' : 'inactiva'}.`
        };
    }

      const carrera = await prisma.carrera.update({
        where: { id },
        data: { estado: nuevoEstado },
        include: {
            sede: { select: { id: true, nombre: true }}
        }
      });
      return { success: true, data: carrera };
    } catch (error) {
      console.error(`Error al ${nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar'} carrera:`, error);
      return { success: false, error: `Error al ${nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar'} la carrera.` };
    }
  }
  
  /**
   * Desactiva una carrera.
   */
  static async deactivateCarrera(id: number) {
    return this.toggleCarreraEstado(id, 'INACTIVO');
  }

  /**
   * Activa una carrera.
   */
  static async activateCarrera(id: number) {
    return this.toggleCarreraEstado(id, 'ACTIVO');
  }
}