import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from './prisma'; // Asegúrate que prisma esté importado
import { LoginFormData } from './validators'; // Importa el tipo del validador

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

if (!JWT_SECRET) {
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
  // TODO:
  // 1. Buscar usuario en BD por RUT.
  // 2. Si no existe o está inactivo, retornar error/null.
  // 3. Comparar contraseña hasheada.
  // 4. Si es correcta, retornar datos del usuario (id, rol, etc.).

  console.log("verifyCredentials llamado con:", credentials);
  return null; // Temporal
}

/**
 * Generates a JWT token for a user.
 * @param payload - The payload to include in the token.
 * @returns The generated JWT token.
 */
export function generateJwtToken(payload: { userId: number; rut: string; rol: string; /* otros datos necesarios en el token */ }) {
  if (!JWT_SECRET) {
    console.error("Error al generar token: JWT_SECRET no está configurado.");
    throw new Error("Error de configuración del servidor al generar token.");
  }
  // TODO: Usar un método de firma a uno más seguro y moderno.
  // jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  console.log("generateJwtToken llamado con payload:", payload); // Log temporal
  return "dummy-jwt-token"; // Temporal
}

/**
 * Sets an authentication cookie in the response.
 * @param res - The response object.
 * @param token - The JWT token to set in the cookie.
 * @returns void
 *
 */
export function setAuthCookie(res: Response, token: string) {
  // TODO: Implementar la lógica para establecer la cookie de autenticación.
  // Usar la API de cookies de Next.js

  // cookies().set('session_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: ... });
  console.log("setAuthCookie llamado con token:", token); // Log temporal
  // Esta función probablemente no devuelva nada, sino que modifique el objeto Response o use una API de cookies.
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

export {}; 