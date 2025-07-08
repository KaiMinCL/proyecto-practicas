'use server';

import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';
import { EstadoPractica as PrismaEstadoPracticaEnum } from '@prisma/client';

import { authorizeDocente } from '@/lib/auth/checkRole'; 
import { PracticaService } from '@/lib/services/practicaService';
import prismaClient from '@/lib/prisma';
import { 
    decisionDocenteActaSchema,
    type DecisionDocenteActaData,
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

/**
 * Obtiene las prácticas asignadas al docente logueado que están pendientes de su aceptación/rechazo.
 * Estado esperado: PENDIENTE_ACEPTACION_DOCENTE
 */
export async function getMisPracticasPendientesAceptacionAction(): Promise<ActionResponse<PracticaConDetalles[]>> {
  try {
    const userPayload = await authorizeDocente();

    const docente = await prismaClient.docente.findUnique({
        where: { usuarioId: userPayload.userId },
        select: { id: true }
    });

    if (!docente) {
        return { success: false, error: "Perfil de docente no encontrado para este usuario." };
    }

    const practicas = await prismaClient.practica.findMany({
        where: {
            docenteId: docente.id,
            estado: PrismaEstadoPracticaEnum.PENDIENTE_ACEPTACION_DOCENTE,
        },
        include: { // Incluimos datos para mostrar en la lista
            alumno: { include: { usuario: { select: { nombre: true, apellido: true, rut: true }} } },
            carrera: { select: { nombre: true, sede: {select: {nombre:true}} } },
        },
        orderBy: { fechaInicio: 'asc' }
    });
    
    return { success: true, data: practicas as unknown as PracticaConDetalles[] };

  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: 'Error inesperado obteniendo sus prácticas pendientes de aceptación.' };
  }
}

/**
 * Obtiene los detalles completos de una práctica para que el Docente la revise.
 * Asegura que la práctica esté asignada al docente logueado y en el estado correcto.
 */
export async function getDetallesPracticaParaRevisionDocenteAction(practicaId: number): Promise<ActionResponse<PracticaConDetalles>> {
  try {
    const userPayload = await authorizeDocente(); 
    const result = await PracticaService.getPracticaParaRevisionDocente(practicaId, userPayload.userId);

    if (result.success && result.data) {
      return { success: true, data: result.data as unknown as PracticaConDetalles };
    }
    return { success: false, error: result.error };
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: 'Error inesperado obteniendo los detalles de la práctica.' };
  }
}

/**
 * Permite al Docente enviar su decisión (Aceptar/Rechazar) sobre el Acta 1.
 */
export async function submitDecisionDocenteActaAction(
  practicaId: number, 
  decisionData: DecisionDocenteActaData 
): Promise<ActionResponse<PracticaConDetalles>> {
  try {
    const userPayload = await authorizeDocente();
    
    const validationResult = decisionDocenteActaSchema.safeParse(decisionData);
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Datos de decisión inválidos.',
        errors: validationResult.error.errors.map((e) => ({ field: e.path, message: e.message })),
      };
    }
    
    const result = await PracticaService.procesarDecisionDocenteActa(
      practicaId, 
      userPayload.userId, 
      validationResult.data // Pasa los datos validados
    );

    if (result.success && result.data) {
      revalidatePath(`/docente/alumnos-asignados`); // Para la lista
      revalidatePath(`/docente/alumnos-asignados/${practicaId}/revisar-acta`); 
      
      // TODO: Notificación al Coordinador y Alumno

      return { 
         success: true, 
         data: result.data as unknown as PracticaConDetalles, 
         message: decisionData.decision === 'ACEPTADA' 
             ? "Supervisión de práctica aceptada correctamente." 
             : "Práctica rechazada. Se ha notificado al coordinador." // Mensaje genérico
      };
    }
    return { success: false, error: result.error || 'Error desconocido al procesar la decisión.' };
  } catch (error) {
    if (error instanceof ZodError) { // Por si acaso, aunque ya se valida arriba
        return {
          success: false,
          error: 'Error de validación.',
          errors: error.errors.map((e) => ({ field: e.path, message: e.message })),
        };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Ocurrió un error muy inesperado al procesar la decisión.' };
  }
}

/**
 * Obtiene todas las prácticas asignadas al docente logueado que requieren alguna acción.
 * Incluye prácticas en diferentes estados: PENDIENTE_ACEPTACION_DOCENTE, EN_CURSO (con informe), 
 * FINALIZADA_PENDIENTE_EVAL, EVALUACION_COMPLETA
 */
export async function getMisPracticasAction(): Promise<ActionResponse<PracticaConDetalles[]>> {
  try {
    const userPayload = await authorizeDocente();

    const docente = await prismaClient.docente.findUnique({
        where: { usuarioId: userPayload.userId },
        select: { id: true }
    });

    if (!docente) {
        return { success: false, error: "Perfil de docente no encontrado para este usuario." };
    }

    // Obtener prácticas en estados que requieren acción del docente
    const practicas = await prismaClient.practica.findMany({
        where: {
            docenteId: docente.id,
            estado: {
                in: [
                    PrismaEstadoPracticaEnum.PENDIENTE_ACEPTACION_DOCENTE,
                    PrismaEstadoPracticaEnum.EN_CURSO,
                    PrismaEstadoPracticaEnum.FINALIZADA_PENDIENTE_EVAL,
                    PrismaEstadoPracticaEnum.EVALUACION_COMPLETA,
                    PrismaEstadoPracticaEnum.CERRADA
                ]
            },
        },
        include: {
            alumno: { 
                include: { 
                    usuario: { 
                        select: { 
                            nombre: true, 
                            apellido: true, 
                            rut: true 
                        } 
                    },
                    carrera: {
                        select: {
                            nombre: true,
                            sede: {
                                select: {
                                    nombre: true
                                }
                            }
                        }
                    }
                } 
            },
            carrera: { 
                select: { 
                    nombre: true, 
                    sede: {
                        select: {
                            nombre: true
                        }
                    } 
                } 
            },
            centroPractica: {
                select: {
                    nombreEmpresa: true,
                    direccion: true
                }
            },
            evaluacionDocente: {
                select: {
                    id: true,
                    nota: true,
                    fecha: true
                }
            },
            evaluacionEmpleador: {
                select: {
                    id: true,
                    nota: true,
                    fecha: true
                }
            },
            actaFinal: {
                select: {
                    id: true,
                    notaFinal: true,
                    estado: true,
                    fechaCierre: true
                }
            }
        },
        orderBy: [
            { estado: 'asc' }, // Priorizar por estado (pendientes primero)
            { fechaInicio: 'asc' }
        ]
    });
    
    return { success: true, data: practicas as unknown as PracticaConDetalles[] };

  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: 'Error inesperado obteniendo las prácticas.' };
  }
}