import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validación para anular práctica
const anularPracticaSchema = z.object({
  motivo: z.string()
    .min(10, 'El motivo debe tener al menos 10 caracteres')
    .max(500, 'El motivo no puede exceder los 500 caracteres'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getUserSession();
    
    // Verificar autenticación
    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que sea Director de Carrera o Coordinador
    if (session.rol !== 'DIRECTOR_CARRERA' && session.rol !== 'COORDINADOR') {
      return NextResponse.json(
        { error: 'Solo el Director de Carrera puede anular prácticas' }, 
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

    // Validar el cuerpo de la petición
    const body = await request.json();
    const validationResult = anularPracticaSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    const { motivo } = validationResult.data;

    // Verificar que la práctica existe
    const practica = await prisma.practica.findUnique({
      where: { id: practicaId },
      include: {
        alumno: {
          include: {
            usuario: {
              select: { nombre: true, apellido: true, rut: true }
            }
          }
        },
        carrera: {
          select: { nombre: true }
        }
      }
    });

    if (!practica) {
      return NextResponse.json(
        { error: 'Práctica no encontrada' }, 
        { status: 404 }
      );
    }

    // Verificar que la práctica no esté ya anulada
    if (practica.estado === 'ANULADA') {
      return NextResponse.json(
        { error: 'La práctica ya está anulada' }, 
        { status: 400 }
      );
    }

    // Verificar que la práctica se pueda anular (no esté cerrada)
    if (practica.estado === 'CERRADA') {
      return NextResponse.json(
        { error: 'No se puede anular una práctica que ya está cerrada' }, 
        { status: 400 }
      );
    }

    // Obtener información del usuario que anula
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.userId },
      select: { nombre: true, apellido: true, rut: true }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' }, 
        { status: 404 }
      );
    }

    // Anular la práctica - por ahora sin log de auditoría hasta implementar el modelo
    const practicaAnulada = await prisma.practica.update({
      where: { id: practicaId },
      data: {
        estado: 'ANULADA',
        // Agregamos el motivo en un campo de comentarios existente o en tareasPrincipales temporalmente
        // TODO: Agregar campos específicos para anulación en el esquema
        motivoRechazoDocente: `ANULADA: ${motivo}` // Reutilizamos este campo temporalmente
      },
      include: {
        alumno: {
          include: {
            usuario: {
              select: { nombre: true, apellido: true, rut: true }
            }
          }
        },
        carrera: {
          select: { nombre: true }
        }
      }
    });

    // TODO: Implementar log de auditoría cuando se agregue el modelo LogAuditoria
    console.log('Práctica anulada:', {
      practicaId,
      motivo,
      usuarioId: session.userId,
      usuario: `${usuario.nombre} ${usuario.apellido}`,
      fecha: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Práctica anulada exitosamente',
      practica: practicaAnulada
    });

  } catch (error) {
    console.error('Error al anular práctica:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}
