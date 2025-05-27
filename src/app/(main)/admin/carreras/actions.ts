'use server';

import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';

import { authorizeSuperAdmin } from '@/lib/auth/checkRole';
import { CarreraService } from '@/lib/services/carreraService';
import { SedeService } from '@/lib/services/sedeService';
import { carreraSchema, type CarreraInput, type Carrera } from '@/lib/validators/carrera';

import type { Sede as SedeType } from '@/lib/validators/sede'; 

// Definición de ActionResponse
export type ActionResponse<TData = null> = {
  success: boolean;
  data?: TData;
  error?: string; // Mensaje de error general
  errors?: { field: string | number | (string | number)[]; message: string }[]; // Errores específicos de Zod
  message?: string; // Para mensajes informativos (ej. "ya está activo/inactivo")
};

/**
 * Obtiene la lista de sedes activas (solo id y nombre).
 */
export async function getActiveSedesAction(): Promise<ActionResponse<Pick<SedeType, 'id' | 'nombre'>[]>> {
  try {
    const result = await SedeService.getSedesActivas(); // Este método ya selecciona solo id y nombre
    
    if (result.success && result.data) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error || 'Error desconocido al obtener las sedes activas.' };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Ocurrió un error inesperado al obtener las sedes activas.' };
  }
}

/**
 * Obtiene todas las carreras, incluyendo el nombre de la sede.
 */
export async function listCarrerasAction(): Promise<ActionResponse<Carrera[]>> {
  try {
    await authorizeSuperAdmin();
    const result = await CarreraService.getCarreras();

    if (result.success && result.data) {
      return { success: true, data: result.data as Carrera[] };
    }
    return { success: false, error: result.error || 'Error desconocido al listar las carreras.' };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Ocurrió un error inesperado al listar las carreras.' };
  }
}

/**
 * Crea una nueva carrera.
 */
export async function createCarreraAction(data: CarreraInput): Promise<ActionResponse<Carrera>> {
  try {
    await authorizeSuperAdmin();
    const validatedData = carreraSchema.parse(data);

    const result = await CarreraService.createCarrera(validatedData);

    if (result.success && result.data) {
      revalidatePath('/admin/carreras');
      return { success: true, data: result.data as Carrera };
    }
    // Si CarreraService.createCarrera devuelve un error por duplicado, se pasará aquí
    return { success: false, error: result.error || 'Error desconocido al crear la carrera.' };
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
    return { success: false, error: 'Ocurrió un error inesperado al crear la carrera.' };
  }
}

/**
 * Actualiza una carrera existente.
 */
export async function updateCarreraAction(id: string, data: CarreraInput): Promise<ActionResponse<Carrera>> {
  try {
    await authorizeSuperAdmin();
    const carreraId = parseInt(id, 10);
    if (isNaN(carreraId)) {
      return { success: false, error: 'ID de carrera inválido.' };
    }

    const validatedData = carreraSchema.parse(data);
    const result = await CarreraService.updateCarrera(carreraId, validatedData);

    if (result.success && result.data) {
      revalidatePath('/admin/carreras');
      return { success: true, data: result.data as Carrera };
    }
    return { success: false, error: result.error || 'Error desconocido al actualizar la carrera.' };
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
    return { success: false, error: 'Ocurrió un error inesperado al actualizar la carrera.' };
  }
}

/**
 * Desactiva una carrera.
 */
export async function deactivateCarreraAction(id: string): Promise<ActionResponse<Carrera>> {
  try {
    await authorizeSuperAdmin();
    const carreraId = parseInt(id, 10);
    if (isNaN(carreraId)) {
      return { success: false, error: 'ID de carrera inválido.' };
    }
    
    const result = await CarreraService.deactivateCarrera(carreraId);

    if (result.success && result.data) {
      revalidatePath('/admin/carreras');
      return { success: true, data: result.data as Carrera, message: result.message };
    }
    return { success: false, error: result.error || 'Error desconocido al desactivar la carrera.' };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Ocurrió un error inesperado al desactivar la carrera.' };
  }
}

/**
 * Activa una carrera.
 */
export async function activateCarreraAction(id: string): Promise<ActionResponse<Carrera>> {
  try {
    await authorizeSuperAdmin();
    const carreraId = parseInt(id, 10);
    if (isNaN(carreraId)) {
      return { success: false, error: 'ID de carrera inválido.' };
    }

    const result = await CarreraService.activateCarrera(carreraId);
    if (result.success && result.data) {
      revalidatePath('/admin/carreras');
      return { success: true, data: result.data as Carrera, message: result.message };
    }
    return { success: false, error: result.error || 'Error desconocido al activar la carrera.' };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Ocurrió un error inesperado al activar la carrera.' };
  }
}