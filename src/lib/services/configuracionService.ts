import prisma from '@/lib/prisma';
import type { ConfiguracionEvaluacionInput, ConfiguracionEvaluacion as ConfiguracionEvaluacionType } from '@/lib/validators/configuracion';

const CONFIGURACION_ID = 1; // ID fijo para la única fila de configuración

export class ConfiguracionService {
  /**
   * Obtiene la configuración de ponderación de evaluaciones.
   * Si no existe, la crea con valores por defecto (ej. 50/50).
   */
  static async getConfiguracionEvaluacion(): Promise<{ success: boolean; data?: ConfiguracionEvaluacionType; error?: string }> {
    try {
      let configuracion = await prisma.configuracionEvaluacion.findUnique({
        where: { id: CONFIGURACION_ID },
      });

      if (!configuracion) {
        // Si no existe, crear con valores por defecto, usaremos 50/50 como placeholder si no existe.
        configuracion = await prisma.configuracionEvaluacion.create({
          data: {
            id: CONFIGURACION_ID,
            porcentajeInforme: 50,
            porcentajeEmpleador: 50,
          },
        });
      }
      return { success: true, data: configuracion };
    } catch (error) {
      console.error('Error al obtener la configuración de evaluación:', error);
      return { success: false, error: 'No se pudo obtener la configuración de evaluación.' };
    }
  }

  /**
   * Actualiza la configuración de ponderación de evaluaciones.
   * Los datos ya deben venir validados por Zod (suma de porcentajes = 100).
   */
  static async updateConfiguracionEvaluacion(
    data: ConfiguracionEvaluacionInput
  ): Promise<{ success: boolean; data?: ConfiguracionEvaluacionType; error?: string }> {
    try {
        // Validar que la suma de porcentajes sea 100
      const configuracion = await prisma.configuracionEvaluacion.upsert({
        where: { id: CONFIGURACION_ID },
        update: {
          porcentajeInforme: data.porcentajeInforme,
          porcentajeEmpleador: data.porcentajeEmpleador,
        },
        create: { // Si por alguna razón no existe, la crea
          id: CONFIGURACION_ID,
          porcentajeInforme: data.porcentajeInforme,
          porcentajeEmpleador: data.porcentajeEmpleador,
        },
      });
      return { success: true, data: configuracion };
    } catch (error) {
      console.error('Error al actualizar la configuración de evaluación:', error);
      // Manejar errores específicos de Prisma si es necesario
      return { success: false, error: 'No se pudo actualizar la configuración de evaluación.' };
    }
  }
}