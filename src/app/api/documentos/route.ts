import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { verifyUserSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await verifyUserSession();
    if (!session) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener parámetros de consulta para filtros opcionales
    const searchParams = request.nextUrl.searchParams;
    const carreraId = searchParams.get('carreraId');
    const sedeId = searchParams.get('sedeId');    // Construir filtros
    const where: {
      carreraId?: number;
      sedeId?: number;
    } = {};
    
    if (carreraId && carreraId !== '0') {
      where.carreraId = parseInt(carreraId);
    }
    
    if (sedeId && sedeId !== '0') {
      where.sedeId = parseInt(sedeId);
    }

    // Obtener documentos
    const documentos = await prisma.documentoApoyo.findMany({
      where,
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
      orderBy: {
        creadoEn: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      documentos,
      message: 'Documentos obtenidos exitosamente',
    });

  } catch (error) {
    console.error('Error fetching documentos:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error : undefined 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await verifyUserSession();
    if (!session) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener datos del formulario
    const formData = await request.formData();
    const archivo = formData.get('archivo') as File;
    const nombre = formData.get('nombre') as string;
    const carreraId = formData.get('carreraId') as string;
    const sedeId = formData.get('sedeId') as string;

    if (!archivo || !nombre) {
      return NextResponse.json(
        { message: 'Archivo y nombre son requeridos' },
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

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileName = `documento_${timestamp}.pdf`;

    // Subir archivo a Vercel Blob
    const blob = await put(fileName, archivo, {
      access: 'public',
      contentType: 'application/pdf',
    });

    // Crear registro en la base de datos
    const data = {
      nombre: nombre,
      url: blob.url,
      creadoEn: new Date(),
      carrera: carreraId ? { connect: { id: parseInt(carreraId) } } : { disconnect: true },
      sede: sedeId ? { connect: { id: parseInt(sedeId) } } : { disconnect: true },
    };

    const documento = await prisma.documentoApoyo.create({
      data,
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
      message: 'Documento creado exitosamente',
      documento,
    });

  } catch (error) {
    console.error('Error en POST /api/documentos:', error);
    return NextResponse.json(
      { message: 'Error al procesar la solicitud', error: (error as Error).message },
      { status: 500 }
    );
  }
}
