import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import prisma from './prisma';
import { LoginFormData } from './validators';
import { cookies } from 'next/headers'

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET no está definido en las variables de entorno.");
  throw new Error('JWT_SECRET no está definido en las variables de entorno. Por favor, añádelo a tu archivo .env');
}

/**
 * Hashes a password using bcrypt.
 * @param password - The password to hash.
 * @returns The hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  return hashedPassword;
}

/**
 * Compares a password with a hashed password using bcrypt.
 * @param password - The password to compare.
 * @param hash - The hashed password to compare against.
 * @returns True if the passwords match, false otherwise.
 */
export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  const isMatch = await bcrypt.compare(password, hash);
  return isMatch;
}

/**
 * Generates a JWT token for a user.
 * @param userId - The ID of the user.
 * @param role - The role of the user.
 * @returns The generated JWT token.
 */
export async function verifyCredentials(credentials: LoginFormData) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { rut: credentials.rut },
      include: {
        rol: true, 
      },
    });

    if (!usuario) {
      console.log(`Intento de login fallido: Usuario no encontrado con RUT ${credentials.rut}`);
      return null;
    }

    if (usuario.estado !== 'ACTIVO') {
      console.log(`Intento de login fallido: Usuario ${credentials.rut} no está activo.`);
      return null; 
    }

    const passwordIsValid = await comparePasswords(credentials.password, usuario.password);

    if (!passwordIsValid) {
      console.log(`Intento de login fallido: Contraseña incorrecta para RUT ${credentials.rut}`);
      return null;
    }

    console.log(`Credenciales verificadas para RUT ${credentials.rut}`);
    // Devolver solo la información necesaria para el payload del token y la sesión
    return {
      id: usuario.id,
      rut: usuario.rut,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol.nombre, // Asumiendo que el modelo Rol tiene un campo 'nombre'
    };

  } catch (error) {
    console.error("Error en verifyCredentials:", error);
    return null; // En caso de cualquier error, no autenticar
  }
}

/**
 * Generates a JWT token for a user.
 * @param payload - The payload to include in the token.
 * @returns The generated JWT token.
 */
export function generateJwtToken(payload: { userId: number; rut: string; rol: string; email: string; nombre: string; }) {
  if (!JWT_SECRET) {
    console.error("Error al generar token: JWT_SECRET no está configurado.");
    throw new Error("Error de configuración del servidor al generar token.");
  }
  try {
    const token = jwt.sign(payload, JWT_SECRET as Secret, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
    console.log("Token JWT generado.");
    return token;
  } catch (error) {
    console.error("Error al firmar el token JWT:", error);
    throw new Error("No se pudo generar el token de sesión.");
  }
}

/**
 * Establece el token JWT como una cookie HttpOnly segura.
 * Esta función debe ser llamada desde un Server Action o Route Handler.
 * @param token - El token JWT a establecer.
 */
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  const decodedToken = jwt.decode(token);
  const expires = new Date(Date.now() + (decodedToken as { [key: string]: any })!.exp! * 1000 - Date.now());

  try {
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Cookie segura solo en producción
      path: '/', // Disponible en todo el sitio
      sameSite: 'lax', // Protección CSRF
      expires: expires, // Establecer la expiración de la cookie
      // maxAge: maxAgeInSeconds, // O usar maxAge si prefieres
    });
    console.log("Cookie de autenticación establecida.");
  } catch (error) {
    console.error("Error al establecer la cookie de autenticación:", error);
    // Considera cómo manejar este error. Podría ser crítico para el login.
  }
}

/*
* Obtains the user session from the cookie.
* @returns The user session if valid, null otherwise.
*/
export async function getUserSession() {
  // TODO:
  // 1. Obtener el token de la cookie 'session_token'.
  // 2. Verificar y decodificar el token usando JWT_SECRET.
  // 3. Si es válido, retornar el payload del token (datos del usuario).
  // 4. Si no es válido o no existe, retornar null.
  console.log("getUserSession llamado"); // Log temporal
  return null; // Temporal
}

/**
 * Clears the authentication cookie.
 * @param res - The response object.
 * @returns void
 */
export function clearAuthCookie(res: Response) {
  // cookies().delete('session_token');
  console.log("clearAuthCookie llamado"); // Log temporal
}
