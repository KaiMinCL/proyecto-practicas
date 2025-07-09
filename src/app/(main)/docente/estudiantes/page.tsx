import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';
import { EstudiantesDocenteContent } from './components/EstudiantesDocenteContent';
import { Users } from 'lucide-react';

const REQUIRED_ROLE: RoleName = 'DOCENTE';

export default async function EstudiantesDocentePage() {
  const userPayload = await getUserSession();

  if (!userPayload) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const loginUrl = new URL('/login', baseUrl);
    redirect(loginUrl.toString());
  }

  if (userPayload.rol !== REQUIRED_ROLE) {
    console.warn(
      `Acceso no autorizado a /docente/estudiantes. Usuario RUT: ${userPayload.rut}, Rol: ${userPayload.rol}. Rol requerido: ${REQUIRED_ROLE}`
    );
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const dashboardUrl = new URL('/dashboard', baseUrl);
    redirect(dashboardUrl.toString());
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-gray-200 dark:border-gray-600 p-8 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg" style={{backgroundColor: '#007F7C'}}>
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white" style={{color: '#1E1E1E'}}>
                  Mis Alumnos Supervisados
                </h1>
                <p className="font-medium" style={{color: '#007F7C'}}>
                  {userPayload.nombre} {userPayload.apellido}
                </p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
              Consulta y gestiona el historial completo de tus estudiantes supervisados
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <EstudiantesDocenteContent />
    </div>
  );
}

export const metadata = {
  title: 'Mis Alumnos Supervisados - Sistema de Prácticas',
  description: 'Consulta el historial de estudiantes supervisados y el estado de sus prácticas',
};
