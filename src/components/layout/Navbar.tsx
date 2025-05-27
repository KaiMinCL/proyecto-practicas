'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui/button'; 
import { Skeleton } from '@/components/ui/skeleton';
import { FilePlus2 } from 'lucide-react'; 

export default function Navbar() {
  const { user, isLoading, logout } = useAuth();

  const isCoordinador = user?.rol === 'COORDINADOR';

  return (
    <nav className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold hover:text-gray-300">
          Portal Prácticas
        </Link>

        <div className="flex items-center space-x-4">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-32 bg-gray-700" />
              <Skeleton className="h-5 w-24 bg-gray-700" />
              <Skeleton className="h-5 w-16 bg-gray-700" />
              <Skeleton className="h-10 w-20 bg-gray-700" />
            </>
          ) : user ? (
            <>
              {/* Botón para Iniciar Práctica (solo para Coordinador) */}
              {isCoordinador && (
                <Button asChild variant="outline" size="sm" className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600 text-white">
                  <Link href="/coordinador/practicas/iniciar">
                    <FilePlus2 className="mr-0 sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Iniciar Práctica</span>
                  </Link>
                </Button>
              )}

              <div className="text-sm">
                <span className="font-semibold">{user.nombre} {user.apellido}</span>
                <span className="block text-xs text-gray-400">{user.rol}</span>
              </div>
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