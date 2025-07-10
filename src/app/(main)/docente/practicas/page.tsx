import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';
import { getMisPracticasAction, type ActionResponse } from '../practicas/actions'; 
import type { PracticaConDetalles } from '@/lib/validators/practica';
import { PracticasDocenteCliente } from './practicas-docente-client';
import { BookOpen } from 'lucide-react';

const REQUIRED_ROLE: RoleName = 'DOCENTE';

export default async function PracticasDocentePage() {
  const userPayload = await getUserSession();

  if (!userPayload) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const loginUrl = new URL('/login', baseUrl);
    redirect(loginUrl.toString());
  }

  if (userPayload.rol !== REQUIRED_ROLE) {
    console.warn(
      `Acceso no autorizado a /docente/practicas. Usuario RUT: ${userPayload.rut}, Rol: ${userPayload.rol}. Rol requerido: ${REQUIRED_ROLE}`
    );
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const dashboardUrl = new URL('/dashboard', baseUrl);
    redirect(dashboardUrl.toString());
  }

  const result: ActionResponse<PracticaConDetalles[]> = await getMisPracticasAction();
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-border p-8 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Mis Prácticas
                </h1>
                <p className="font-medium text-primary">
                  {userPayload.nombre} {userPayload.apellido}
                </p>
              </div>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Gestiona todas las prácticas bajo tu supervisión: acepta actas, evalúa informes y supervisa el progreso
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center space-x-2 text-sm bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{backgroundColor: '#FF6B35'}}></div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Pendiente acción</span>
            </div>
            <div className="flex items-center space-x-2 text-sm bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border">
              <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#007F7C'}}></div>
              <span className="font-medium text-gray-700 dark:text-gray-300">En progreso</span>
            </div>
            <div className="flex items-center space-x-2 text-sm bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border">
              <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#00C853'}}></div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Completada</span>
            </div>
          </div>
        </div>
      </div>
      
      <PracticasDocenteCliente initialActionResponse={result} />
    </div>
  );
}
