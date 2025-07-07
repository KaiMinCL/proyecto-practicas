
import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  const userPayload = await getUserSession();

  if (!userPayload) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const loginUrl = new URL('/login', baseUrl);
    redirect(loginUrl.toString());
  }

  return <DashboardClient user={userPayload} />;
}