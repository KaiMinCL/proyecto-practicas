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
    type PracticaConDetalles,
    subirInformePracticaSchema,
    type SubirInformePracticaData
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

/**
 * Permite al alumno subir su informe de práctica.
 * Valida los datos usando Zod antes de pasarlos al servicio.
 */
export async function subirInformePracticaAction(
  practicaId: number,
  informeData: SubirInformePracticaData
): Promise<ActionResponse<PracticaConDetalles>> {
  try {
    const userPayload = await authorizeAlumno();

    // Validar los datos del formulario con Zod ANTES de llamar al servicio
    const validationResult = subirInformePracticaSchema.safeParse(informeData);
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Error de validación. Por favor, revisa la URL del informe.',
        errors: validationResult.error.errors.map((e) => ({ field: e.path, message: e.message })),
      };
    }

    // Llama al servicio con los datos ya validados
    const result = await PracticaService.subirInformePractica(
      practicaId,
      userPayload.userId,
      validationResult.data.informeUrl
    );

    if (result.success && result.data) {
      revalidatePath(`/alumno/mis-practicas`); // Para actualizar la lista de prácticas del alumno
      revalidatePath(`/alumno/mis-practicas/${practicaId}/subir-informe`); // Para la página del formulario

      // TODO: Notificación al Docente Tutor sobre el informe subido

      return { 
        success: true, 
        data: result.data as unknown as PracticaConDetalles, 
        message: "Informe de práctica subido exitosamente." 
      };
    }

    // Si el servicio devuelve un error específico, se pasa
    return { success: false, error: result.error || 'Error desconocido al subir el informe.' };
  } catch (error) {
    // Captura errores inesperados del proceso
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Ocurrió un error muy inesperado al subir el informe.' };
  }
}

/**
 * Obtiene las prácticas del alumno logueado que están en estado EN_CURSO o FINALIZADA_PENDIENTE_EVAL
 * para permitir la subida de informes.
 */
export async function getMisPracticasParaInformeAction(): Promise<ActionResponse<PracticaConDetalles[]>> {
  try {
    const userPayload = await authorizeAlumno(); 
    
    // Obtener el alumnoId a partir del usuarioId
    const alumno = await prismaClient.alumno.findUnique({
      where: { usuarioId: userPayload.userId },
      select: { id: true },
    });

    if (!alumno) {
      return { success: false, error: "Perfil de alumno no encontrado." };
    }
    
    const result = await PracticaService.getPracticasPorAlumno(alumno.id);

    if (result.success && result.data) {
      // Filtrar solo las prácticas que pueden subir informe
      const practicasValidas = (result.data as unknown as PracticaConDetalles[]).filter(practica => 
        practica.estado === PrismaEstadoPracticaEnum.EN_CURSO || 
        practica.estado === PrismaEstadoPracticaEnum.FINALIZADA_PENDIENTE_EVAL
      );
      
      return { success: true, data: practicasValidas };
    }
    return { success: false, error: result.error };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error inesperado obteniendo tus prácticas para subir informe.' };
  }
}

/**
 * Obtiene todas las prácticas del alumno que tienen evaluación de empleador disponible.
 */
export async function getMisPracticasConEvaluacionEmpleadorAction(): Promise<ActionResponse<unknown[]>> {
  try {
    const userPayload = await authorizeAlumno();

    const result = await PracticaService.getPracticasConEvaluacionEmpleadorDisponible(userPayload.userId);
    
    if (result.success && result.data) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error || 'No se pudieron obtener las evaluaciones de empleador.' };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error inesperado obteniendo las evaluaciones de empleador.' };
  }
}

/**
 * Obtiene la evaluación de empleador específica para una práctica.
 */
export async function getEvaluacionEmpleadorAction(practicaId: number): Promise<ActionResponse<unknown>> {
  try {
    const userPayload = await authorizeAlumno();

    if (!practicaId || isNaN(practicaId)) {
      return { success: false, error: 'ID de práctica inválido.' };
    }

    const result = await PracticaService.getEvaluacionEmpleadorPorPractica(practicaId, userPayload.userId);
    
    if (result.success && result.data) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error || 'No se pudo obtener la evaluación del empleador.' };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error inesperado obteniendo la evaluación del empleador.' };
  }
}

/**
 * Obtiene el detalle completo de una práctica específica del alumno logueado,
 * incluyendo evaluaciones y acta final.
 */
export async function obtenerDetallePracticaAlumno(practicaId: number): Promise<ActionResponse<PracticaConDetalles>> {
  try {
    const userPayload = await authorizeAlumno();

    const alumno = await prismaClient.alumno.findUnique({
      where: { usuarioId: userPayload.userId },
      select: { id: true },
    });

    if (!alumno) {
      return { success: false, error: "Perfil de alumno no encontrado." };
    }

    // Obtener la práctica con todas las relaciones incluyendo evaluaciones y acta final
    const practica = await prismaClient.practica.findFirst({
      where: {
        id: practicaId,
        alumnoId: alumno.id, // Verificar que la práctica pertenece al alumno
      },
      include: {
        alumno: {
          include: {
            usuario: true,
            carrera: { include: { sede: true } }
          }
        },
        docente: { include: { usuario: true } },
        carrera: { include: { sede: true } },
        centroPractica: true,
        evaluacionDocente: true,
        evaluacionEmpleador: true,
        actaFinal: true
      }
    });

    if (!practica) {
      return { success: false, error: 'Práctica no encontrada o no tienes permisos para verla.' };
    }

    return { success: true, data: practica as unknown as PracticaConDetalles };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error inesperado obteniendo el detalle de la práctica.' };
  }
}

/**
 * Obtiene el acta final ponderada de una práctica específica del alumno.
 * Solo disponible cuando la práctica está cerrada.
 */
export async function obtenerActaFinalAlumno(practicaId: number): Promise<ActionResponse<{
  practica: {
    id: number;
    tipo: string;
    fechaInicio: Date;
    fechaTermino: Date;
    estado: string;
    alumno: {
      nombre: string;
      apellido: string;
      rut: string;
      carrera: string;
    };
    centroPractica?: {
      nombre: string | null;
      giro: string | null;
    } | null;
    docente: {
      nombre: string;
      apellido: string;
    };
  };
  evaluaciones: {
    informe: {
      nota: number;
      fecha: Date;
      porcentaje: number;
    };
    empleador: {
      nota: number;
      fecha: Date;
      porcentaje: number;
    };
  };
  notaFinalPonderada: number;
  fechaCierre: Date;
}>> {
  try {
    const userPayload = await authorizeAlumno();

    const alumno = await prismaClient.alumno.findUnique({
      where: { usuarioId: userPayload.userId },
      select: { id: true },
    });

    if (!alumno) {
      return { success: false, error: "Perfil de alumno no encontrado." };
    }

    // Obtener la práctica con todas las evaluaciones y configuración
    const practica = await prismaClient.practica.findFirst({
      where: {
        id: practicaId,
        alumnoId: alumno.id, // Verificar que la práctica pertenece al alumno
        estado: 'CERRADA', // Solo prácticas cerradas tienen acta final
      },
      include: {
        alumno: {
          include: {
            usuario: true,
            carrera: { include: { sede: true } }
          }
        },
        carrera: { include: { sede: true } },
        docente: { include: { usuario: true } },
        evaluacionDocente: true,
        evaluacionEmpleador: true,
        centroPractica: true,
        actaFinal: true
      }
    });

    if (!practica) {
      return { 
        success: false, 
        error: 'Práctica no encontrada, no tienes permisos para verla, o el acta final aún no está disponible.' 
      };
    }

    // Verificar que el acta final existe y está cerrada
    if (!practica.actaFinal || practica.actaFinal.estado !== 'CERRADA') {
      return { 
        success: false, 
        error: 'El acta final aún no está disponible. Debe estar cerrada por el docente tutor.' 
      };
    }

    // Verificar que ambas evaluaciones están completadas
    if (!practica.evaluacionDocente || !practica.evaluacionEmpleador) {
      return {
        success: false,
        error: 'Las evaluaciones del informe y empleador deben estar completadas.'
      };
    }

    // Obtener configuración de ponderación
    const configuracion = await prismaClient.configuracionEvaluacion.findFirst({
      orderBy: { id: 'desc' } // Obtener la configuración más reciente
    });

    if (!configuracion) {
      return {
        success: false,
        error: 'Configuración de ponderación no encontrada.'
      };
    }

    const actaFinalData = {
      practica: {
        id: practica.id,
        tipo: practica.tipo,
        fechaInicio: practica.fechaInicio,
        fechaTermino: practica.fechaTermino,
        estado: practica.estado,
        alumno: {
          nombre: practica.alumno.usuario.nombre,
          apellido: practica.alumno.usuario.apellido,
          rut: practica.alumno.usuario.rut,
          carrera: practica.alumno.carrera?.nombre || practica.carrera?.nombre || 'N/A'
        },
        centroPractica: practica.centroPractica ? {
          nombre: practica.centroPractica.nombreEmpresa,
          giro: practica.centroPractica.giro
        } : null,
        docente: {
          nombre: practica.docente.usuario.nombre,
          apellido: practica.docente.usuario.apellido
        }
      },
      evaluaciones: {
        informe: {
          nota: practica.evaluacionDocente.nota,
          fecha: practica.evaluacionDocente.fecha,
          porcentaje: configuracion.porcentajeInforme
        },
        empleador: {
          nota: practica.evaluacionEmpleador.nota,
          fecha: practica.evaluacionEmpleador.fecha,
          porcentaje: configuracion.porcentajeEmpleador
        }
      },
      notaFinalPonderada: practica.actaFinal.notaFinal,
      fechaCierre: practica.actaFinal.fechaCierre
    };

    return { success: true, data: actaFinalData };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error inesperado obteniendo el acta final.' };
  }
}

/**
 * Obtiene todas las prácticas del alumno logueado con información completa incluyendo evaluaciones y acta final.
 */
export async function getMisPracticasCompletasAction(): Promise<ActionResponse<PracticaConDetalles[]>> {
  try {
    const userPayload = await authorizeAlumno(); 

    const alumno = await prismaClient.alumno.findUnique({
        where: { usuarioId: userPayload.userId }, 
        select: { id: true }
    });

    if (!alumno) {
        return { success: false, error: "Perfil de alumno no encontrado para este usuario." };
    }

    // Obtener todas las prácticas del alumno con información completa
    const practicas = await prismaClient.practica.findMany({
      where: { alumnoId: alumno.id },
      include: {
        alumno: {
          include: {
            usuario: true,
            carrera: { include: { sede: true } }
          }
        },
        docente: { include: { usuario: true } },
        carrera: { include: { sede: true } },
        centroPractica: true,
        evaluacionDocente: true,
        evaluacionEmpleador: true,
        actaFinal: true
      },
      orderBy: { fechaInicio: 'desc' }
    });
    
    return { success: true, data: practicas as unknown as PracticaConDetalles[] };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error inesperado obteniendo tus prácticas.' };
  }
}