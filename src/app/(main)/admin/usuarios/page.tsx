
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks';
import { useRouter } from 'next/navigation';
import { CreateUserDialog } from './create-user-dialog';

export default function UsuariosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Proteger la ruta - solo SA puede acceder
  useEffect(() => {
    if (mounted && user && user.rol !== 'SA') {
      router.push('/dashboard');
    }
  }, [mounted, user, router]);

  if (!mounted || !user || user.rol !== 'SA') {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <CreateUserDialog />
      </div>
      {/* TODO: Implementar tabla de usuarios */}
      <div className="text-sm text-muted-foreground">
        La tabla de usuarios se implementará próximamente.
      </div>
    </div>
  );
}