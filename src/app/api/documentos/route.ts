import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { verifyUserSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CreateDocumentoSchema } from '@/lib/validators/documento';

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
    // Verificar que el usuario sea Coordinador
    const session = await verifyUserSession();
    if (!session || session.rol !== 'Coordinador') {
      return NextResponse.json(
        { 
          success: false,
          message: 'No autorizado para realizar esta acción',
          errors: { general: ['Solo los coordinadores pueden subir documentos'] }
        },
        { status: 403 }
      );
    }

    // Obtener datos del FormData
    const formData = await request.formData();
    const archivo = formData.get('archivo') as File;
    const nombre = formData.get('nombre') as string;
    const carreraId = formData.get('carreraId') as string;
    const sedeId = formData.get('sedeId') as string;

    // Validar que se haya enviado un archivo
    if (!archivo || archivo.size === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Error de validación',
          errors: { archivo: ['Debe seleccionar un archivo PDF'] }
        },
        { status: 400 }
      );
    }

    // Validar tipo de archivo (solo PDFs)
    if (archivo.type !== 'application/pdf') {
      return NextResponse.json(
        {
          success: false,
          message: 'Error de validación',
          errors: { archivo: ['Solo se permiten archivos PDF'] }
        },
        { status: 400 }
      );
    }

    // Validar tamaño del archivo (máximo 1MB)
    const maxSize = 1024 * 1024; // 1MB
    if (archivo.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: 'Error de validación',
          errors: { archivo: ['El archivo debe ser menor a 1MB'] }
        },
        { status: 400 }
      );
    }

    // Validar datos con Zod
    const documentoData = {
      nombre: nombre?.trim(),
      carreraId: carreraId ? parseInt(carreraId) : undefined,
      sedeId: sedeId ? parseInt(sedeId) : undefined,
    };

    const validationResult = CreateDocumentoSchema.safeParse(documentoData);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((error) => {
        const field = error.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(error.message);
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Error de validación',
          errors: fieldErrors
        },
        { status: 400 }
      );
    }

    // Verificar que la carrera y sede existan
    const carrera = await prisma.carrera.findUnique({
      where: { id: validationResult.data.carreraId },
      include: { sede: true }
    });

    if (!carrera) {
      return NextResponse.json(
        {
          success: false,
          message: 'Carrera no encontrada',
          errors: { carreraId: ['La carrera especificada no existe'] }
        },
        { status: 400 }
      );
    }

    const sede = await prisma.sede.findUnique({
      where: { id: validationResult.data.sedeId }
    });

    if (!sede) {
      return NextResponse.json(
        {
          success: false,
          message: 'Sede no encontrada',
          errors: { sedeId: ['La sede especificada no existe'] }
        },
        { status: 400 }
      );
    }

    // Crear directorio de uploads si no existe
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documentos');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // El directorio ya existe, continuar
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const extension = archivo.name.split('.').pop();
    const fileName = `documento_${timestamp}.${extension}`;
    const filePath = join(uploadsDir, fileName);

    // Guardar archivo
    const bytes = await archivo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // URL relativa para almacenar en la BD
    const fileUrl = `/uploads/documentos/${fileName}`;

    // Crear documento en la base de datos
    const nuevoDocumento = await prisma.documentoApoyo.create({
      data: {
        nombre: validationResult.data.nombre,
        url: fileUrl,
        carreraId: validationResult.data.carreraId,
        sedeId: validationResult.data.sedeId,
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
      documento: nuevoDocumento,
      message: 'Documento creado exitosamente',
    });

  } catch (error) {
    console.error('Error creating documento:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
        errors: { general: ['Ha ocurrido un error inesperado'] }
      },
      { status: 500 }
    );
  }
}
