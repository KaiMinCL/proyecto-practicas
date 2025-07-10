
import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import { DashboardAdmin } from '@/app/(main)/dashboard/dashboard-admin';

export default async function AdminDashboard() {
  const userPayload = await getUserSession();

  if (!userPayload) {
    redirect('/login');
  }

  if (userPayload.rol !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardAdmin user={userPayload} />
    </div>
  );
}