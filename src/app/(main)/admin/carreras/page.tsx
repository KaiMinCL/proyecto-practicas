import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';

const REQUIRED_ROLE: RoleName = 'SUPERADMIN';

export default async function CarrerasAdminPage() {
  const userPayload = await getUserSession(); 

  if (!userPayload) {
    // Si no hay sesión, redirige a la página de login.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const loginUrl = new URL('/login', baseUrl);
    redirect(loginUrl.toString());
  }

  if (userPayload.rol !== REQUIRED_ROLE) {
    // Si el usuario está logueado pero no tiene el rol correcto,
    // redirige a una página principal (ej. dashboard).
    console.warn(
      `Acceso no autorizado a /admin/carreras. Usuario RUT: ${userPayload.rut}, Rol: ${userPayload.rol}. Rol requerido: ${REQUIRED_ROLE}`
    );
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const dashboardUrl = new URL('/dashboard', baseUrl);
    redirect(dashboardUrl.toString());
  }

  // Si llegamos aquí, el usuario está autenticado y tiene el rol correcto.
  // En el siguiente commit, esta página obtendrá los datos iniciales (lista de carreras)
  // y los pasará a un componente cliente para su visualización y manejo.

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
        {/* Este contenido se reemplazará con el componente cliente que incluirá la DataTable */}
        <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg min-h-[300px] flex items-center justify-center">
          <p className="text-center text-gray-500 dark:text-gray-400">
            Próximamente: Tabla de Carreras y opciones de administración.
          </p>
        </div>
      </section>
    </div>
  );
}