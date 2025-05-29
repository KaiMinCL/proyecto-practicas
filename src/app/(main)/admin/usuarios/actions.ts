'use server';

import { revalidatePath } from 'next/cache';
import { CreateUserSchema, UpdateUserSchema } from '@/lib/validators';
import { UserService, SedeService } from '@/lib/services';

export async function getSedesAction() {
  const result = await SedeService.getSedesActivas();
  return result;
}

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

interface UpdateUserFormState {
  message?: string;
  errors?: Record<string, string[]>;
  success: boolean;
}

export async function getUserAction(id: number) {
  const user = await UserService.getUserById(id);
  return user;
}

export async function updateUserAction(
  prevState: UpdateUserFormState | undefined,
  formData: FormData
): Promise<UpdateUserFormState> {
  // 1. Convertir FormData a objeto
  const rawFormData = {
    id: Number(formData.get('id')),
    nombre: formData.get('nombre'),
    apellido: formData.get('apellido'),
    email: formData.get('email'),
    rol: formData.get('rol'),
    sedeId: Number(formData.get('sedeId')),
  };

  // 2. Validar datos con Zod
  const validatedFields = UpdateUserSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.log("Errores de validación:", validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Error en los datos del formulario.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  // 3. Llamar al servicio de actualización de usuario
  const result = await UserService.updateUser(validatedFields.data);

  // 4. Si el usuario se actualizó exitosamente, revalidar la página
  if (result.success) {
    revalidatePath('/admin/usuarios');
  }

  return {
    message: result.message,
    errors: result.errors,
    success: result.success,
  };
}

export interface ToggleUserStateFormState {
  message?: string;
  errors?: Record<string, string[]>;
  success: boolean;
}

export async function deactivateUserAction(
  prevState: ToggleUserStateFormState | undefined,
  formData: FormData
): Promise<ToggleUserStateFormState> {
  // 1. Obtener el ID del usuario
  const id = Number(formData.get('id'));
  if (!id || isNaN(id)) {
    return {
      message: 'ID de usuario inválido.',
      errors: { general: ['ID de usuario inválido.'] },
      success: false,
    };
  }

  // 2. Llamar al servicio
  const result = await UserService.deactivateUser(id);

  // 3. Si el usuario se desactivó exitosamente, revalidar la página
  if (result.success) {
    revalidatePath('/admin/usuarios');
  }

  return {
    message: result.message,
    errors: result.errors,
    success: result.success,
  };
}

export async function reactivateUserAction(
  prevState: ToggleUserStateFormState | undefined,
  formData: FormData
): Promise<ToggleUserStateFormState> {
  // 1. Obtener el ID del usuario
  const id = Number(formData.get('id'));
  if (!id || isNaN(id)) {
    return {
      message: 'ID de usuario inválido.',
      errors: { general: ['ID de usuario inválido.'] },
      success: false,
    };
  }

  // 2. Llamar al servicio
  const result = await UserService.reactivateUser(id);

  // 3. Si el usuario se reactivó exitosamente, revalidar la página
  if (result.success) {
    revalidatePath('/admin/usuarios');
  }

  return {
    message: result.message,
    errors: result.errors,
    success: result.success,
  };
}
