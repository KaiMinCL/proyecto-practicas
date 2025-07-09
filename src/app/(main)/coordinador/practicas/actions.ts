'use server';

import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';
import { Prisma, TipoPractica as PrismaTipoPracticaEnum, EstadoPractica } from '@prisma/client';

import { authorizeCoordinador, authorizeCoordinadorOrDirectorCarrera } from '@/lib/auth/checkRole';
import { PracticaService } from '@/lib/services/practicaService';
import { AlumnoService } from '@/lib/services/alumnoService';
import { DocenteService } from '@/lib/services/docenteService';
import { 
    iniciarPracticaSchema, 
    editarPracticaCoordDCSchema,
    type IniciarPracticaInput, 
    type EditarPracticaCoordDCInput,
    type PracticaConDetalles 
} from '@/lib/validators/practica';
import { EmailService } from '@/lib/email';
import { AuditoriaService } from '@/lib/services/auditoria';
import { generateSecurePassword } from '@/lib/utils';
import { hashPassword } from '@/lib/auth-utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
    const userPayload = await authorizeCoordinador();
    const validatedData = iniciarPracticaSchema.parse(data);
    const result = await PracticaService.iniciarPracticaCoordinador(validatedData, alumnoCarreraId);

    if (result.success && result.data) {
      revalidatePath('/coordinador/practicas'); // Asume esta ruta para la lista de prácticas
      
      // Notificar al Alumno para Completar Acta 1
      try {
        // Obtener información completa del alumno para la notificación
        const alumnoCompleto = await prismaClient.alumno.findUnique({
          where: { id: result.data.alumnoId },
          include: {
            usuario: {
              select: {
                id: true,
                email: true,
                nombre: true,
                apellido: true,
                rut: true,
                claveInicialVisible: true,
                // Necesitamos la contraseña inicial para incluirla en el correo
              }
            },
            carrera: {
              include: {
                sede: {
                  select: {
                    nombre: true
                  }
                }
              }
            }
          }
        });

        if (alumnoCompleto && alumnoCompleto.usuario.email) {
          // Generar nueva contraseña temporal para el alumno
          const nuevaPassword = generateSecurePassword();
          const hashedPassword = await hashPassword(nuevaPassword);
          
          // Actualizar la contraseña del usuario
          await prismaClient.usuario.update({
            where: { id: alumnoCompleto.usuario.id! },
            data: { password: hashedPassword }
          });

          const emailData = {
            alumnoEmail: alumnoCompleto.usuario.email,
            alumnoNombre: alumnoCompleto.usuario.nombre,
            alumnoApellido: alumnoCompleto.usuario.apellido,
            alumnoRut: alumnoCompleto.usuario.rut,
            alumnoPassword: nuevaPassword, // Usar la nueva contraseña generada
            carreraNombre: alumnoCompleto.carrera.nombre,
            sedeNombre: alumnoCompleto.carrera.sede?.nombre || 'Sede no especificada',
            fechaInicio: format(new Date(result.data.fechaInicio), 'dd/MM/yyyy', { locale: es }),
            fechaTermino: format(new Date(result.data.fechaTermino), 'dd/MM/yyyy', { locale: es }),
            plazoCompletarActa: 5 // 5 días según los requerimientos
          };

          const emailResult = await EmailService.notificarAlumnoCompletarActa1(emailData);
          
          // Registrar auditoría del envío de email
          await AuditoriaService.registrarEnvioEmail(
            userPayload.userId,
            alumnoCompleto.usuario.id!,
            'NOTIFICACION_COMPLETAR_ACTA1',
            {
              destinatarioEmail: emailData.alumnoEmail,
              destinatarioNombre: `${emailData.alumnoNombre} ${emailData.alumnoApellido}`,
              asunto: 'Completa tu Acta 1 de Supervisión de Práctica',
              exitoso: emailResult.success,
              emailId: emailResult.emailId,
              errorMessage: emailResult.error
            },
            {
              tipo: 'Practica',
              id: result.data.id.toString()
            }
          );

          if (!emailResult.success) {
            console.error('Error al enviar email de notificación:', emailResult.error);
            // No fallar toda la operación por un error de email, pero registrarlo
          }
        } else {
          console.warn('No se pudo enviar notificación: alumno sin email configurado');
        }
      } catch (emailError) {
        console.error('Error crítico al procesar notificación por email:', emailError);
        // No fallar la operación principal por un error de notificación
      }

      return { 
        success: true, 
        data: result.data as PracticaConDetalles,
        message: 'Práctica iniciada exitosamente. Se ha enviado una notificación al alumno para completar el Acta 1.'
      };
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

/**
 * Obtiene los detalles completos de una práctica para ser editada por un Coordinador o Director de Carrera.
 */
export async function getPracticaParaEditarAction(practicaId: number): Promise<ActionResponse<PracticaConDetalles>> {
  try {
    await authorizeCoordinadorOrDirectorCarrera();
    
    const result = await PracticaService.getPracticaParaEditarCoordDC(practicaId);

    if (result.success && result.data) {
      return { success: true, data: result.data as unknown as PracticaConDetalles };
    }
    return { success: false, error: result.error };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Ocurrió un error inesperado al obtener los datos de la práctica.' };
  }
}

/**
 * Actualiza una práctica existente por un Coordinador o Director de Carrera.
 */
export async function updatePracticaCoordDCAction(
  practicaId: number,
  data: EditarPracticaCoordDCInput
): Promise<ActionResponse<PracticaConDetalles>> {
  try {
    await authorizeCoordinadorOrDirectorCarrera();

    // Validar los datos con Zod en el servidor ANTES de llamar al servicio
    const validationResult = editarPracticaCoordDCSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Error de validación. Por favor, revisa los campos.',
        errors: validationResult.error.errors.map((e) => ({ field: e.path, message: e.message })),
      };
    }

    // Llama al servicio con los datos validados y el ID del usuario que edita (si es necesario para auditoría)
    const result = await PracticaService.updatePracticaCoordDC(
        practicaId, 
        validationResult.data, 
    );

    if (result.success && result.data) {
      // Revalidar rutas donde se muestre esta práctica o listas de prácticas
      revalidatePath(`/coordinador/practicas/gestion`);
      revalidatePath(`/admin/practicas`); 
      revalidatePath(`/coordinador/practicas/${practicaId}/editar`); 
      revalidatePath(`/alumno/mis-practicas/${practicaId}`); 
      revalidatePath(`/docente/practicas-pendientes/${practicaId}/revisar-acta`); 

      return { 
        success: true, 
        data: result.data as unknown as PracticaConDetalles, 
        message: "Práctica actualizada exitosamente." 
      };
    }
    // Si el servicio devuelve un error específico, se pasará aquí
    return { success: false, error: result.error || 'Error desconocido al actualizar la práctica.' };
  } catch (error) {
    // El ZodError ya se maneja arriba. Aquí podrían caer otros errores.
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Ocurrió un error inesperado al actualizar la práctica.' };
  }
}

/**
 * Obtiene una lista de prácticas para la gestión por Coordinadores o Directores de Carrera.
 * Filtra por la sede del usuario si está asociada a una.
 */
export async function listPracticasGestionAction(): Promise<ActionResponse<PracticaConDetalles[]>> {
  try {
    const userPayload = await authorizeCoordinadorOrDirectorCarrera();

    let requestingUserSedeId: number | null | undefined = undefined;
    const usuarioConSede = await prismaClient.usuario.findUnique({
        where: { id: userPayload.userId },
        select: { sedeId: true }
    });
    if (usuarioConSede) {
        requestingUserSedeId = usuarioConSede.sedeId;
    }

    const result = await PracticaService.getPracticasParaGestion({ requestingUserSedeId });
    
    if (result.success && result.data) {
      return { success: true, data: result.data as unknown as PracticaConDetalles[] };
    }
    return { success: false, error: result.error || 'Error al listar las prácticas para gestión.' };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error inesperado al listar las prácticas.' };
  }
}

export async function cambiarEstadoPracticaAction(
  practicaId: number, 
  nuevoEstado: string, 
  motivo?: string
): Promise<ActionResponse<{ message: string }>> {
  try {
    const userPayload = await authorizeCoordinadorOrDirectorCarrera();

    // Validar el estado
    const estadosValidos = [
      'PENDIENTE',
      'PENDIENTE_ACEPTACION_DOCENTE',
      'RECHAZADA_DOCENTE',
      'EN_CURSO',
      'FINALIZADA_PENDIENTE_EVAL',
      'EVALUACION_COMPLETA',
      'CERRADA',
      'ANULADA'
    ];

    if (!estadosValidos.includes(nuevoEstado)) {
      return { success: false, error: 'Estado inválido.' };
    }

    // Verificar que la práctica existe
    const practica = await prismaClient.practica.findUnique({
      where: { id: practicaId },
      include: {
        alumno: {
          include: {
            usuario: {
              select: {
                nombre: true,
                apellido: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!practica) {
      return { success: false, error: 'Práctica no encontrada.' };
    }

    // Actualizar el estado
    await prismaClient.practica.update({
      where: { id: practicaId },
      data: {
        estado: nuevoEstado as EstadoPractica,
        ...(nuevoEstado === 'ANULADA' && motivo && {
          motivoRechazoDocente: motivo
        })
      }
    });

    // Registrar auditoría
    await AuditoriaService.registrarAccion({
      usuarioId: userPayload.userId,
      accion: 'CAMBIAR_ESTADO_PRACTICA',
      entidad: 'practica',
      entidadId: practicaId.toString(),
      descripcion: `Estado cambiado de ${practica.estado} a ${nuevoEstado}${motivo ? ` - Motivo: ${motivo}` : ''}`,
      detallesPrevios: { estado: practica.estado },
      detallesNuevos: { estado: nuevoEstado }
    });

    revalidatePath('/coordinador/practicas/gestion');
    
    return { 
      success: true, 
      message: 'Estado de práctica actualizado exitosamente',
      data: { message: 'Estado actualizado' }
    };

  } catch (error) {
    console.error('Error al cambiar estado de práctica:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Error inesperado al cambiar estado de práctica.' };
  }
}