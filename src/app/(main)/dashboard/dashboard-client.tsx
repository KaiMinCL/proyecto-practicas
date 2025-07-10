'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { 
  Users, 
  Building,
  BookOpen, 
  TrendingUp,
  GraduationCap,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import type { UserJwtPayload } from '@/lib/auth-utils';

interface DashboardClientProps {
  user: UserJwtPayload;
}

interface StatCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
}

interface AdminStats {
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosInactivos: number;
  sedesActivas: number;
  carrerasActivas: number;
  totalPracticasEsteMes: number;
}

interface CoordinadorStats {
  totalAlumnos: number;
  alumnosConPracticaActiva: number;
  totalEmpleadores: number;
  empleadoresActivos: number;
  practicasEsteMes: number;
  documentosSubidos: number;
  practicasPendientesRevision: number;
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [coordinadorStats, setCoordinadorStats] = useState<CoordinadorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (user.rol === 'SUPER_ADMIN') {
        try {
          const response = await fetch('/api/admin/stats');
          if (response.ok) {
            const data = await response.json();
            setAdminStats(data);
          }
        } catch (error) {
          console.error('Error al cargar estadísticas:', error);
        }
      } else if (user.rol === 'COORDINADOR') {
        try {
          const response = await fetch('/api/coordinador/stats');
          if (response.ok) {
            const data = await response.json();
            setCoordinadorStats(data);
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
    if (user.rol === 'SUPER_ADMIN' && adminStats) {
      return [
        {
          title: 'Total Usuarios',
          value: adminStats.totalUsuarios,
          description: 'En el sistema',
          icon: Users,
        },
        {
          title: 'Usuarios Activos',
          value: adminStats.usuariosActivos,
          description: 'Con acceso al sistema',
          icon: Users,
        },
        {
          title: 'Sedes Activas',
          value: adminStats.sedesActivas,
          description: 'De la institución',
          icon: Building,
        },
        {
          title: 'Carreras Activas',
          value: adminStats.carrerasActivas,
          description: 'Configuradas',
          icon: BookOpen,
        },
        {
          title: 'Prácticas Este Mes',
          value: adminStats.totalPracticasEsteMes,
          description: 'Iniciadas en el mes actual',
          icon: TrendingUp,
        },
      ];
    }
    
    if (user.rol === 'COORDINADOR' && coordinadorStats) {
      return [
        {
          title: 'Total Alumnos',
          value: coordinadorStats.totalAlumnos,
          description: 'Registrados en el sistema',
          icon: GraduationCap,
        },
        {
          title: 'Alumnos en Práctica',
          value: coordinadorStats.alumnosConPracticaActiva,
          description: 'Con práctica activa',
          icon: Users,
        },
        {
          title: 'Empleadores Activos',
          value: coordinadorStats.empleadoresActivos,
          description: 'Disponibles para prácticas',
          icon: Building,
        },
        {
          title: 'Prácticas Este Mes',
          value: coordinadorStats.practicasEsteMes,
          description: 'Iniciadas en el mes actual',
          icon: TrendingUp,
        },
        {
          title: 'Documentos Subidos',
          value: coordinadorStats.documentosSubidos,
          description: 'Materiales de apoyo',
          icon: FileCheck,
        },
        {
          title: 'Prácticas Pendientes',
          value: coordinadorStats.practicasPendientesRevision,
          description: 'Requieren revisión',
          icon: AlertCircle,
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
      <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">
          ¡Bienvenido, {user.nombre} {user.apellido}!
        </h1>
        <p className="text-white/90">
          Sistema de Gestión de Prácticas Profesionales
        </p>
        <Badge variant="secondary" className="mt-3 bg-white/20 text-white border-white/30">
          {getRoleDisplayName(user.rol)}
        </Badge>
      </div>

      {/* Stats Overview - Solo para Super Admin y Coordinador */}
      {(user.rol === 'SUPER_ADMIN' || user.rol === 'COORDINADOR') && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              {[...Array(6)].map((_, index) => (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
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
      {user.rol !== 'SUPER_ADMIN' && user.rol !== 'COORDINADOR' && (
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
