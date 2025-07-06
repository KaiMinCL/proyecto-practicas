'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Users, 
  FileText, 
  Calendar, 
  TrendingUp, 
  BookOpen, 
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Building,
  Settings
} from 'lucide-react';
import type { UserJwtPayload } from '@/lib/auth-utils';

interface DashboardClientProps {
  user: UserJwtPayload;
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<any>;
  variant?: 'default' | 'secondary' | 'outline';
}

interface StatCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<any>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function DashboardClient({ user }: DashboardClientProps) {
  const getQuickActions = (): QuickAction[] => {
    switch (user.rol) {
      case 'SUPER_ADMIN':
        return [
          {
            title: 'Gestión de Usuarios',
            description: 'Crear, editar y desactivar usuarios',
            href: '/admin/usuarios',
            icon: Users,
          },
          {
            title: 'Gestión de Sedes',
            description: 'Administrar sedes de la institución',
            href: '/admin/sedes',
            icon: Building,
          },
          {
            title: 'Gestión de Carreras',
            description: 'Configurar carreras y horas de práctica',
            href: '/admin/carreras',
            icon: BookOpen,
          },
          {
            title: 'Configuraciones del Sistema',
            description: 'Configurar ponderaciones de evaluaciones',
            href: '/admin/configuraciones/evaluaciones',
            icon: Settings,
          },
        ];
      case 'DIRECTOR_CARRERA':
        return [
          {
            title: 'Gestión de Usuarios',
            description: 'Administrar usuarios del sistema',
            href: '/admin/usuarios',
            icon: Users,
          },
          {
            title: 'Reportes Generales',
            description: 'Ver estadísticas y reportes',
            href: '/admin/reportes',
            icon: TrendingUp,
          },
          {
            title: 'Gestión de Carreras',
            description: 'Administrar carreras de su sede',
            href: '/admin/carreras',
            icon: BookOpen,
          },
          {
            title: 'Configuraciones',
            description: 'Configurar ponderaciones de evaluaciones',
            href: '/admin/configuraciones/evaluaciones',
            icon: Settings,
          },
        ];
      
      case 'COORDINADOR':
        return [
          {
            title: 'Iniciar Práctica',
            description: 'Registrar nueva práctica para alumno',
            href: '/coordinador/practicas/iniciar',
            icon: FileText,
          },
          {
            title: 'Gestión de Alumnos',
            description: 'Ver y gestionar alumnos',
            href: '/coordinador/alumnos',
            icon: Users,
          },
          {
            title: 'Gestión de Empleadores',
            description: 'Administrar centros de práctica',
            href: '/coordinador/empleadores',
            icon: Building,
          },
        ];
      
      case 'DOCENTE':
        return [
          {
            title: 'Mis Estudiantes',
            description: 'Ver estudiantes bajo mi tutela',
            href: '/docente/estudiantes',
            icon: Users,
          },
          {
            title: 'Evaluaciones',
            description: 'Evaluar prácticas de estudiantes',
            href: '/docente/evaluaciones',
            icon: Star,
          },
          {
            title: 'Programar Visitas',
            description: 'Gestionar visitas a centros',
            href: '/docente/visitas',
            icon: Calendar,
          },
        ];
      
      case 'ALUMNO':
        return [
          {
            title: 'Mis Prácticas',
            description: 'Ver mis prácticas pendientes',
            href: '/alumno/mis-practicas',
            icon: BookOpen,
          },
          {
            title: 'Subir Informe',
            description: 'Cargar informe final de práctica',
            href: '/alumno/subir-informe',
            icon: FileText,
          },
          {
            title: 'Evaluaciones Empleador',
            description: 'Ver evaluaciones recibidas',
            href: '/alumno/evaluaciones-empleador',
            icon: Star,
          },
        ];
      
      case 'EMPLEADOR':
        return [
          {
            title: 'Mis Estudiantes',
            description: 'Ver estudiantes en práctica',
            href: '/empleador/estudiantes',
            icon: Users,
          },
          {
            title: 'Evaluaciones',
            description: 'Evaluar desempeño de estudiantes',
            href: '/empleador/evaluaciones',
            icon: Star,
          },
        ];
      
      default:
        return [];
    }
  };

  const getStatCards = (): StatCard[] => {
    // En una implementación real, estos datos vendrían de API calls
    switch (user.rol) {
      case 'SUPER_ADMIN':
        return [
          {
            title: 'Total Usuarios',
            value: 156,
            description: 'En el sistema',
            icon: Users,
            trend: { value: 8, isPositive: true },
          },
          {
            title: 'Sedes Activas',
            value: 5,
            description: 'De la institución',
            icon: Building,
          },
          {
            title: 'Carreras Configuradas',
            value: 18,
            description: 'Con horas definidas',
            icon: BookOpen,
            trend: { value: 2, isPositive: true },
          },
          {
            title: 'Prácticas Este Mes',
            value: 42,
            description: 'En todas las sedes',
            icon: TrendingUp,
            trend: { value: 15, isPositive: true },
          },
        ];
      case 'DIRECTOR_CARRERA':
        return [
          {
            title: 'Usuarios en Mi Sede',
            value: 32,
            description: 'Docentes y coordinadores',
            icon: Users,
            trend: { value: 3, isPositive: true },
          },
          {
            title: 'Carreras Supervisadas',
            value: 6,
            description: 'Bajo mi dirección',
            icon: BookOpen,
          },
          {
            title: 'Prácticas Activas',
            value: 18,
            description: 'En mi sede',
            icon: Clock,
            trend: { value: 5, isPositive: true },
          },
        ];
      case 'COORDINADOR':
        return [
          {
            title: 'Prácticas Activas',
            value: 15,
            description: 'En proceso actualmente',
            icon: Clock,
            trend: { value: 12, isPositive: true },
          },
          {
            title: 'Alumnos Registrados',
            value: 48,
            description: 'En la base de datos',
            icon: Users,
          },
          {
            title: 'Empleadores',
            value: 23,
            description: 'Centros de práctica activos',
            icon: Building,
          },
        ];
      
      case 'DOCENTE':
        return [
          {
            title: 'Estudiantes Asignados',
            value: 8,
            description: 'Bajo mi tutela',
            icon: Users,
          },
          {
            title: 'Evaluaciones Pendientes',
            value: 3,
            description: 'Por completar',
            icon: AlertCircle,
          },
          {
            title: 'Visitas Programadas',
            value: 5,
            description: 'Este mes',
            icon: Calendar,
          },
        ];
      
      case 'ALUMNO':
        return [
          {
            title: 'Prácticas',
            value: 2,
            description: 'Registradas en el sistema',
            icon: BookOpen,
          },
          {
            title: 'Estado',
            value: 'En Curso',
            description: 'Práctica actual',
            icon: CheckCircle,
          },
        ];
      
      default:
        return [
          {
            title: 'Bienvenido',
            value: user.nombre,
            description: `Rol: ${user.rol}`,
            icon: Users,
          },
        ];
    }
  };

  const quickActions = getQuickActions();
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
          {user.rol}
        </Badge>
      </div>

      {/* Stats Overview */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  {stat.trend && (
                    <div className={`flex items-center mt-2 text-xs ${
                      stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stat.trend.isPositive ? '+' : '-'}{stat.trend.value}% desde el mes pasado
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-all duration-200 hover:scale-105">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {action.description}
                  </p>
                  <Button 
                    asChild 
                    variant={action.variant || "default"} 
                    size="sm" 
                    className="w-full"
                  >
                    <Link href={action.href}>
                      Ir a {action.title}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Actividad Reciente</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Sistema actualizado</p>
                <p className="text-xs text-gray-500">Hace 2 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Sesión iniciada correctamente</p>
                <p className="text-xs text-gray-500">Ahora</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
