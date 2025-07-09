'use server';

import { revalidatePath } from 'next/cache';
import { CreateEmpleadorSchema } from '@/lib/validators/empleador';
import { EmpleadorService } from '@/lib/services/empleadorService';
import { verifyUserSession } from '@/lib/auth';

interface CreateEmpleadorFormState {
  message?: string;
  errors?: Record<string, string[]>;
  success: boolean;
  initialPassword?: string;
}

export async function createEmpleadorAction(
  prevState: CreateEmpleadorFormState | undefined,
  formData: FormData
): Promise<CreateEmpleadorFormState> {
  // 1. Verificar que el usuario sea Coordinador
  const session = await verifyUserSession();
  if (!session || session.rol !== 'COORDINADOR') {
    return {
      message: 'No autorizado',
      errors: { general: ['No tiene permiso para realizar esta acción.'] },
      success: false,
    };
  }

  // 2. Convertir FormData a objeto
  const rawFormData = {
    rut: formData.get('rut'),
    nombre: formData.get('nombre'),
    apellido: formData.get('apellido'),
    email: formData.get('email'),
    centroPracticaId: Number(formData.get('centroPracticaId')),
  };

  // 3. Validar datos con Zod
  const validatedFields = CreateEmpleadorSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.log("Errores de validación:", validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Error en los datos del formulario.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  // 4. Llamar al servicio de creación
  const result = await EmpleadorService.createEmpleadorUser(validatedFields.data);

  // 5. Si el empleador se creó exitosamente, revalidar la página
  if (result.success) {
    revalidatePath('/coordinador/empleadores');
  }

  return {
    message: result.message,
    errors: result.errors,
    success: result.success,
    initialPassword: result.initialPassword,
  };
}
