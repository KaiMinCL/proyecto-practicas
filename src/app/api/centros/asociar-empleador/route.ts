import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyUserSession } from '@/lib/auth';
import { AssociateEmpleadorSchema } from '@/lib/validators/centro';

export async function POST(request: Request) {
  try {
    // 1. Verificar autenticación
    const user = await verifyUserSession();
    if (!user || !['SUPER_ADMIN', 'COORDINADOR'].includes(user.rol)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 2. Validar datos
    const body = await request.json();
    const validatedData = AssociateEmpleadorSchema.parse(body);

    // 3. Verificar que el centro existe
    const centro = await prisma.centroPractica.findUnique({
      where: { id: validatedData.centroPracticaId }
    });

    if (!centro) {
      return NextResponse.json(
        { error: 'Centro de práctica no encontrado' },
        { status: 404 }
      );
    }

    // 4. Verificar que el empleador existe
    const empleador = await prisma.empleador.findUnique({
      where: { id: validatedData.empleadorId }
    });

    if (!empleador) {
      return NextResponse.json(
        { error: 'Empleador no encontrado' },
        { status: 404 }
      );
    }

    // 5. Verificar que la asociación no existe ya
    const existingAssociation = await prisma.empleadorCentro.findUnique({
      where: {
        empleadorId_centroPracticaId: {
          empleadorId: validatedData.empleadorId,
          centroPracticaId: validatedData.centroPracticaId
        }
      }
    });

    if (existingAssociation) {
      return NextResponse.json(
        { error: 'El empleador ya está asociado a este centro' },
        { status: 400 }
      );
    }

    // 6. Crear la asociación
    await prisma.empleadorCentro.create({
      data: {
        empleadorId: validatedData.empleadorId,
        centroPracticaId: validatedData.centroPracticaId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Empleador asociado al centro exitosamente'
    });

  } catch (error) {
    console.error('Error al asociar empleador:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al asociar empleador' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // 1. Verificar autenticación
    const user = await verifyUserSession();
    if (!user || !['SUPER_ADMIN', 'COORDINADOR'].includes(user.rol)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 2. Validar datos
    const body = await request.json();
    const validatedData = AssociateEmpleadorSchema.parse(body);

    // 3. Verificar que la asociación existe
    const existingAssociation = await prisma.empleadorCentro.findUnique({
      where: {
        empleadorId_centroPracticaId: {
          empleadorId: validatedData.empleadorId,
          centroPracticaId: validatedData.centroPracticaId
        }
      }
    });

    if (!existingAssociation) {
      return NextResponse.json(
        { error: 'La asociación no existe' },
        { status: 404 }
      );
    }

    // 4. Eliminar la asociación
    await prisma.empleadorCentro.delete({
      where: {
        empleadorId_centroPracticaId: {
          empleadorId: validatedData.empleadorId,
          centroPracticaId: validatedData.centroPracticaId
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Asociación eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar asociación:', error);
    return NextResponse.json(
      { error: 'Error al eliminar asociación' },
      { status: 500 }
    );
  }
}
