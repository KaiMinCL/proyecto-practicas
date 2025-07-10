'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  LogIn, 
  User, 
  Settings, 
  LogOut,
  Bell
} from 'lucide-react';
import { usePathname } from 'next/navigation';

// Tipado para alertas
interface NavbarAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  count?: number;
}

export default function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const [alerts, setAlerts] = React.useState<NavbarAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = React.useState(false);

  React.useEffect(() => {
    if (!user || (user.rol !== 'SUPER_ADMIN' && user.rol !== 'COORDINADOR')) return;
    setLoadingAlerts(true);
    if (user.rol === 'SUPER_ADMIN') {
      fetch('/api/admin/dashboard/alerts')
        .then(res => res.json())
        .then(data => {
          if (data && data.data) setAlerts(data.data);
        })
        .finally(() => setLoadingAlerts(false));
    } else {
      fetch(`/api/${user.rol.toLowerCase()}/stats`)
        .then(res => res.json())
        .then(data => {
          if (data && data.alertas) setAlerts(data.alertas);
          else if (data && data.practicasPendientesRevision) {
            const arr: NavbarAlert[] = [];
            if (data.practicasPendientesRevision > 0) {
              arr.push({
                id: '1',
                type: 'warning' as const,
                title: 'Prácticas pendientes de revisión',
                description: `Tienes ${data.practicasPendientesRevision} prácticas que requieren revisión`,
                count: data.practicasPendientesRevision
              });
            }
            setAlerts(arr);
          }
        })
        .finally(() => setLoadingAlerts(false));
    }
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center h-16">
          {/* Logo */}
          <Link 
            href={user ? "/dashboard" : "/"} 
            className="flex items-center space-x-2 font-bold text-xl text-foreground hover:text-primary transition-colors mr-auto"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span>Portal Prácticas</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center space-x-4 ml-auto">
            {/* Notificaciones para Admin y Coordinador */}
            {user && (user.rol === 'SUPER_ADMIN' || user.rol === 'COORDINADOR') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative p-2">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {alerts.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-white rounded-full text-xs w-5 h-5 flex items-center justify-center animate-pulse">
                        {alerts.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="px-2 py-2 font-semibold text-foreground text-sm border-b">Alertas del Sistema</div>
                  {loadingAlerts ? (
                    <div className="p-4 text-center text-muted-foreground text-xs">Cargando alertas...</div>
                  ) : alerts.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-xs">Sin alertas pendientes</div>
                  ) : alerts.map(alert => (
                    <DropdownMenuItem key={alert.id} className="flex flex-col items-start gap-1">
                      <span className="font-medium text-sm">{alert.title}</span>
                      <span className="text-xs text-muted-foreground">{alert.description}</span>
                      {alert.count && <span className="text-xs font-bold text-primary">{alert.count}</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            ) : user ? (
              <>
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 h-9 hover:bg-muted">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="hidden md:block text-left">
                        <div className="text-sm font-medium text-foreground">
                          {user.nombre} {user.apellido}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.rol}
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <div className="text-sm font-medium text-foreground">
                        {user.nombre} {user.apellido}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.email || user.rut}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/perfil" className="flex items-center cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Mi Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={logout}
                      className="flex items-center cursor-pointer text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              // Hide login button on login page routes
              pathname !== '/' && pathname !== '/login' && (
                <div className="flex items-center space-x-3">
                  {/* Login Button */}
                  <Button asChild variant="default" size="sm">
                    <Link href="/login" className="flex items-center">
                      <LogIn className="mr-2 h-4 w-4" />
                      Iniciar Sesión
                    </Link>
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}