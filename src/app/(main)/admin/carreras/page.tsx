import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';
import { listCarrerasAction, type ActionResponse } from './actions';
import type { Carrera } from '@/lib/validators/carrera';
import { CarrerasPageClientContent } from './carreras-page-client-content';

const REQUIRED_ROLE: RoleName = 'SUPERADMIN';

export default async function CarrerasAdminPage() {
  const userPayload = await getUserSession();

  if (!userPayload) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const loginUrl = new URL('/login', baseUrl);
    redirect(loginUrl.toString());
  }

  if (userPayload.rol !== REQUIRED_ROLE) {
    console.warn(
      `Acceso no autorizado a /admin/carreras. Usuario RUT: ${userPayload.rut}, Rol: ${userPayload.rol}. Rol requerido: ${REQUIRED_ROLE}`
    );
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const dashboardUrl = new URL('/dashboard', baseUrl);
    redirect(dashboardUrl.toString());
  }

  // Obtener datos de las carreras
  const result: ActionResponse<Carrera[]> = await listCarrerasAction();
  let carrerasData: Carrera[] = [];
  let fetchError: string | null = null;

  if (result.success && result.data) {
    carrerasData = result.data;
  } else {
    fetchError = result.error || "No se pudieron cargar las carreras.";
    console.error("Error al obtener las carreras para la página:", fetchError, result.errors);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Gestión de Carreras
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Administra las carreras ofrecidas por la institución y su asociación a las sedes.
        </p>
      </header>

      <section>
        <CarrerasPageClientContent 
          initialCarreras={carrerasData} 
          initialFetchError={fetchError}
        />
      </section>
    </div>
  );
}