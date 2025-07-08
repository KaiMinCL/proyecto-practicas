'use server';

import { z } from 'zod';
import { authorizeCoordinadorOrDirectorCarrera } from '@/lib/auth/checkRole';
import { ActasRepositorioService, type FiltrosRepositorioActas, type ActaHistorica } from '@/lib/services/actasRepositorioService';

// Esquema de validación para los filtros
const filtrosRepositorioSchema = z.object({
  alumnoQuery: z.string().optional(),
  sedeId: z.number().optional(),
  carreraId: z.number().optional(),
  anioAcademico: z.number().min(2020).max(2030).optional(),
  semestre: z.number().min(1).max(2).optional(),
  tipoActa: z.enum(['ACTA1', 'EVALUACION_INFORME', 'EVALUACION_EMPLEADOR', 'ACTA_FINAL']).optional()
});

export type ActionResponse<TData = null> = {
  success: boolean;
  data?: TData;
  error?: string;
  message?: string;
};

/**
 * Obtiene el historial de actas según los filtros aplicados
 * Accesible para Coordinadores y Directores de Carrera
 */
export async function obtenerActasHistoricasAction(
  filtros: FiltrosRepositorioActas
): Promise<ActionResponse<ActaHistorica[]>> {
  try {
    // Autorizar usuario (Coordinador o Director de Carrera)
    let userPayload;
    let esDirectorCarrera = false;
    
    try {
      userPayload = await authorizeCoordinadorOrDirectorCarrera();
      esDirectorCarrera = userPayload.rol === 'DIRECTOR_CARRERA';
    } catch (error) {
      console.error('Error de autorización:', error);
      return {
        success: false,
        error: 'No tienes permisos para acceder al repositorio de actas'
      };
    }

    // Validar filtros
    const validationResult = filtrosRepositorioSchema.safeParse(filtros);
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Filtros de búsqueda inválidos'
      };
    }

    // Obtener permisos del usuario
    let usuarioSedeId: number | undefined;
    let usuarioCarreraIds: number[] | undefined;

    if (esDirectorCarrera) {
      // Director de Carrera puede ver todas las carreras de su sede
      if (userPayload.carreraId) {
        const result = await ActasRepositorioService.obtenerCarrerasDisponibles(undefined, [userPayload.carreraId]);
        if (result.success && result.data && result.data.length > 0) {
          usuarioSedeId = undefined; // Puede ver de cualquier sede si es director
          usuarioCarreraIds = [userPayload.carreraId];
        }
      }
    } else {
      // Coordinador solo puede ver de su carrera y sede
      if (userPayload.carreraId) {
        usuarioCarreraIds = [userPayload.carreraId];
        // Obtener la sede de la carrera del coordinador
        const carrerasResult = await ActasRepositorioService.obtenerCarrerasDisponibles(undefined, [userPayload.carreraId]);
        if (carrerasResult.success && carrerasResult.data && carrerasResult.data.length > 0) {
          // Para coordinador, restringir solo a su carrera específica
        }
      }
    }

    // Obtener actas históricas
    const result = await ActasRepositorioService.obtenerActasHistoricas(
      validationResult.data,
      usuarioSedeId,
      usuarioCarreraIds
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Error al obtener el historial de actas'
      };
    }

    return {
      success: true,
      data: result.data,
      message: `Se encontraron ${result.data?.length || 0} actas en el historial`
    };

  } catch (error) {
    console.error('Error en obtenerActasHistoricasAction:', error);
    return {
      success: false,
      error: 'Error inesperado al obtener el historial de actas'
    };
  }
}

/**
 * Obtiene las sedes disponibles para el usuario actual
 */
export async function obtenerSedesDisponiblesAction(): Promise<ActionResponse<{ id: number; nombre: string }[]>> {
  try {
    // Autorizar usuario
    let userPayload;
    let esDirectorCarrera = false;
    
    try {
      userPayload = await authorizeCoordinadorOrDirectorCarrera();
      esDirectorCarrera = userPayload.rol === 'DIRECTOR_CARRERA';
    } catch (error) {
      console.error('Error de autorización:', error);
      return {
        success: false,
        error: 'No tienes permisos para acceder al repositorio de actas'
      };
    }

    // Determinar qué sedes puede ver
    let usuarioSedeId: number | undefined;
    
    if (!esDirectorCarrera && userPayload.carreraId) {
      // Para coordinador, obtener su sede específica
      const carrerasResult = await ActasRepositorioService.obtenerCarrerasDisponibles(undefined, [userPayload.carreraId]);
      if (carrerasResult.success && carrerasResult.data && carrerasResult.data.length > 0) {
        // El coordinador solo puede ver su propia sede (se manejará en el servicio)
      }
    }

    const result = await ActasRepositorioService.obtenerSedesDisponibles(usuarioSedeId);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Error al obtener las sedes'
      };
    }

    return {
      success: true,
      data: result.data
    };

  } catch (error) {
    console.error('Error en obtenerSedesDisponiblesAction:', error);
    return {
      success: false,
      error: 'Error inesperado al obtener las sedes'
    };
  }
}

/**
 * Obtiene las carreras disponibles para el usuario actual (opcionalmente filtradas por sede)
 */
export async function obtenerCarrerasDisponiblesAction(sedeId?: number): Promise<ActionResponse<{ 
  id: number; 
  nombre: string; 
  sede: { nombre: string }; 
}[]>> {
  try {
    // Autorizar usuario
    let userPayload;
    let esDirectorCarrera = false;
    
    try {
      userPayload = await authorizeCoordinadorOrDirectorCarrera();
      esDirectorCarrera = userPayload.rol === 'DIRECTOR_CARRERA';
    } catch (error) {
      console.error('Error de autorización:', error);
      return {
        success: false,
        error: 'No tienes permisos para acceder al repositorio de actas'
      };
    }

    // Determinar qué carreras puede ver
    let usuarioCarreraIds: number[] | undefined;
    
    if (!esDirectorCarrera && userPayload.carreraId) {
      usuarioCarreraIds = [userPayload.carreraId];
    }

    const result = await ActasRepositorioService.obtenerCarrerasDisponibles(sedeId, usuarioCarreraIds);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Error al obtener las carreras'
      };
    }

    return {
      success: true,
      data: result.data
    };

  } catch (error) {
    console.error('Error en obtenerCarrerasDisponiblesAction:', error);
    return {
      success: false,
      error: 'Error inesperado al obtener las carreras'
    };
  }
}
