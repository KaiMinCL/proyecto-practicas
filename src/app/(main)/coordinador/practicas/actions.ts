'use server';

import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';
import { Prisma, TipoPractica as PrismaTipoPracticaEnum } from '@prisma/client';

import { authorizeCoordinador } from '@/lib/auth/checkRole';
import { PracticaService } from '@/lib/services/practicaService';
import { AlumnoService } from '@/lib/services/alumnoService';
import { DocenteService } from '@/lib/services/docenteService';
import { 
    iniciarPracticaSchema, 
    type IniciarPracticaInput, 
    type PracticaConDetalles 
} from '@/lib/validators/practica';

// Definición de ActionResponse
export type ActionResponse<TData = null> = {
  success: boolean;
  data?: TData;
  error?: string;
  errors?: { field: string | number | (string | number)[]; message: string }[];
  message?: string;
};

// Tipos para las opciones de los selectores
export type AlumnoOption = {
  value: number; label: string; rut: string; nombreCompleto: string;
  carreraId: number; carreraNombre: string; carreraHorasLaboral: number;
  carreraHorasProfesional: number; sedeIdDeCarrera: number; sedeNombreDeCarrera: string;
};
export type DocenteOption = { value: number; label: string; };

export async function getAlumnosParaFormAction(): Promise<ActionResponse<AlumnoOption[]>> {
  try {
    await authorizeCoordinador();
    const result = await AlumnoService.getAlumnosParaSeleccion();
    return result;
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: 'Error inesperado obteniendo alumnos.' };
  }
}

export async function getDocentesParaFormAction(params: { carreraId: number }): Promise<ActionResponse<DocenteOption[]>> {
  try {
    await authorizeCoordinador();
    const result = await DocenteService.getDocentesParaSeleccion({ carreraId: params.carreraId });
    return result;
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: 'Error inesperado obteniendo docentes.' };
  }
}

export async function sugerirFechaTerminoAction(
  fechaInicioStr: string,
  tipoPractica: PrismaTipoPracticaEnum,
  carreraId: number
): Promise<ActionResponse<{ fechaTerminoSugerida: string }>> {
  try {
    await authorizeCoordinador();
    const fechaInicio = new Date(fechaInicioStr);

    // Validaciones básicas de entrada
    if (isNaN(fechaInicio.getTime())) {
        return { success: false, error: "Fecha de inicio inválida." };
    }
    if (!carreraId || carreraId <= 0) {
        return { success: false, error: "ID de carrera inválido." };
    }
    if (!Object.values(PrismaTipoPracticaEnum).includes(tipoPractica)) {
        return { success: false, error: "Tipo de práctica inválido." };
    }

    const result = await PracticaService.sugerirFechaTermino(fechaInicio, tipoPractica, carreraId);
    
   if (result.success && result.data) {
      return { success: true, data: { fechaTerminoSugerida: result.data.toISOString().split('T')[0] } };
    }
    return { success: false, error: result.error || "No se pudo calcular la fecha de término sugerida." };

  }  catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error inesperado al sugerir fecha de término.';
    console.error("Error en sugerirFechaTerminoAction:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function iniciarPracticaAction(
  data: IniciarPracticaInput,
  alumnoCarreraId: number
): Promise<ActionResponse<PracticaConDetalles>> {
  try {
    await authorizeCoordinador();
    const validatedData = iniciarPracticaSchema.parse(data);
    const result = await PracticaService.iniciarPracticaCoordinador(validatedData, alumnoCarreraId);

    if (result.success && result.data) {
      revalidatePath('/coordinador/practicas'); // Asume esta ruta para la lista de prácticas
      // TODO: Notificación al Alumno
      return { success: true, data: result.data as PracticaConDetalles };
    }
    return result; // Devuelve el resultado del servicio (puede tener error específico)
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: 'Error de validación. Por favor, revisa los campos.',
        errors: error.errors.map((e) => ({ field: e.path, message: e.message })),
      };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
            const fieldName = (error.meta as { field_name?: string })?.field_name || 'desconocido';
            return { success: false, error: `Error de referencia: El campo '${fieldName}' apunta a un registro inexistente.` };
        }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Ocurrió un error inesperado al iniciar la práctica.' };
  }
}