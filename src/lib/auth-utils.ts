import bcrypt from 'bcryptjs';
import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import prisma from './prisma';
import { LoginFormData } from './validators';

const SALT_ROUNDS = 10;
const JWT_SECRET_FROM_ENV = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

if (!JWT_SECRET_FROM_ENV) {
  console.error("FATAL ERROR: JWT_SECRET no está definido en las variables de entorno.");
  throw new Error('JWT_SECRET no está definido. La autenticación no funcionará.');
}
const SIGNING_KEY: Secret = JWT_SECRET_FROM_ENV;

// Define un tipo para el payload del token para consistencia
export interface UserJwtPayload extends JwtPayload {
  userId: number;
  rut: string;
  rol: string;
  email: string;
  nombre: string;
  apellido: string;
  sedeId?: number | null;
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
      sedeId: usuario.sedeId,
    };

  } catch (error) {
    console.error("Error en verifyCredentials:", error);
    return null;
  }
}

/**
 * Generates a JWT token for a user.
 * @param payload - The payload to include in the token.
 * @returns The generated JWT token.
 */
export function generateJwtToken(payload: { userId: number; rut: string; rol: string; email: string; nombre: string; apellido: string; sedeId?: number | null }): string {
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
 * Verifies a JWT token.
 * @param token - The JWT token to verify.
 * @returns The decoded payload if valid, null otherwise.
 */
export function verifyJwtToken(token: string): UserJwtPayload | null {
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
 * Verifies a JWT token using jose library (compatible with edge runtime).
 * @param token - The JWT token to verify.
 * @returns The decoded payload if valid, null otherwise.
 */
export async function verifyJwtTokenWithJose(token: string): Promise<UserJwtPayload | null> {
  if (!JWT_SECRET_FROM_ENV) {
    console.error('JWT_SECRET no está configurado.');
    return null;
  }
  
  try {
    const { jwtVerify } = await import('jose');
    const secretKey = new TextEncoder().encode(JWT_SECRET_FROM_ENV);
    const { payload } = await jwtVerify(token, secretKey, {});
    
    const decoded = payload as UserJwtPayload;
    if (typeof decoded.userId === 'number' && typeof decoded.rut === 'string' && typeof decoded.rol === 'string') {
      return decoded;
    }
    console.error("Payload del token JWT no tiene la estructura esperada después de la verificación.");
    return null;
  } catch (error) {
    console.log("Error al verificar token de sesión con jose (puede haber expirado o ser inválido):", (error as Error).name);
    return null;
  }
}

/**
 * Get user session from request headers (useful for API routes and server components).
 * @param request - The NextRequest object or headers object
 * @returns The user payload if valid token found, null otherwise
 */
export async function getUserSessionFromHeaders(headers: Headers): Promise<UserJwtPayload | null> {
  const sessionToken = getCookieFromHeaders(headers, 'session_token');
  
  if (!sessionToken) {
    return null;
  }
  
  return verifyJwtTokenWithJose(sessionToken);
}

/**
 * Extract cookie value from headers object.
 * @param headers - Headers object
 * @param cookieName - Name of the cookie to extract
 * @returns Cookie value or null if not found
 */
function getCookieFromHeaders(headers: Headers, cookieName: string): string | null {
  const cookieHeader = headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }
  
  const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
  const targetCookie = cookies.find(cookie => cookie.startsWith(`${cookieName}=`));
  
  if (!targetCookie) {
    return null;
  }
  
  return targetCookie.split('=')[1];
}
