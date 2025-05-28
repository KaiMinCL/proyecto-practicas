import { NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { nanoid } from 'nanoid';

// Constantes para validación de la foto de perfil del alumno
const MAX_FILE_SIZE_KB_FOTO_PERFIL = 256; // 256 KB
const MAX_FILE_SIZE_BYTES_FOTO_PERFIL = MAX_FILE_SIZE_KB_FOTO_PERFIL * 1024;
const ALLOWED_CONTENT_TYPES_FOTO_PERFIL = ['image/jpeg', 'image/png', 'image/gif'];
const UPLOAD_SUBFOLDER_FOTO_PERFIL = 'fotos-perfil-alumnos';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
    }

    // Validar tipo de contenido
    if (!ALLOWED_CONTENT_TYPES_FOTO_PERFIL.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido. Permitidos: JPG, PNG, GIF. Recibido: ${file.type}` },
        { status: 400 }
      );
    }

    // Validar tamaño del archivo
    if (file.size > MAX_FILE_SIZE_BYTES_FOTO_PERFIL) {
      return NextResponse.json(
        { error: `El archivo excede el tamaño máximo de ${MAX_FILE_SIZE_KB_FOTO_PERFIL} KB.` },
        { status: 400 }
      );
    }

    // Generar un nombre de archivo único para evitar colisiones y añadir la extensión original
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    const uniqueFilename = `${UPLOAD_SUBFOLDER_FOTO_PERFIL}/${nanoid()}.${fileExtension}`;

    const blob = await put(uniqueFilename, file, {
      access: 'public',
      contentType: file.type, 
    });

    // Devolver la URL pública del blob
    return NextResponse.json({ success: true, url: blob.url }, { status: 200 });

  } catch (error) {
    console.error('Error al subir el archivo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido.';
    return NextResponse.json(
        { error: `Error interno del servidor al subir el archivo: ${errorMessage}` }, 
        { status: 500 }
    );
  }
}

// Manejo de eliminación de archivos subidos
export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const urlToDelete = searchParams.get('url');
    if (!urlToDelete) {
      return NextResponse.json({ error: 'URL del blob no proporcionada.' }, { status: 400 });
    }
    await del(urlToDelete);
    return NextResponse.json({ success: true, message: 'Archivo eliminado.' });

  } catch (error) {
    console.error('Error al eliminar el archivo:', error);
    return NextResponse.json({ error: 'Error interno al eliminar el archivo.' }, { status: 500 });
  }
}