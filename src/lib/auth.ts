import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { 
  verifyJwtToken,
  type UserJwtPayload 
} from './auth-utils';

const JWT_SECRET_FROM_ENV = process.env.JWT_SECRET;

if (!JWT_SECRET_FROM_ENV) {
  console.error("FATAL ERROR: JWT_SECRET no está definido en las variables de entorno.");
  throw new Error('JWT_SECRET no está definido. La autenticación no funcionará.');
}

// Re-export functions that can be used in both client and server
export { hashPassword, comparePasswords, verifyCredentials, generateJwtToken } from './auth-utils';
export type { UserJwtPayload } from './auth-utils';

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

  return verifyJwtToken(token);
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
    const token = (await cookieStore).get('session_token');
    
    if (!token?.value) {
      return null;
    }

    return verifyJwtToken(token.value);
  } catch (error) {
    console.error('Error al verificar la sesión:', error);
    return null;
  }
}
