import type { RoleName } from './roles'; 

export interface UserSessionData {
  id: number;
  rut: string;
  nombre: string;
  rol: RoleName;
}

export interface Session {
  user: UserSessionData | null;
}