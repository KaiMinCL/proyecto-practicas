import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { verifyUserSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PUT: Reemplazar el archivo de un documento
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

    // Obtener datos del formulario
    const formData = await request.formData();
    const archivo = formData.get('archivo') as File;

    if (!archivo) {
      return NextResponse.json(
        { message: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // Validar el archivo
    const maxSize = 1024 * 1024; // 1MB
    if (archivo.size > maxSize) {
      return NextResponse.json(
        { message: 'El archivo es demasiado grande. Máximo 1MB permitido.' },
        { status: 400 }
      );
    }

    if (archivo.type !== 'application/pdf') {
      return NextResponse.json(
        { message: 'Solo se permiten archivos PDF' },
        { status: 400 }
      );
    }

    // Crear directorio si no existe
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'documentos');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (_error) {
      // Ignorar si el directorio ya existe
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileExtension = 'pdf';
    const fileName = `documento_${timestamp}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);
    const fileUrl = `/uploads/documentos/${fileName}`;

    // Guardar el nuevo archivo
    const bytes = await archivo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Eliminar el archivo anterior si existe
    try {
      const oldFilePath = join(process.cwd(), 'public', documentoExistente.url);
      if (existsSync(oldFilePath)) {
        await unlink(oldFilePath);
      }
    } catch (fileError) {
      console.warn('Error deleting old file:', fileError);
      // Continuar aunque falle la eliminación del archivo anterior
    }    // Actualizar el documento en la base de datos
    const documentoActualizado = await prisma.documentoApoyo.update({
      where: { id: documentoId },
      data: {
        url: fileUrl,
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
      message: 'Archivo reemplazado exitosamente',
      documento: documentoActualizado,
    });

  } catch (error) {
    console.error('Error replacing file:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
