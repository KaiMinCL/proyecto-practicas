import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';
import type { PracticaConDetalles } from '@/lib/validators/practica';
import { ActionResponse, getMisPracticasCompletasAction } from '../practicas/actions';
import { MisPracticasCliente } from './mis-practicas-client';
import { BookOpen } from 'lucide-react';

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

  // Llama a la action para obtener todas las prácticas del alumno
  const result: ActionResponse<PracticaConDetalles[]> = await getMisPracticasCompletasAction();
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-border p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Mis Prácticas
            </h1>
            <p className="font-medium text-muted-foreground">
              Gestiona tus prácticas asignadas, completa la información requerida y sube tus informes finales.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <MisPracticasCliente initialActionResponse={result} />
    </div>
  );
}