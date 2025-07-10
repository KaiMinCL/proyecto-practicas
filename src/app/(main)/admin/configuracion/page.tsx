import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import { ConfiguracionClient } from './configuracion-client';


export default async function ConfiguracionPage() {
  const userPayload = await getUserSession();

  if (!userPayload) {
    redirect('/login');
  }

  if (userPayload.rol !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 rounded-lg bg-card p-6 shadow-lg">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Configuración del Sistema
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Configure los parámetros del sistema de evaluación de prácticas.
        </p>
      </header>
      
      <ConfiguracionClient />
    </div>
  );
}
