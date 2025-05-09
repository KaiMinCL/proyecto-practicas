'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext'; 
import { Button } from '@/components/ui/button'; 
import { Skeleton } from '@/components/ui/skeleton'

export default function Navbar() {
  const { user, isLoading, logout } = useAuth();

  return (
    <nav className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold hover:text-gray-300">
          Portal Prácticas
        </Link>

        <div className="flex items-center space-x-4">
          {isLoading ? (
            <>
              <Skeleton className="h-5 w-24 bg-gray-700" />
              <Skeleton className="h-5 w-16 bg-gray-700" />
              <Skeleton className="h-10 w-20 bg-gray-700" />
            </>
          ) : user ? (
            <>
              <div className="text-sm">
                <span className="font-semibold">{user.nombre} {user.apellido}</span>
                <span className="block text-xs text-gray-400">{user.rol}</span>
              </div>
              {/* Podría añadirse un enlace al perfil del usuario*/}
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600"
              >
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}