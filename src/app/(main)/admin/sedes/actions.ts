'use server';

import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';

import { SedeService } from '@/lib/services/sedeService';
import { sedeSchema, type SedeInput, type Sede } from '@/lib/validators/sede';
import { authorizeSuperAdmin } from '@/lib/auth/checkRole';

export type ActionResponse<TData = null> = {
  success: boolean;
  data?: TData;
  error?: string; // Mensaje de error general
  errors?: { field: string | number | (string | number)[]; message: string }[];
};

/**
 * Obtiene todas las sedes. Requiere rol de Super Administrador.
 */
export async function listSedesAction(): Promise<ActionResponse<Sede[]>> {
  try {
    await authorizeSuperAdmin();
    const result = await SedeService.getSedes();

    if (result.success && result.data) {
      return { success: true, data: result.data as Sede[] };
    }
    return { success: false, error: result.error || 'Error desconocido al listar las sedes.' };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Ocurrió un error inesperado al listar las sedes.' };
  }
}

/**
 * Crea una nueva sede. Requiere rol de Super Administrador.
 * @param data Los datos para la nueva sede.
 */
export async function createSedeAction(data: SedeInput): Promise<ActionResponse<Sede>> {
  try {
    await authorizeSuperAdmin();
    const validatedData = sedeSchema.parse(data);

    const result = await SedeService.createSede(validatedData);

    if (result.success && result.data) {
      revalidatePath('/admin/sedes');
      return { success: true, data: result.data as Sede };
    }
    return { success: false, error: result.error || 'Error desconocido al crear la sede.' };

  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: 'Error de validación. Por favor, revisa los campos.',
        errors: error.errors.map((e) => ({ field: e.path, message: e.message })),
      };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Ocurrió un error inesperado al crear la sede.' };
  }
}

/**
 * Actualiza una sede existente. Requiere rol de Super Administrador.
 * @param id El ID de la sede a actualizar (como string, SedeService lo maneja).
 * @param data Los datos para actualizar la sede.
 */
export async function updateSedeAction(id: string, data: SedeInput): Promise<ActionResponse<Sede>> {
  try {
    await authorizeSuperAdmin();
    const validatedData = sedeSchema.parse(data);

    const result = await SedeService.updateSede(id, validatedData);

    if (result.success && result.data) {
      revalidatePath('/admin/sedes'); // Invalida el listado

      // Considerar revalidar una ruta específica:
      // revalidatePath(`/admin/sedes/${id}`); 

      return { success: true, data: result.data as Sede };
    }
    return { success: false, error: result.error || 'Error desconocido al actualizar la sede.' };

  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: 'Error de validación. Por favor, revisa los campos.',
        errors: error.errors.map((e) => ({ field: e.path, message: e.message })),
      };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Ocurrió un error inesperado al actualizar la sede.' };
  }
}

/**
 * Desactiva una sede. Requiere rol de Super Administrador.
 * @param id El ID de la sede a desactivar (como string).
 */
export async function deactivateSedeAction(id: string): Promise<ActionResponse<Sede>> {
  try {
    await authorizeSuperAdmin();
    const result = await SedeService.deactivateSede(id);

    if (result.success && result.data) {
      revalidatePath('/admin/sedes');
      // revalidatePath(`/admin/sedes/${id}`);
      return { success: true, data: result.data as Sede };
    }
    return { success: false, error: result.error || 'Error desconocido al desactivar la sede.' };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Ocurrió un error inesperado al desactivar la sede.' };
  }
}