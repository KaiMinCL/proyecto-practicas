import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EstadoPractica } from '@prisma/client';
import { AuditoriaService } from '@/lib/services/auditoria';
import { z } from 'zod';

const cambiarEstadoSchema = z.object({
  nuevoEstado: z.enum([
    'PENDIENTE',
    'PENDIENTE_ACEPTACION_DOCENTE',
    'RECHAZADA_DOCENTE',
    'EN_CURSO',
    'FINALIZADA_PENDIENTE_EVAL',
    'EVALUACION_COMPLETA',
    'CERRADA',
    'ANULADA'
  ]),
  motivo: z.string().optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getUserSession();
    
    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo coordinadores y directores pueden cambiar estados
    if (!['COORDINADOR', 'DIRECTOR'].includes(session.rol)) {
      return NextResponse.json(
        { error: 'No tienes permisos para cambiar el estado de prácticas' },
        { status: 403 }
      );
    }

    const practicaId = parseInt(id);
    if (isNaN(practicaId)) {
      return NextResponse.json(
        { error: 'ID de práctica inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = cambiarEstadoSchema.parse(body);

    // Obtener la práctica actual
    const practica = await prisma.practica.findUnique({
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
    });

    if (!practica) {
      return NextResponse.json(
        { error: 'Práctica no encontrada' },
        { status: 404 }
      );
    }

    // Validar transiciones de estado permitidas
    const transicionesPermitidas = getTransicionesPermitidas(practica.estado);
    if (!transicionesPermitidas.includes(validatedData.nuevoEstado)) {
      return NextResponse.json(
        { error: `No se puede cambiar de ${practica.estado} a ${validatedData.nuevoEstado}` },
        { status: 400 }
      );
    }

    // Actualizar el estado de la práctica
    const practicaActualizada = await prisma.practica.update({
      where: { id: practicaId },
      data: {
        estado: validatedData.nuevoEstado as EstadoPractica,
        // Si se está anulando, agregar motivo
        ...(validatedData.nuevoEstado === 'ANULADA' && validatedData.motivo && {
          motivoRechazoDocente: validatedData.motivo
        })
      },
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
    });

    // Registrar en auditoría
    await AuditoriaService.registrarAccion({
      usuarioId: session.userId,
      accion: 'CAMBIAR_ESTADO_PRACTICA',
      entidad: 'practica',
      entidadId: practicaId.toString(),
      detallesPrevios: { estado: practica.estado },
      detallesNuevos: { estado: validatedData.nuevoEstado },
      descripcion: `Estado cambiado de ${practica.estado} a ${validatedData.nuevoEstado}${validatedData.motivo ? ` - Motivo: ${validatedData.motivo}` : ''}`,
      request
    });

    return NextResponse.json({
      success: true,
      message: 'Estado de práctica actualizado exitosamente',
      data: practicaActualizada
    });

  } catch (error) {
    console.error('Error al cambiar estado de práctica:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función para determinar qué transiciones de estado son permitidas
function getTransicionesPermitidas(estadoActual: EstadoPractica): EstadoPractica[] {
  const transiciones: Record<EstadoPractica, EstadoPractica[]> = {
    'PENDIENTE': [
      'PENDIENTE_ACEPTACION_DOCENTE',
      'ANULADA'
    ],
    'PENDIENTE_ACEPTACION_DOCENTE': [
      'RECHAZADA_DOCENTE',
      'EN_CURSO',
      'ANULADA'
    ],
    'RECHAZADA_DOCENTE': [
      'PENDIENTE_ACEPTACION_DOCENTE',
      'ANULADA'
    ],
    'EN_CURSO': [
      'FINALIZADA_PENDIENTE_EVAL',
      'ANULADA'
    ],
    'FINALIZADA_PENDIENTE_EVAL': [
      'EVALUACION_COMPLETA',
      'EN_CURSO',
      'ANULADA'
    ],
    'EVALUACION_COMPLETA': [
      'CERRADA',
      'FINALIZADA_PENDIENTE_EVAL'
    ],
    'CERRADA': [
      // Las prácticas cerradas generalmente no pueden cambiar de estado
      // salvo casos administrativos especiales
    ],
    'ANULADA': [
      // Las prácticas anuladas generalmente no pueden cambiar de estado
      // salvo casos administrativos especiales para reactivar
      'PENDIENTE'
    ]
  };

  return transiciones[estadoActual] || [];
}
