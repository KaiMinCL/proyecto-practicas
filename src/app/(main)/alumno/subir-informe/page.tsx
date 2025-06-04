import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';
import type { PracticaConDetalles } from '@/lib/validators/practica';
import { ActionResponse, getMisPracticasParaInformeAction } from '../practicas/actions';
import { SubirInformeCliente } from './subir-informe-client';

const REQUIRED_ROLE: RoleName = 'ALUMNO';

export default async function SubirInformePage() {
  const userPayload = await getUserSession();

  if (!userPayload) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const loginUrl = new URL('/login', baseUrl);
    redirect(loginUrl.toString());
  }

  if (userPayload.rol !== REQUIRED_ROLE) {
    console.warn(
      `Acceso no autorizado a /alumno/subir-informe. Usuario RUT: ${userPayload.rut}, Rol: ${userPayload.rol}. Rol requerido: ${REQUIRED_ROLE}`
    );
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const dashboardUrl = new URL('/dashboard', baseUrl);
    redirect(dashboardUrl.toString());
  }

  // Llama a la action para obtener las prácticas que pueden subir informe
  const result: ActionResponse<PracticaConDetalles[]> = await getMisPracticasParaInformeAction();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Subir Informe de Práctica
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Aquí puedes subir los informes de tus prácticas que estén en curso o finalizadas pendientes de evaluación.
        </p>
      </header>
      <SubirInformeCliente initialActionResponse={result} />
    </div>
  );
}
