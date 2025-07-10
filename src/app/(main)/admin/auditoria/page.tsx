import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import { History } from 'lucide-react';
import { AuditoriaClient } from './auditoria-client';

export default async function AuditoriaPage() {
  const user = await getUserSession();
  if (user?.rol !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
          <History className="h-8 w-8" />
          Logs de Auditoría del Sistema
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Registro detallado de todas las acciones realizadas en la plataforma para fines de seguimiento y seguridad.
        </p>
      </header>
      <AuditoriaClient />
    </div>
  );
}