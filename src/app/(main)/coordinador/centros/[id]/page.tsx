import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';
import { DetalleCentroClient } from './detalle-centro-client';

const REQUIRED_ROLE: RoleName = 'COORDINADOR';

export default async function DetalleCentroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userPayload = await getUserSession();

  if (!userPayload) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const loginUrl = new URL('/login', baseUrl);
    redirect(loginUrl.toString());
  }

  if (userPayload.rol !== REQUIRED_ROLE) {
    console.warn(
      `Acceso no autorizado a /coordinador/centros/[id]. Usuario RUT: ${userPayload.rut}, Rol: ${userPayload.rol}. Rol requerido: ${REQUIRED_ROLE}`
    );
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const dashboardUrl = new URL('/dashboard', baseUrl);
    redirect(dashboardUrl.toString());
  }

  const { id } = await params;
  const centroId = parseInt(id, 10);

  if (isNaN(centroId)) {
    throw new Error('ID de centro inválido');
  }

  return <DetalleCentroClient centroId={centroId} />;
}
