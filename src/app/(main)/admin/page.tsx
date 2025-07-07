
import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';

export default async function AdminDashboard() {
  const userPayload = await getUserSession();

  if (!userPayload) {
    redirect('/login');
  }

  if (userPayload.rol !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  // Redirigir directamente a usuarios ya que es la funcionalidad principal
  redirect('/admin/usuarios');
}