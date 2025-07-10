import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';
import { CentrosPracticaClient } from './centros-practica-client';
import { Briefcase } from 'lucide-react';

const REQUIRED_ROLE: RoleName = 'SUPER_ADMIN';

export default async function CentrosPracticaAdminPage() {
  const userPayload = await getUserSession();

  if (!userPayload) {
    redirect('/login');
  }

  if (userPayload.rol !== REQUIRED_ROLE) {
    console.warn(`Acceso no autorizado a /admin/centros-practica. Rol: ${userPayload.rol}.`);
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
          <Briefcase className="h-8 w-8" />
          Gestión de Centros de Práctica
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Crea, edita, asocia empleadores y administra todos los centros de práctica del sistema.
        </p>
      </header>

      <CentrosPracticaClient />
    </div>
  );
}