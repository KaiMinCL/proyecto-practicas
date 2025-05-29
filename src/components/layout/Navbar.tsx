'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FilePlus2, ListChecks, LogIn } from 'lucide-react';
import type { RoleName } from '@/types/roles';

export default function Navbar() {
  const { user, isLoading, logout } = useAuth();

  // Determinar roles de forma segura
  const isCoordinador = user?.rol === ('COORDINADOR' as RoleName);
  const isAlumno = user?.rol === ('ALUMNO' as RoleName);

  return (
    <nav className="bg-gray-800 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href={user ? "/dashboard" : "/"} className="text-xl font-bold hover:text-gray-300 transition-colors">
          Portal Prácticas
        </Link>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {isLoading ? (
            <>
              {/* Skeletons para placeholders de botones de rol y usuario */}
              <Skeleton className="h-9 w-28 sm:w-32 bg-gray-700 rounded-md" /> 
              <Skeleton className="h-9 w-28 sm:w-32 bg-gray-700 rounded-md" /> 
              <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-20 bg-gray-700 rounded" />
                  <Skeleton className="h-9 w-24 bg-gray-700 rounded-md" />
              </div>
            </>
          ) : user ? (
            <>
              {/* Botón para Iniciar Práctica (solo para Coordinador) */}
              {isCoordinador && (
                <Button asChild variant="default" size="sm" className="bg-sky-600 hover:bg-sky-700 text-white">
                  <Link href="/coordinador/practicas/iniciar">
                    <FilePlus2 className="mr-0 sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Iniciar Práctica</span>
                  </Link>
                </Button>
              )}

              {/* Botón para Mis Prácticas (solo para Alumno) */}
              {isAlumno && (
                <Button asChild variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Link href="/alumno/mis-practicas">
                    <ListChecks className="mr-0 sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Mis Prácticas</span>
                  </Link>
                </Button>
              )}
              
              {/* Aquí podrías añadir más botones condicionales para otros roles */}

              <div className="text-sm text-right sm:text-left ml-2"> {/* Margen izquierdo añadido para separar de botones */}
                <span className="font-semibold block sm:inline">{user.nombre} {user.apellido}</span>
                <span className="block text-xs text-gray-400 sm:ml-1">({user.rol})</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600 px-2 sm:px-3"
              >
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <>
              {/* Botón de Login si no hay usuario */}
              <Button asChild variant="outline" size="sm" className="text-white border-gray-600 hover:bg-gray-700 hover:text-white">
                <Link href="/login">
                  <LogIn className="mr-0 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Iniciar Sesión</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}