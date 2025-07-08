import type { UserJwtPayload } from '@/lib/auth-utils';

/**
 * Utilidades para implementar HU-54: Restricciones de visibilidad por sede/carrera
 * 
 * Estas funciones ayudan a aplicar consistentemente las restricciones de datos
 * según el rol y sede asignada del usuario.
 */

export interface SedeRestrictions {
  shouldApplySedeFilter: boolean;
  sedeId: number | null;
  userRole: string;
}

/**
 * Determina si se deben aplicar restricciones por sede según el rol del usuario
 * y devuelve la información necesaria para aplicar los filtros.
 * 
 * @param user - Payload del usuario autenticado
 * @returns Objeto con información de restricciones
 */
export function getSedeRestrictions(user: UserJwtPayload): SedeRestrictions {
  // SA puede ver todos los datos
  if (user.rol === 'SUPER_ADMIN') {
    return {
      shouldApplySedeFilter: false,
      sedeId: null,
      userRole: user.rol,
    };
  }

  // DC y Coordinador solo ven datos de su sede asignada
  if (['DIRECTOR_CARRERA', 'COORDINADOR'].includes(user.rol)) {
    return {
      shouldApplySedeFilter: user.sedeId !== null && user.sedeId !== undefined,
      sedeId: user.sedeId || null,
      userRole: user.rol,
    };
  }

  // Otros roles no tienen acceso a reportes/consultas generales
  return {
    shouldApplySedeFilter: true,
    sedeId: null, // Esto efectivamente bloqueará el acceso
    userRole: user.rol,
  };
}

/**
 * Genera filtros para queries de Prisma que incluyen restricciones por sede
 * 
 * @param restrictions - Restricciones obtenidas de getSedeRestrictions
 * @returns Objeto con filtros para usar en where clauses de Prisma
 */
export function getSedeWhereFilter(restrictions: SedeRestrictions) {
  if (!restrictions.shouldApplySedeFilter) {
    return {}; // Sin restricciones
  }

  if (!restrictions.sedeId) {
    // Usuario sin sede asignada o rol sin permisos - bloquear acceso
    return { id: -1 }; // Filtro que no coincidirá con ningún registro
  }

  return { sedeId: restrictions.sedeId };
}

/**
 * Genera filtros para queries de Prisma que incluyen restricciones por sede
 * a través de la relación carrera
 * 
 * @param restrictions - Restricciones obtenidas de getSedeRestrictions
 * @returns Objeto con filtros para usar en where clauses de Prisma
 */
export function getCarreraSedeWhereFilter(restrictions: SedeRestrictions) {
  if (!restrictions.shouldApplySedeFilter) {
    return {}; // Sin restricciones
  }

  if (!restrictions.sedeId) {
    // Usuario sin sede asignada o rol sin permisos - bloquear acceso
    return { carrera: { id: -1 } }; // Filtro que no coincidirá con ningún registro
  }

  return { carrera: { sedeId: restrictions.sedeId } };
}

/**
 * Verifica si un usuario tiene permisos para acceder a reportes/consultas
 * 
 * @param user - Payload del usuario autenticado
 * @returns true si el usuario puede acceder a reportes/consultas
 */
export function canAccessReports(user: UserJwtPayload): boolean {
  return ['SUPER_ADMIN', 'DIRECTOR_CARRERA', 'COORDINADOR'].includes(user.rol);
}

/**
 * Verifica si un usuario tiene permisos para acceder a un reporte específico
 * 
 * @param user - Payload del usuario autenticado
 * @param reportType - Tipo de reporte ('volume', 'status', 'nomina', etc.)
 * @returns true si el usuario puede acceder al reporte específico
 */
export function canAccessSpecificReport(user: UserJwtPayload, reportType: string): boolean {
  switch (reportType) {
    case 'volume':
    case 'status':
      // HU-51, HU-52: Solo SA y DC
      return ['SUPER_ADMIN', 'DIRECTOR_CARRERA'].includes(user.rol);
    
    case 'nomina':
      // HU-53: DC y Coordinador
      return ['DIRECTOR_CARRERA', 'COORDINADOR'].includes(user.rol);
    
    case 'repositorio':
      // Repositorio de informes: SA, DC y Coordinador
      return ['SUPER_ADMIN', 'DIRECTOR_CARRERA', 'COORDINADOR'].includes(user.rol);
    
    default:
      return false;
  }
}

/**
 * Valida que un usuario tenga sede asignada si su rol lo requiere
 * 
 * @param user - Payload del usuario autenticado
 * @returns Error message si hay problema, null si está ok
 */
export function validateUserSedeAssignment(user: UserJwtPayload): string | null {
  if (['DIRECTOR_CARRERA', 'COORDINADOR'].includes(user.rol)) {
    if (!user.sedeId) {
      return `Usuario con rol ${user.rol} debe tener una sede asignada`;
    }
  }
  return null;
}
