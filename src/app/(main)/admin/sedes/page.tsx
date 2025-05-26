import { redirect } from 'next/navigation';
import { Terminal } from "lucide-react";

import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';
import { listSedesAction, type ActionResponse } from './actions'; 
import { columns } from './columns';
import { SedesDataTable } from './sedes-data-table';
import type { Sede } from '@/lib/validators/sede';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  if (result.success && result.data) {
    sedesData = result.data;
  } else {
    fetchError = result.error || "No se pudieron cargar las sedes desde el servidor.";
    console.error("Error al obtener las sedes para la página:", fetchError, result.errors);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Gestión de Sedes
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Visualiza y administra las sedes de la institución.
          </p>
        </div>
        {/* El botón para "Crear Nueva Sede" se añadirá en el próximo commit, probablemente aquí o en la toolbar de DataTable */}
      </header>

      <section>
        {fetchError && (
          <Alert variant="destructive" className="mb-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error al Cargar Datos</AlertTitle>
            <AlertDescription>
              {fetchError}
              {result.errors && (
                <ul className="mt-2 list-disc pl-5">
                  {result.errors.map((err, idx) => (
                    <li key={idx}>{`Campo '${err.field}': ${err.message}`}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}
        <SedesDataTable columns={columns} data={sedesData} searchColumnId="nombre" searchPlaceholder="Filtrar por nombre de sede..." />
      </section>
    </div>
  );
}