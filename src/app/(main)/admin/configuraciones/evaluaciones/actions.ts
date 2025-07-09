'use server';

import { revalidatePath } from 'next/cache';

import { authorizeSuperAdminOrDirectorCarrera } from '@/lib/auth/checkRole';
import { ConfiguracionService } from '@/lib/services/configuracionService';
import { 
    configuracionEvaluacionSchema, 
    type ConfiguracionEvaluacionInput,
    type ConfiguracionEvaluacion as ConfiguracionEvaluacionType
} from '@/lib/validators/configuracion';

export type ActionResponse<TData = null> = {
  success: boolean;
  data?: TData;
  error?: string;
  errors?: { field: string | number | (string | number)[]; message: string }[];
  message?: string;
};

/**
 * Obtiene la configuración actual de ponderación de evaluaciones.
 * Accesible por SuperAdmin o Director de Carrera.
 */
export async function getConfiguracionEvaluacionAction(): Promise<ActionResponse<ConfiguracionEvaluacionType>> {
  try {
    await authorizeSuperAdminOrDirectorCarrera();
    
    const result = await ConfiguracionService.getConfiguracionEvaluacion();

    if (result.success && result.data) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error || 'Error desconocido al obtener la configuración.' };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }; // Errores de autorización o inesperados
    }
    return { success: false, error: 'Ocurrió un error inesperado al obtener la configuración.' };
  }
}

/**
 * Actualiza la configuración de ponderación de evaluaciones.
 * Accesible por SuperAdmin o Director de Carrera.
 * @param data Los nuevos porcentajes de ponderación.
 */
export async function updateConfiguracionEvaluacionAction(
  data: ConfiguracionEvaluacionInput
): Promise<ActionResponse<ConfiguracionEvaluacionType>> {
  try {
    await authorizeSuperAdminOrDirectorCarrera();

    // Validar los datos con Zod antes de pasarlos al servicio
    const validationResult = configuracionEvaluacionSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Error de validación. Por favor, revisa los campos.',
        errors: validationResult.error.errors.map((e) => ({ field: e.path, message: e.message })),
      };
    }

    const result = await ConfiguracionService.updateConfiguracionEvaluacion(validationResult.data);

    if (result.success && result.data) {
      // Revalidar la ruta donde se muestra esta configuración, si es una página específica.
      revalidatePath('/admin/configuraciones/evaluaciones');
      
      return { success: true, data: result.data, message: "Configuración de ponderación actualizada exitosamente." };
    }
    return { success: false, error: result.error || 'Error desconocido al actualizar la configuración.' };
  } catch (error) {
    // El ZodError ya se maneja arriba. Aquí podrían caer otros errores.
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Ocurrió un error inesperado al actualizar la configuración.' };
  }
}