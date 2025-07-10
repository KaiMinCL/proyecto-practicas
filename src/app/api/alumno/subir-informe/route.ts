import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

// Constantes para validación del informe de práctica
const MAX_FILE_SIZE_KB_INFORME = 1024; // 1 MB = 1024 KB
const MAX_FILE_SIZE_BYTES_INFORME = MAX_FILE_SIZE_KB_INFORME * 1024;
const ALLOWED_CONTENT_TYPES_INFORME = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
];
const UPLOAD_SUBFOLDER_INFORME = 'informes-practica';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (user.rol !== 'ALUMNO') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const formData = await request.formData();
    const archivo = formData.get('archivo') as File;
    const practicaId = formData.get('practicaId') as string;

    if (!archivo || !practicaId) {
      return NextResponse.json({ error: 'Archivo y ID de práctica son requeridos' }, { status: 400 });
    }

    const practicaIdNumber = parseInt(practicaId, 10);
    if (isNaN(practicaIdNumber)) {
      return NextResponse.json({ error: 'ID de práctica inválido' }, { status: 400 });
    }

    // Validar tipo de contenido
    if (!ALLOWED_CONTENT_TYPES_INFORME.includes(archivo.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido. Permitidos: PDF, DOC, DOCX. Recibido: ${archivo.type}` },
        { status: 400 }
      );
    }

    // Validar tamaño del archivo
    if (archivo.size > MAX_FILE_SIZE_BYTES_INFORME) {
      return NextResponse.json(
        { error: `El archivo excede el tamaño máximo de ${MAX_FILE_SIZE_KB_INFORME} KB (1 MB).` },
        { status: 400 }
      );
    }

    // Verificar que la práctica pertenece al alumno
    const practica = await prisma.practica.findFirst({
      where: {
        id: practicaIdNumber,
        alumno: {
          usuario: {
            rut: user.rut
          }
        }
      }
    });

    if (!practica) {
      return NextResponse.json({ error: 'Práctica no encontrada' }, { status: 404 });
    }

    // Verificar que el estado permite subir informe
    const estadosPermitidos = ['EN_CURSO', 'FINALIZADA_PENDIENTE_EVAL', 'EVALUACION_COMPLETA'];
    if (!estadosPermitidos.includes(practica.estado)) {
      return NextResponse.json({ error: 'No se puede subir informe en el estado actual' }, { status: 400 });
    }

    // Generar un nombre de archivo único
    const fileExtension = archivo.name.split('.').pop()?.toLowerCase() || 'unknown';
    const uniqueFilename = `${UPLOAD_SUBFOLDER_INFORME}/${nanoid()}.${fileExtension}`;

    // Subir archivo a Vercel Blob
    const blob = await put(uniqueFilename, archivo, {
      access: 'public',
      contentType: archivo.type,
    });

    // Actualizar la práctica con la URL del informe
    await prisma.practica.update({
      where: { id: practicaIdNumber },
      data: {
        informeUrl: blob.url
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Informe subido exitosamente',
      url: blob.url,
      filename: archivo.name,
      size: archivo.size
    });

  } catch (error) {
    console.error('Error al subir informe:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
