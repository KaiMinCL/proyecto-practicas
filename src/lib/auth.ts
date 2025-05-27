import bcrypt from 'bcryptjs';
import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import prisma from './prisma';
import { LoginFormData } from './validators';
import { cookies } from 'next/headers';

const SALT_ROUNDS = 10;
const JWT_SECRET_FROM_ENV = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

if (!JWT_SECRET_FROM_ENV) {
  console.error("FATAL ERROR: JWT_SECRET no está definido en las variables de entorno.");
  throw new Error('JWT_SECRET no está definido. La autenticación no funcionará.');
}
const SIGNING_KEY: Secret = JWT_SECRET_FROM_ENV;

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
 * Verifies user credentials.
 * @param credentials - The login form data.
 * @returns The user data if credentials are valid, null otherwise.
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
    return {
      id: usuario.id,
      rut: usuario.rut,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol.nombre,
    };

  } catch (error) {
    console.error("Error en verifyCredentials:", error);
    return null;
  }
}

// Define un tipo para el payload del token para consistencia
export interface UserJwtPayload extends JwtPayload {
  userId: number;
  rut: string;
  rol: string;
  email: string;
  nombre: string;
  apellido: string;
}

/**
 * Generates a JWT token for a user.
 * @param payload - The payload to include in the token.
 * @returns The generated JWT token.
 */
export function generateJwtToken(payload: { userId: number; rut: string; rol: string; email: string; nombre: string; apellido: string }): string {
  try {
    const token = jwt.sign(payload, SIGNING_KEY, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
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
  const cookieStore = cookies();
  let expiresDate: Date | undefined = undefined;

  try {
    const decodedPayload = jwt.decode(token);

    if (decodedPayload && typeof decodedPayload === 'object' && typeof decodedPayload.exp === 'number') {
      expiresDate = new Date(decodedPayload.exp * 1000);
    } else {
      console.warn("Token JWT no contiene 'exp' o es inválido. La cookie se establecerá como de sesión (sin fecha de expiración explícita).");
    }

    (await cookieStore).set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      expires: expiresDate,
    });
    console.log("Cookie de autenticación establecida.");
  } catch (error) {
    console.error("Error al establecer la cookie de autenticación:", error);
  }
}

/**
 * Obtiene la sesión del usuario desde la cookie.
 * @returns El payload del usuario si el token es válido, null en caso contrario.
 */
export async function getUserSession(): Promise<UserJwtPayload | null> {
  const cookieStore = cookies();
  const token = (await cookieStore).get('session_token')?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, SIGNING_KEY) as UserJwtPayload;
    if (typeof decoded.userId === 'number' && typeof decoded.rut === 'string' && typeof decoded.rol === 'string') {
      return decoded;
    }
    console.error("Payload del token JWT no tiene la estructura esperada después de la verificación.");
    return null;
  } catch (error) {
    console.log("Error al verificar token de sesión (puede haber expirado o ser inválido):", (error as Error).name);
    return null;
  }
}

/**
 * Limpia la cookie de autenticación (cierra sesión).
 * Esta función debe ser llamada desde un Server Action o Route Handler.
 */
export async function clearAuthCookie() {
  try {
    const cookieStore = cookies();
    (await cookieStore).delete('session_token');
    console.log("Cookie de autenticación eliminada (sesión cerrada).");
  } catch (error) {
    console.error("Error al eliminar la cookie de autenticación:", error);
  }
}

/**
 * Verifica la sesión del usuario desde el servidor.
 * @returns El payload del token JWT si la sesión es válida, null en caso contrario.
 */
export async function verifyUserSession(): Promise<UserJwtPayload | null> {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get('auth-token');
    
    if (!token?.value) {
      return null;
    }

    const decoded = jwt.verify(token.value, SIGNING_KEY) as UserJwtPayload;
    return decoded;
  } catch (error) {
    console.error('Error al verificar la sesión:', error);
    return null;
  }
}
