import { getUserSession } from '@/lib/auth'; 
import type { UserJwtPayload } from '@/lib/auth';
import type { RoleName } from '@/types/roles';

/**
 * Verifica si el usuario actual tiene el rol requerido.
 * Lanza un error si no está autorizado. Ideal para usar en Server Actions.
 * @param requiredRole El nombre del rol (definido en RoleName) necesario para acceder al recurso.
 * @returns El payload del token del usuario (UserJwtPayload) si está autorizado.
 * @throws Error si el usuario no está autenticado o no tiene el rol requerido.
 */
export async function authorize(requiredRole: RoleName): Promise<UserJwtPayload> {
  const userPayload = await getUserSession();

  if (!userPayload) {
    throw new Error('Acceso denegado. No estás autenticado o tu sesión ha expirado.');
  }

  if (userPayload.rol !== requiredRole) {
    console.warn(`Intento de acceso no autorizado para el rol ${requiredRole}. Usuario RUT: ${userPayload.rut}, Rol actual: ${userPayload.rol}`);
    throw new Error(
      `Acceso denegado. Se requiere el rol de "<span class="math-inline">\{requiredRole\}", tu rol actual es "</span>{userPayload.rol}".`
    );
  }

  return userPayload;
}

/**
 * Helper específico para autorizar al Super Administrador.
 * @returns El payload del token del usuario (UserJwtPayload) si está autorizado como Super Administrador.
 * @throws Error si el usuario no está autenticado o no es Super Administrador.
 */
export async function authorizeSuperAdmin(): Promise<UserJwtPayload> {
  return authorize('SUPERADMIN' as RoleName); 
}

/**
 * Helper específico para autorizar al Coordinador.
 * @returns El payload del token del usuario (UserJwtPayload) si está autorizado como Coordinador.
 * @throws Error si el usuario no está autenticado o no es Coordinador.
 */
export async function authorizeCoordinador(): Promise<UserJwtPayload> {
  return authorize('COORDINADOR' as RoleName);
}