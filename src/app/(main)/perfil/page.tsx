
import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import { PerfilClient } from './perfil-client';

export default async function PerfilPage() {
  const userPayload = await getUserSession();

  if (!userPayload) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const loginUrl = new URL('/login', baseUrl);
    redirect(loginUrl.toString());
  }

  return <PerfilClient user={userPayload} />;
}