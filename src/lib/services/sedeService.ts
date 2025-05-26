import prisma from '@/lib/prisma';
import type { SedeInput } from '@/lib/validators/sede';

export class SedeService {
  /**
   * Obtiene todas las sedes del sistema.
   */
  static async getSedes() {
    try {
      const sedes = await prisma.sede.findMany({
        orderBy: {
          nombre: 'asc'
        }
      });

      return { success: true, data: sedes };
    } catch (error) {
      console.error('Error al obtener sedes:', error);
      return { 
        success: false, 
        error: 'Error al obtener las sedes' 
      };
    }
  }

  /**
   * Obtiene todas las sedes activas del sistema.
   */
  static async getSedesActivas() {
    try {
      const sedes = await prisma.sede.findMany({
        where: {
          estado: 'ACTIVO'
        },
        select: {
          id: true,
          nombre: true,
        },
        orderBy: {
          nombre: 'asc'
        }
      });

      return { success: true, data: sedes };
    } catch (error) {
      console.error('Error al obtener sedes activas:', error);
      return { 
        success: false, 
        error: 'Error al obtener las sedes activas' 
      };
    }
  }

  /**
   * Crea una nueva sede.
   */
  static async createSede(data: SedeInput) {
    try {
      // Verificar que no exista una sede con el mismo nombre
      const existingSede = await prisma.sede.findFirst({
        where: {
          nombre: data.nombre,
        }
      });

      if (existingSede) {
        return {
          success: false,
          error: 'Ya existe una sede con ese nombre'
        };
      }

      const sede = await prisma.sede.create({
        data: {
          ...data,
          estado: 'ACTIVO'
        }
      });

      return { success: true, data: sede };
    } catch (error) {
      console.error('Error al crear sede:', error);
      return { 
        success: false, 
        error: 'Error al crear la sede'
      };
    }
  }

  /**
   * Actualiza una sede existente.
   */
  static async updateSede(id: string, data: SedeInput) {
    try {
      // Verificar que la sede existe
      const existingSede = await prisma.sede.findUnique({
        where: { id: Number(id) }
      });

      if (!existingSede) {
        return {
          success: false,
          error: 'No se encontró la sede'
        };
      }

      // Verificar que no exista otra sede con el mismo nombre
      const duplicateSede = await prisma.sede.findFirst({
        where: {
          nombre: data.nombre,
          id: { not: Number(id) }
        }
      });

      if (duplicateSede) {
        return {
          success: false,
          error: 'Ya existe otra sede con ese nombre'
        };
      }

      const sede = await prisma.sede.update({
        where: { id: Number(id) },
        data
      });

      return { success: true, data: sede };
    } catch (error) {
      console.error('Error al actualizar sede:', error);
      return { 
        success: false, 
        error: 'Error al actualizar la sede'
      };
    }
  }

  /**
   * Desactiva una sede.
   */
  static async deactivateSede(id: string) {
    try {
      const sede = await prisma.sede.update({
        where: { id: Number(id) },
        data: { estado: 'INACTIVO' }
      });

      return { success: true, data: sede };
    } catch (error) {
      console.error('Error al desactivar sede:', error);
      return { 
        success: false, 
        error: 'Error al desactivar la sede'
      };
    }
  }

  /**
   * Activa una sede existente.
   */
  static async activateSede(id: string) {
    try {
      const sedeId = Number(id);
      if (isNaN(sedeId)) {
        return { success: false, error: 'ID de sede inválido.' };
      }

      const existingSede = await prisma.sede.findUnique({
        where: { id: sedeId },
      });

      if (!existingSede) {
        return {
          success: false,
          error: 'No se encontró la sede para activar.',
        };
      }

      if (existingSede.estado === 'ACTIVO') {
        // Opcional: puedes considerarlo un éxito si ya está activa, o un error/advertencia.
        // Por consistencia con deactivateSede, lo trataré como un caso que no requiere acción.
        return {
          success: true, 
          data: existingSede, 
          message: 'La sede ya se encuentra activa.' // Mensaje informativo
        };
      }

      const sede = await prisma.sede.update({
        where: { id: sedeId },
        data: { estado: 'ACTIVO' },
      });

      return { success: true, data: sede };
    } catch (error) {
      console.error('Error al activar sede:', error);
      return { 
        success: false, 
        error: 'Error interno al intentar activar la sede.',
      };
    }
  }
}
