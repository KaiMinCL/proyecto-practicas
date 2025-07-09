import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';
// Asegúrate que la ruta a las actions del docente sea correcta
import { getMisPracticasPendientesAceptacionAction, type ActionResponse } from '../practicas/actions'; 
import type { PracticaConDetalles } from '@/lib/validators/practica';
import { PracticasPendientesDocenteCliente } from './practicas-pendientes-docente-client';
import { UserCheck } from 'lucide-react';

const REQUIRED_ROLE: RoleName = 'DOCENTE';

export default async function PracticasPendientesDocentePage() {
  const userPayload = await getUserSession();

  if (!userPayload) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const loginUrl = new URL('/login', baseUrl);
    redirect(loginUrl.toString());
  }

  if (userPayload.rol !== REQUIRED_ROLE) {
    console.warn(
      `Acceso no autorizado a /docente/practicas-pendientes. Usuario RUT: ${userPayload.rut}, Rol: ${userPayload.rol}. Rol requerido: ${REQUIRED_ROLE}`
    );
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const dashboardUrl = new URL('/dashboard', baseUrl);
    redirect(dashboardUrl.toString());
  }

  const result: ActionResponse<PracticaConDetalles[]> = await getMisPracticasPendientesAceptacionAction();
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-gray-200 dark:border-gray-600 p-8 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg" style={{backgroundColor: '#007F7C'}}>
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white" style={{color: '#1E1E1E'}}>
                  Alumnos Asignados
                </h1>
                <p className="font-medium" style={{color: '#007F7C'}}>
                  {userPayload.nombre} {userPayload.apellido}
                </p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
              Revisa las Actas 1 completadas por tus alumnos asignados y acepta formalmente la supervisión
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center space-x-2 text-sm bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{backgroundColor: '#007F7C'}}></div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Pendiente revisión</span>
            </div>
            <div className="flex items-center space-x-2 text-sm bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border">
              <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#00C853'}}></div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Supervisión aceptada</span>
            </div>
          </div>
        </div>
      </div>
      
      <PracticasPendientesDocenteCliente initialActionResponse={result} />
    </div>
  );
}