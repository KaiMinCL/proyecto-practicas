'use server'; // Directiva para Server Actions

import { LoginSchema, LoginFormData } from '@/lib/validators';
import { verifyCredentials, generateJwtToken, setAuthCookie } from '@/lib/auth'; 
import { redirect } from 'next/navigation';

// Define un tipo para el estado de la acción, útil para React Hook Form
export interface LoginFormState {
  message?: string;
  errors?: {
    rut?: string[];
    password?: string[];
    general?: string; // Para errores no específicos de un campo
  };
  success?: boolean;
  redirectTo?: string;
}

/*
    * Función para manejar el inicio de sesión del usuario.
    * @param prevState - Estado anterior, útil para useFormState
    * @param formData - Datos del formulario enviados
    * @returns Un objeto con el estado del formulario y posibles errores.
    */
export async function loginUser(
  prevState: LoginFormState | undefined, // Estado anterior, útil para useFormState
  formData: FormData
): Promise<LoginFormState> {
  // 1. Convertir FormData a un objeto
  const rawFormData: LoginFormData = {
    rut: formData.get('rut') as string,
    password: formData.get('password') as string,
  };

  // 2. Validar los datos con Zod
  const validatedFields = LoginSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.log("Errores de validación del formulario:", validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Error de validación. Por favor, corrige los campos.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { rut, password } = validatedFields.data;

  try {
    // 3. Verificar credenciales
    const user = await verifyCredentials({ rut, password });

    if (!user) {
      console.log(`Intento de login fallido para RUT: ${rut} - Credenciales inválidas o usuario inactivo.`);
      return {
        message: 'Usuario o contraseña inválidos.',
        errors: { general: 'Usuario o contraseña inválidos.' },
        success: false,
      };
    }

    // 4. Generar JWT
    const tokenPayload = {
      userId: user.id,
      rut: user.rut,
      rol: user.rol,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      sedeId: user.sedeId,
    };
    const token = generateJwtToken(tokenPayload);

    // 5. Establecer la cookie HttpOnly
    setAuthCookie(token);

    console.log(`Login exitoso para usuario: ${user.rut}, Rol: ${user.rol}. Redirigiendo...`);

  } catch (error) {
    console.error('Error inesperado durante el login:', error);
    const errorMessage = 'Ocurrió un error inesperado durante el inicio de sesión. Por favor, inténtalo de nuevo.';
    if (error instanceof Error) {
        // Podrías querer ser más específico si el error es conocido
        // errorMessage = error.message; // Cuidado con exponer detalles internos
    }
    return {
      message: errorMessage,
      errors: { general: errorMessage },
      success: false,
    };
  }

    // 6. Redirección 

  // Si todo fue exitoso, preparamos para la redirección
  // La redirección se puede manejar en el cliente basado en `success` y `redirectTo`
  // O puedes llamar a redirect() aquí directamente, pero debe ser lo último.
  // Por ejemplo, para redirigir a un dashboard genérico:
  // redirect('/dashboard');
  // O a un dashboard específico por rol:
  // if (user.rol === 'Alumno') redirect('/alumno/dashboard');
  // else if (user.rol === 'Docente') redirect('/docente/dashboard');
  // etc.

  // ¡Importante! La llamada a redirect() debe estar fuera del bloque try/catch si quieres que
  // el error del redirect (si ocurre) no sea capturado por tu catch genérico.
  // También, redirect() lanza una excepción especial, por lo que nada después de ella se ejecuta.
  redirect('/dashboard'); // Cambiar '/dashboard' a la ruta deseada
}