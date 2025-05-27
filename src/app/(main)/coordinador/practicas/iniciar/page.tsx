import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';
import { IniciarPracticaForm } from './iniciar-practica-form';

const REQUIRED_ROLE: RoleName = 'COORDINADOR';

export default async function IniciarPracticaPage() {
  const userPayload = await getUserSession();

  if (!userPayload) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const loginUrl = new URL('/login', baseUrl);
    redirect(loginUrl.toString());
  }

  if (userPayload.rol !== REQUIRED_ROLE) {
    console.warn(
      `Acceso no autorizado a /coordinador/practicas/iniciar. Usuario RUT: ${userPayload.rut}, Rol: ${userPayload.rol}. Rol requerido: ${REQUIRED_ROLE}`
    );
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    // Redirigir a una página principal del coordinador o dashboard general
    const dashboardUrl = new URL(userPayload.rol === 'SUPERADMIN' ? '/admin' : '/dashboard', baseUrl); 
    redirect(dashboardUrl.toString());
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Iniciar Registro de Práctica (Acta 1 - Coordinador)
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Complete los siguientes datos para formalizar el inicio de la práctica del alumno. La información del centro de práctica será completada por el alumno.
        </p>
      </header>
      <section>
        <IniciarPracticaForm />
      </section>
    </div>
  );
}