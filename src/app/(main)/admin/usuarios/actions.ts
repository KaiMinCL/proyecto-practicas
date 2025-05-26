'use server';

import { revalidatePath } from 'next/cache';
import { CreateUserSchema } from '@/lib/validators';
import { UserService } from '@/lib/services';

interface CreateUserFormState {
  message?: string;
  errors?: Record<string, string[]>;
  success: boolean;
  initialPassword?: string;
}

export async function createUserAction(
  prevState: CreateUserFormState | undefined,
  formData: FormData
): Promise<CreateUserFormState> {
  // 1. Convertir FormData a objeto
  const rawFormData = {
    rut: formData.get('rut'),
    nombre: formData.get('nombre'),
    apellido: formData.get('apellido'),
    email: formData.get('email'),
    rol: formData.get('rol'),
    sedeId: Number(formData.get('sedeId')),
  };

  // 2. Validar datos con Zod
  const validatedFields = CreateUserSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.log("Errores de validación:", validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Error en los datos del formulario.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  // 3. Llamar al servicio de creación de usuario
  const result = await UserService.createUser(validatedFields.data);

  // 4. Si el usuario se creó exitosamente, revalidar la página
  if (result.success) {
    revalidatePath('/admin/usuarios');
  }

  return {
    message: result.message,
    errors: result.errors,
    success: result.success,
    initialPassword: result.initialPassword,
  };
}
