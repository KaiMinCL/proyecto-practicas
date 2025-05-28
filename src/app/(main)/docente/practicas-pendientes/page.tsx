// src/app/(main)/docente/practicas-pendientes/page.tsx
import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';
// Asegúrate que la ruta a las actions del docente sea correcta
import { getMisPracticasPendientesAceptacionAction, type ActionResponse } from '../practicas/actions'; 
import type { PracticaConDetalles } from '@/lib/validators/practica';
import { PracticasPendientesDocenteCliente } from './practicas-pendientes-docente-client';

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
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Prácticas Pendientes de Aceptación
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          A continuación, se listan las Actas 1 de los alumnos que le han sido asignados y requieren su revisión y aceptación.
        </p>
      </header>
      <PracticasPendientesDocenteCliente initialActionResponse={result} />
    </div>
  );
}