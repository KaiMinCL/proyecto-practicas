'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ListChecks, LogOut, UserCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function Navbar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Ejemplo de roles, ajusta según tu lógica real
  const isAlumno = user?.rol === 'alumno'
  const isDocente = user?.rol === 'docente'

  return (
    <nav className="w-full bg-emerald-800 px-4 py-3 flex items-center justify-between shadow">
      <div className="flex items-center space-x-4">
        <Link href="/" className="text-white font-bold text-lg">
          Prácticas HU
        </Link>
        {user && (
          <>
            {isAlumno && (
              <Button asChild variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href="/alumno/mis-practicas">
                  <ListChecks className="mr-0 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Mis Prácticas</span>
                </Link>
              </Button>
            )}
            {/* Enlace a Documentos para alumnos y docentes */}
            {(isAlumno || isDocente) && (
              <Button asChild variant="outline" size="sm" className="text-white border-gray-600 hover:bg-gray-700 hover:text-white">
                <Link href="/documentos">
                  <span className="hidden sm:inline">Documentos</span>
                </Link>
              </Button>
            )}
          </>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {user ? (
          <>
            <span className="text-white flex items-center">
              <UserCircle2 className="mr-1 h-5 w-5" />
              {user.nombre}
            </span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-white hover:bg-emerald-900">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Salir</span>
            </Button>
          </>
        ) : (
          <Button asChild variant="default" size="sm" className="bg-white text-emerald-800 hover:bg-gray-100">
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
        )}
      </div>
    </nav>
  )
}