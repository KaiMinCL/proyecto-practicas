import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';
import { listSedesAction, type ActionResponse } from './actions';
import type { Sede } from '@/lib/validators/sede';
import { SedesPageClientContent } from './sedes-page-client-content';

const REQUIRED_ROLE: RoleName = 'SUPERADMIN';

export default async function SedesAdminPage() {
  const userPayload = await getUserSession();

  if (!userPayload) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const loginUrl = new URL('/login', baseUrl);
    redirect(loginUrl.toString());
  }

  if (userPayload.rol !== REQUIRED_ROLE) {
    console.warn(
      `Acceso no autorizado a /admin/sedes. Usuario RUT: ${userPayload.rut}, Rol: ${userPayload.rol}. Rol requerido: ${REQUIRED_ROLE}`
    );
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const dashboardUrl = new URL('/dashboard', baseUrl);
    redirect(dashboardUrl.toString());
  }

  const result: ActionResponse<Sede[]> = await listSedesAction();
  let sedesData: Sede[] = [];
  let fetchError: string | null = null;
  // let actionErrors = undefined; // Si listSedesAction pudiera devolver errores de Zod

  if (result.success && result.data) {
    sedesData = result.data;
  } else {
    fetchError = result.error || "No se pudieron cargar las sedes desde el servidor.";
    console.error("Error al obtener las sedes para la página:", fetchError, result.errors);
    // actionErrors = result.errors;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Gestión de Sedes
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Visualiza y administra las sedes de la institución.
          </p>
        </div>
      </header>

      <section>
        <SedesPageClientContent 
          initialSedes={sedesData} 
          initialFetchError={fetchError}
          // initialActionErrors={actionErrors} 
        />
      </section>
    </div>
  );
}