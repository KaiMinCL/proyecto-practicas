import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';
import { UsuariosCoordinadorContent } from './components/UsuariosCoordinadorContent';
import { Users } from 'lucide-react';

const REQUIRED_ROLE: RoleName = 'COORDINADOR';

export default async function UsuariosCoordinadorPage() {
  const userPayload = await getUserSession();

  if (!userPayload) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const loginUrl = new URL('/login', baseUrl);
    redirect(loginUrl.toString());
  }

  if (userPayload.rol !== REQUIRED_ROLE) {
    console.warn(
      `Acceso no autorizado a /coordinador/usuarios. Usuario RUT: ${userPayload.rut}, Rol: ${userPayload.rol}. Rol requerido: ${REQUIRED_ROLE}`
    );
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const dashboardUrl = new URL('/dashboard', baseUrl);
    redirect(dashboardUrl.toString());
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header minimalista */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Gestión de Usuarios
        </h1>
        <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-4">
          Administra usuarios y consulta claves iniciales de forma segura.
        </p>
      </div>
      <UsuariosCoordinadorContent />
    </div>
  );
}

export const metadata = {
  title: 'Gestión de Usuarios - Sistema de Prácticas',
  description: 'Administra usuarios y consulta claves iniciales de forma segura',
};
