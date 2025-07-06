
import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Users, 
  Building2, 
  GraduationCap, 
  Settings, 
  BarChart3,
  UserPlus,
  Plus,
  Sliders
} from 'lucide-react';

export default async function AdminDashboard() {
  const userPayload = await getUserSession();

  if (!userPayload) {
    redirect('/login');
  }

  if (userPayload.rol !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  const adminActions = [
    {
      title: 'Crear Usuario',
      description: 'Crear nuevas cuentas para usuarios del sistema',
      href: '/admin/usuarios',
      icon: UserPlus,
      color: 'bg-blue-500',
      highlight: true,
    },
    {
      title: 'Gestión de Usuarios',
      description: 'Ver, editar y desactivar usuarios existentes',
      href: '/admin/usuarios',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Gestión de Sedes',
      description: 'Administrar sedes de la institución',
      href: '/admin/sedes',
      icon: Building2,
      color: 'bg-purple-500',
    },
    {
      title: 'Gestión de Carreras',
      description: 'Configurar carreras y sus horas de práctica',
      href: '/admin/carreras',
      icon: GraduationCap,
      color: 'bg-orange-500',
    },
    {
      title: 'Configuraciones',
      description: 'Configurar ponderaciones de evaluaciones',
      href: '/admin/configuraciones/evaluaciones',
      icon: Sliders,
      color: 'bg-indigo-500',
    },
    {
      title: 'Reportes',
      description: 'Ver estadísticas y reportes del sistema',
      href: '/admin/reportes',
      icon: BarChart3,
      color: 'bg-teal-500',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Panel de Administración
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Bienvenido, Super Administrador. Gestiona todos los aspectos del sistema desde aquí.
        </p>
        <Badge variant="secondary" className="mt-2">
          <Settings className="w-4 h-4 mr-1" />
          Super Administrador
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card 
              key={action.href} 
              className={`transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                action.highlight ? 'ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  {action.highlight && (
                    <Badge variant="default" className="bg-blue-500">
                      Destacado
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{action.title}</CardTitle>
                <CardDescription className="text-sm">
                  {action.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={action.href}>
                    <Plus className="w-4 h-4 mr-2" />
                    Acceder
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Acciones Rápidas del Super Administrador
            </CardTitle>
            <CardDescription>
              Funcionalidades principales disponibles para tu rol
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-700 dark:text-green-300">✓ Gestión de Usuarios</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Crear cuentas para nuevos usuarios</li>
                  <li>• Validar usuarios duplicados (RUT/Email)</li>
                  <li>• Editar datos de usuarios existentes</li>
                  <li>• Activar/Desactivar cuentas de usuario</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-green-700 dark:text-green-300">✓ Configuración del Sistema</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Gestionar sedes de la institución</li>
                  <li>• Configurar carreras y sus asociaciones</li>
                  <li>• Definir horas requeridas por tipo de práctica</li>
                  <li>• Configurar ponderaciones de evaluaciones</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}