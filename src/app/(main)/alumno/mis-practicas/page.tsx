import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';
import type { PracticaConDetalles } from '@/lib/validators/practica';
import { ActionResponse, getMisPracticasPendientesAction } from '../practicas/actions';
import { MisPracticasCliente } from './mis-practicas-client';

const REQUIRED_ROLE: RoleName = 'ALUMNO';

export default async function MisPracticasPage() {
  const userPayload = await getUserSession();

  if (!userPayload) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const loginUrl = new URL('/login', baseUrl);
    redirect(loginUrl.toString());
  }

  if (userPayload.rol !== REQUIRED_ROLE) {
    console.warn(
      `Acceso no autorizado a /alumno/mis-practicas. Usuario RUT: ${userPayload.rut}, Rol: ${userPayload.rol}. Rol requerido: ${REQUIRED_ROLE}`
    );
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const dashboardUrl = new URL('/dashboard', baseUrl);
    redirect(dashboardUrl.toString());
  }

  // Llama a la action para obtener las prácticas pendientes del alumno
  const result: ActionResponse<PracticaConDetalles[]> = await getMisPracticasPendientesAction();
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Mis Prácticas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gestiona tus prácticas asignadas y completa la información requerida
            </p>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Pendiente de completar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <MisPracticasCliente initialActionResponse={result} />
    </div>
  );
}