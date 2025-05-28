// src/app/(main)/alumno/practicas/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { EstadoPractica as PrismaEstadoPracticaEnum } from '@prisma/client';

import { authorizeAlumno } from '@/lib/auth/checkRole';
import { PracticaService } from '@/lib/services/practicaService';
import prismaClient from '@/lib/prisma';
import { 
    completarActaAlumnoSchema,
    type CompletarActaAlumnoData,
    type PracticaConDetalles 
} from '@/lib/validators/practica'; 
import { AlumnoService } from '@/lib/services/alumnoService';

export type ActionResponse<TData = null> = {
  success: boolean;
  data?: TData;
  error?: string;
  errors?: { field: string | number | (string | number)[]; message: string }[];
  message?: string;
};

/**
 * Obtiene las prácticas del alumno logueado que están en estado PENDIENTE 
 */
export async function getMisPracticasPendientesAction(): Promise<ActionResponse<PracticaConDetalles[]>> {
  try {
    const userPayload = await authorizeAlumno(); 

    const alumno = await prismaClient.alumno.findUnique({
        where: { usuarioId: userPayload.userId }, 
        select: { id: true }
    });

    if (!alumno) {
        return { success: false, error: "Perfil de alumno no encontrado para este usuario." };
    }

    const result = await PracticaService.getPracticasPorAlumno(alumno.id, PrismaEstadoPracticaEnum.PENDIENTE);
    
    if (result.success && result.data) {
      return { success: true, data: result.data as unknown as PracticaConDetalles[] };
    }
    return { success: false, error: result.error || 'No se pudieron obtener tus prácticas pendientes.' };
  } catch (error) {
    if (error instanceof Error) {
      // Si authorizeAlumno lanza un error, se captura aquí
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error inesperado obteniendo tus prácticas pendientes.' };
  }
}

/**
 * Obtiene los detalles de una práctica específica para que el alumno la complete.
 * Verifica que la práctica pertenezca al alumno logueado.
 */
export async function getDetallesPracticaParaCompletarAction(practicaId: number): Promise<ActionResponse<PracticaConDetalles & {fueraDePlazo?: boolean} >> {
  try {
    const userPayload = await authorizeAlumno(); 
    const result = await PracticaService.getPracticaParaCompletarAlumno(practicaId, userPayload.userId);

    if (result.success && result.data) {
      return { success: true, data: result.data as unknown as (PracticaConDetalles & {fueraDePlazo?: boolean}) };
    }
    return { success: false, error: result.error };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error inesperado obteniendo los detalles de la práctica.' };
  }
}

/**
 * Permite al alumno enviar los datos completados del Acta 1.
 * Valida los datos usando Zod antes de pasarlos al servicio.
 */
export async function submitActaAlumnoAction(
  practicaId: number, 
  formData: CompletarActaAlumnoData
): Promise<ActionResponse<PracticaConDetalles>> {
  try {
    const userPayload = await authorizeAlumno();

    // Validar los datos del formulario con Zod ANTES de llamar al servicio
    const validationResult = completarActaAlumnoSchema.safeParse(formData);
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Error de validación. Por favor, revisa los campos.',
        errors: validationResult.error.errors.map((e) => ({ field: e.path, message: e.message })),
      };
    }
    
    // Llama al servicio con los datos ya validados
    const result = await PracticaService.completarActaAlumno(
      practicaId, 
      userPayload.userId, 
      validationResult.data
    );

    if (result.success && result.data) {
      revalidatePath(`/alumno/mis-practicas`); // Para actualizar la lista de prácticas del alumno
      revalidatePath(`/alumno/mis-practicas/${practicaId}/completar-acta`); // Para la página del formulario 
      
      // TODO: Notificación al Docente Tutor

      return { success: true, data: result.data as unknown as PracticaConDetalles, message: "Acta 1 completada y enviada para validación del docente." };
    }
    // Si el servicio devuelve un error específico (ej. plazo vencido), se pasa
    return { success: false, error: result.error || 'Error desconocido al guardar el acta.' };
  } catch (error) {
    // Captura errores inesperados del proceso
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Ocurrió un error muy inesperado al guardar el acta.' };
  }
}

/**
 * Actualiza la URL de la foto de perfil del Alumno logueado.
 * @param newFotoUrl La URL de la imagen subida a Vercel Blob.
 */
export async function updateAlumnoFotoUrlAction(newFotoUrl: string): Promise<ActionResponse<{ fotoUrl: string | null }>> {
  try {
    const userPayload = await authorizeAlumno(); // Verifica que es un alumno y obtiene sus datos

    // Encuentra el registro Alumno correspondiente al Usuario logueado
    const alumno = await prismaClient.alumno.findUnique({
      where: { usuarioId: userPayload.userId },
      select: { id: true },
    });

    if (!alumno) {
      return { success: false, error: "Perfil de alumno no encontrado." };
    }

    // Validación simple de la URL
    if (!newFotoUrl || typeof newFotoUrl !== 'string' || !newFotoUrl.startsWith('https://')) {
        return { success: false, error: "La URL de la foto proporcionada no es válida." };
    }

    const result = await AlumnoService.updateFotoUrl(alumno.id, newFotoUrl);

    if (result.success && result.data) {
      // Revalida las rutas donde la foto del alumno podría mostrarse
      revalidatePath('/(main)/alumno/perfil', 'layout'); // Si tienes una página de perfil
      revalidatePath('/(main)/alumno/mis-practicas', 'page'); // Si la foto se muestra en esta lista
      revalidatePath('/(main)/layout', 'layout'); // Para refrescar Navbar si muestra foto
      
      return { success: true, data: { fotoUrl: result.data.fotoUrl } };
    }
    return { success: false, error: result.error || "No se pudo actualizar la foto de perfil." };

  } catch (error) {
    console.error("Error en updateAlumnoFotoUrlAction:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Ocurrió un error inesperado al actualizar la foto de perfil." };
  }
}