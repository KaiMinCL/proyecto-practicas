'use server';

import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';
import { Prisma, TipoPractica as PrismaTipoPracticaEnum } from '@prisma/client';

import { authorizeCoordinador } from '@/lib/auth/checkRole';
import { PracticaService, calculateFechaTerminoSugerida } from '@/lib/services/practicaService';
import { AlumnoService } from '@/lib/services/alumnoService';
import { DocenteService } from '@/lib/services/docenteService';
import { 
    iniciarPracticaSchema, 
    type IniciarPracticaInput, 
    type PracticaConDetalles 
} from '@/lib/validators/practica';
import prismaClient from '@/lib/prisma';

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
    if (isNaN(fechaInicio.getTime())) {
        return { success: false, error: "Fecha de inicio inválida." };
    }

    const carrera = await prismaClient.carrera.findUnique({ where: { id: carreraId } });
    if (!carrera) {
      return { success: false, error: "Carrera no encontrada." };
    }

    let horasRequeridas: number;
    if (tipoPractica === PrismaTipoPracticaEnum.LABORAL) {
      horasRequeridas = carrera.horasPracticaLaboral;
    } else if (tipoPractica === PrismaTipoPracticaEnum.PROFESIONAL) {
      horasRequeridas = carrera.horasPracticaProfesional;
    } else {
      return { success: false, error: "Tipo de práctica inválido." };
    }
    if (horasRequeridas <= 0) {
        return { success: false, error: `La carrera "${carrera.nombre}" no tiene horas configuradas para la práctica de tipo ${tipoPractica.toLowerCase()}.` };
    }
    
    const fechaTerminoSugerida = calculateFechaTerminoSugerida(fechaInicio, horasRequeridas);
    return { success: true, data: { fechaTerminoSugerida: fechaTerminoSugerida.toISOString().split('T')[0] } };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error al sugerir fecha de término.';
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
    return result;
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: 'Error de validación. Por favor, revisa los campos.',
        errors: error.errors.map((e) => ({ field: e.path, message: e.message })),
      };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        const fieldName = (error.meta as any)?.field_name || 'desconocido';
        return { success: false, error: `Error de referencia: El campo '${fieldName}' apunta a un registro inexistente.` };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Ocurrió un error inesperado al iniciar la práctica.' };
  }
}