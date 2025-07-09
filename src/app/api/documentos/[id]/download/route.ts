import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { verifyUserSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Descargar un documento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const documentoId = parseInt(id);
    if (isNaN(documentoId)) {
      return NextResponse.json(
        { message: 'ID de documento inválido' },
        { status: 400 }
      );
    }

    // Buscar el documento
    const documento = await prisma.documentoApoyo.findUnique({
      where: { id: documentoId },
    });

    if (!documento) {
      return NextResponse.json(
        { message: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    // Construir la ruta del archivo
    const filePath = join(process.cwd(), 'public', documento.url);
    
    // Verificar que el archivo existe
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { message: 'Archivo no encontrado en el servidor' },
        { status: 404 }
      );
    }

    // Leer el archivo
    const fileBuffer = await readFile(filePath);
    
    // Determinar el nombre del archivo para la descarga
    const fileName = documento.nombre.endsWith('.pdf') 
      ? documento.nombre 
      : `${documento.nombre}.pdf`;

    // Crear respuesta con el archivo
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

    return response;

  } catch (error) {
    console.error('Error downloading documento:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
