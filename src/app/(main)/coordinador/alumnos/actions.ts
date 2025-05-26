'use server';

import { revalidatePath } from 'next/cache';
import { CreateAlumnoSchema } from '@/lib/validators';
import { AlumnoService } from '@/lib/services/alumnoService';
import { verifyUserSession } from '@/lib/auth';

interface CreateAlumnoFormState {
  message?: string;
  errors?: Record<string, string[]>;
  success: boolean;
  initialPassword?: string;
}

export async function createAlumnoAction(
  prevState: CreateAlumnoFormState | undefined,
  formData: FormData
): Promise<CreateAlumnoFormState> {
  // 1. Verificar que el usuario sea Coordinador
  const session = await verifyUserSession();
  if (!session || session.rol !== 'Coordinador') {
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
    carreraId: Number(formData.get('carreraId')),
  };

  // 3. Validar datos con Zod
  const validatedFields = CreateAlumnoSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.log("Errores de validación:", validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Error en los datos del formulario.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  // 4. Llamar al servicio de creación
  const result = await AlumnoService.createAlumnoUser(validatedFields.data);

  // 5. Si el alumno se creó exitosamente, revalidar la página
  if (result.success) {
    revalidatePath('/coordinador/alumnos');
  }

  return {
    message: result.message,
    errors: result.errors,
    success: result.success,
    initialPassword: result.initialPassword,
  };
}
