import prisma from '@/lib/prisma';

export class SedeService {
  /**
   * Obtiene todas las sedes activas del sistema.
   * @returns Lista de sedes activas
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
      console.error('Error al obtener sedes:', error);
      return { 
        success: false, 
        error: 'Error al obtener las sedes'
      };
    }
  }
}
