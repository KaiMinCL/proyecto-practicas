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
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Mis Prácticas Pendientes
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Aquí puedes ver las prácticas que tienes asignadas y que requieren que completes tu información en el Acta 1.
        </p>
      </header>
      <MisPracticasCliente initialActionResponse={result} />
    </div>
  );
}