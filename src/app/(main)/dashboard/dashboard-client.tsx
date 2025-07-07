'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { 
  Users, 
  Building,
  BookOpen, 
  TrendingUp
} from 'lucide-react';
import type { UserJwtPayload } from '@/lib/auth-utils';

interface DashboardClientProps {
  user: UserJwtPayload;
}

interface StatCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<any>;
}

interface AdminStats {
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosInactivos: number;
  sedesActivas: number;
  carrerasActivas: number;
  totalPracticasEsteMes: number;
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (user.rol === 'SUPER_ADMIN') {
        try {
          const response = await fetch('/api/admin/stats');
          if (response.ok) {
            const data = await response.json();
            setStats(data);
          }
        } catch (error) {
          console.error('Error al cargar estadísticas:', error);
        }
      }
      setLoading(false);
    };

    fetchStats();
  }, [user.rol]);

  const getStatCards = (): StatCard[] => {
    if (user.rol === 'SUPER_ADMIN' && stats) {
      return [
        {
          title: 'Total Usuarios',
          value: stats.totalUsuarios,
          description: 'En el sistema',
          icon: Users,
        },
        {
          title: 'Usuarios Activos',
          value: stats.usuariosActivos,
          description: 'Con acceso al sistema',
          icon: Users,
        },
        {
          title: 'Sedes Activas',
          value: stats.sedesActivas,
          description: 'De la institución',
          icon: Building,
        },
        {
          title: 'Carreras Activas',
          value: stats.carrerasActivas,
          description: 'Configuradas',
          icon: BookOpen,
        },
        {
          title: 'Prácticas Este Mes',
          value: stats.totalPracticasEsteMes,
          description: 'Iniciadas en el mes actual',
          icon: TrendingUp,
        },
      ];
    }
    
    // Para otros roles, no mostrar estadísticas por ahora
    return [];
  };

  const getRoleDisplayName = (rol: string): string => {
    const roleNames: Record<string, string> = {
      'SUPER_ADMIN': 'Super Administrador',
      'DIRECTOR_CARRERA': 'Director de Carrera',
      'COORDINADOR': 'Coordinador',
      'DOCENTE': 'Docente',
      'ALUMNO': 'Alumno',
      'EMPLEADOR': 'Empleador',
    };
    return roleNames[rol] || rol;
  };

  const statCards = getStatCards();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          ¡Bienvenido, {user.nombre} {user.apellido}!
        </h1>
        <p className="text-blue-100 dark:text-blue-200">
          Sistema de Gestión de Prácticas Profesionales
        </p>
        <Badge variant="secondary" className="mt-3 bg-white/20 text-white border-white/30">
          {getRoleDisplayName(user.rol)}
        </Badge>
      </div>

      {/* Stats Overview - Solo para Super Admin */}
      {user.rol === 'SUPER_ADMIN' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : statCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.title}
                      </CardTitle>
                      <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {stat.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : null}
        </>
      )}

      {/* Message for other roles */}
      {user.rol !== 'SUPER_ADMIN' && (
        <Card>
          <CardHeader>
            <CardTitle>Panel Principal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Utiliza el menú lateral para navegar a las diferentes funcionalidades disponibles para tu rol.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
