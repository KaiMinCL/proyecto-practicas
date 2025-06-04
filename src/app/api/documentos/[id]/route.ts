import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { verifyUserSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UpdateDocumentoSchema } from '@/lib/validators/documento';

// GET: Obtener un documento específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const session = await verifyUserSession();
    if (!session) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const documentoId = parseInt(params.id);
    if (isNaN(documentoId)) {
      return NextResponse.json(
        { message: 'ID de documento inválido' },
        { status: 400 }
      );
    }

    // Buscar el documento
    const documento = await prisma.documentoApoyo.findUnique({
      where: { id: documentoId },
      include: {
        carrera: {
          select: {
            id: true,
            nombre: true,
          },
        },
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!documento) {
      return NextResponse.json(
        { message: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      documento,
    });

  } catch (error) {
    console.error('Error fetching documento:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT: Actualizar un documento
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación y rol
    const session = await verifyUserSession();
    if (!session || session.rol !== 'Coordinador') {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const documentoId = parseInt(params.id);
    if (isNaN(documentoId)) {
      return NextResponse.json(
        { message: 'ID de documento inválido' },
        { status: 400 }
      );
    }

    // Verificar que el documento existe
    const documentoExistente = await prisma.documentoApoyo.findUnique({
      where: { id: documentoId },
    });

    if (!documentoExistente) {
      return NextResponse.json(
        { message: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    // Obtener datos del request
    const body = await request.json();
    
    // Validar datos
    const validationResult = UpdateDocumentoSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Datos inválidos',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { nombre, carreraId, sedeId } = validationResult.data;    // Actualizar el documento
    const documentoActualizado = await prisma.documentoApoyo.update({
      where: { id: documentoId },
      data: {
        nombre,
        carreraId,
        sedeId,
      },
      include: {
        carrera: {
          select: {
            id: true,
            nombre: true,
          },
        },
        sede: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Documento actualizado exitosamente',
      documento: documentoActualizado,
    });

  } catch (error) {
    console.error('Error updating documento:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un documento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación y rol
    const session = await verifyUserSession();
    if (!session || session.rol !== 'Coordinador') {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    const documentoId = parseInt(params.id);
    if (isNaN(documentoId)) {
      return NextResponse.json(
        { message: 'ID de documento inválido' },
        { status: 400 }
      );
    }

    // Buscar el documento para obtener la URL del archivo
    const documento = await prisma.documentoApoyo.findUnique({
      where: { id: documentoId },
    });

    if (!documento) {
      return NextResponse.json(
        { message: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el archivo físico si existe
    try {
      const filePath = join(process.cwd(), 'public', documento.url);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (fileError) {
      console.warn('Error deleting file:', fileError);
      // Continuar con la eliminación del registro incluso si falla la eliminación del archivo
    }

    // Eliminar el registro de la base de datos
    await prisma.documentoApoyo.delete({
      where: { id: documentoId },
    });

    return NextResponse.json({
      success: true,
      message: 'Documento eliminado exitosamente',
    });

  } catch (error) {
    console.error('Error deleting documento:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
