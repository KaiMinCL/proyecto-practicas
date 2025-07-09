'use server';

import { revalidatePath } from 'next/cache';
import { CreateDocumentoSchema } from '@/lib/validators/documento';
import { DocumentoService } from '@/lib/services/documentoService';
import { verifyUserSession } from '@/lib/auth';

interface CreateDocumentoFormState {
  message?: string;
  errors?: Record<string, string[]>;
  success: boolean;
  documento?: unknown;
}

export async function createDocumentoAction(
  prevState: CreateDocumentoFormState | undefined,
  formData: FormData
): Promise<CreateDocumentoFormState> {
  try {
    // 1. Verificar que el usuario sea Coordinador
    const session = await verifyUserSession();
    if (!session || session.rol !== 'COORDINADOR') {
      return {
        message: 'No autorizado',
        errors: { general: ['No tiene permiso para realizar esta acción.'] },
        success: false,
      };
    }
    // 2. Extraer datos del FormData
    const nombre = formData.get('nombre') as string;
    const carreraId = formData.get('carreraId') as string;
    const sedeId = formData.get('sedeId') as string;
    const archivo = formData.get('archivo') as File;

    // 3. Validar que se haya enviado un archivo
    if (!archivo || archivo.size === 0) {
      return {
        message: 'Error de validación',
        errors: { archivo: ['Debe seleccionar un archivo PDF.'] },
        success: false,
      };
    }

    // 4. Validar tipo de archivo
    if (archivo.type !== 'application/pdf') {
      return {
        message: 'Error de validación',
        errors: { archivo: ['Solo se permiten archivos PDF.'] },
        success: false,
      };
    }

    // 5. Validar tamaño del archivo (máximo 1MB)
    const maxSize = 1024 * 1024; // 1MB
    if (archivo.size > maxSize) {
      return {
        message: 'Error de validación',
        errors: { archivo: ['El archivo debe ser menor a 1MB.'] },
        success: false,
      };
    }    
    // 6. Preparar datos para validación
    const documentoData = {
      nombre: nombre?.trim(),
      carreraId: carreraId ? parseInt(carreraId) : undefined,
      sedeId: sedeId ? parseInt(sedeId) : undefined,
    };

    // 7. Validar datos con Zod
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

      return {
        message: 'Error de validación',
        errors: fieldErrors,
        success: false,
      };
    }

    // 8. Crear el documento usando el servicio
    const response = await DocumentoService.crearDocumento(validationResult.data, archivo);

    if (response.success) {
      // Revalidar la página para mostrar el nuevo documento
      revalidatePath('/coordinador/documentos');
      
      return {
        message: 'Documento creado exitosamente',
        success: true,
        documento: response.data,
        errors: {},
      };
    } else {
      return {
        message: response.message || 'Error al crear el documento',
        errors: response.errors || { general: ['Error desconocido al crear el documento.'] },
        success: false,
      };
    }

  } catch (error) {
    console.error('Error in createDocumentoAction:', error);
    
    return {
      message: 'Error interno del servidor',
      errors: { general: ['Ha ocurrido un error inesperado. Inténtalo de nuevo.'] },
      success: false,
    };
  }
}
