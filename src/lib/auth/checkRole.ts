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

/**
 * Helper específico para autorizar al Alumno.
 * @returns El payload del token del usuario (UserJwtPayload) si está autorizado como Alumno.
 * @throws Error si el usuario no está autenticado o no es Alumno.* 
 */
export async function authorizeAlumno(): Promise<UserJwtPayload> {
  return authorize('ALUMNO' as RoleName);
}

/**
 * Helper específico para autorizar al Docente.
 */
export async function authorizeDocente(): Promise<UserJwtPayload> {
  return authorize('DOCENTE' as RoleName);
}

/**
 * Verifica si el usuario actual tiene el rol de Super Administrador O Director de Carrera.
 * Lanza un error si no está autorizado.
 * @returns El payload del token del usuario (UserJwtPayload) si está autorizado.
 * @throws Error si el usuario no está autenticado o no tiene uno de los roles requeridos.
 */
export async function authorizeSuperAdminOrDirectorCarrera(): Promise<UserJwtPayload> {
  const userPayload = await getUserSession();

  if (!userPayload) {
    throw new Error('Acceso denegado. No estás autenticado.');
  }

  const userRole = userPayload.rol as RoleName;
  const allowedRoles: RoleName[] = ['SUPERADMIN', 'DIRECTOR_CARRERA'];

   if (!allowedRoles.includes(userRole)) {
    console.warn(
      `Intento de acceso no autorizado. Roles requeridos: ${allowedRoles.join(' o ')}, Rol del usuario: ${userRole}, Usuario RUT: ${userPayload.rut}`
    );
    throw new Error(
      `Acceso denegado. Se requiere el rol de ${allowedRoles.join(' o ')}.`
    );
  }
  return userPayload;
}
