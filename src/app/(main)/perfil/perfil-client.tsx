'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase,
  Edit,
  Shield,
  Building
} from 'lucide-react';
import type { UserJwtPayload } from '@/lib/auth-utils';

interface PerfilClientProps {
  user: UserJwtPayload;
}

export function PerfilClient({ user }: PerfilClientProps) {
  const getRoleColor = (role: string) => {
    const colors = {
      'SUPER_ADMIN': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'DIRECTOR_CARRERA': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'COORDINADOR': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'DOCENTE': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'ALUMNO': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'EMPLEADOR': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    };
    return colors[role as keyof typeof colors] || colors['ALUMNO'];
  };

  const formatRole = (role: string) => {
    const roles = {
      'SUPER_ADMIN': 'Super Administrador',
      'DIRECTOR_CARRERA': 'Director de Carrera',
      'COORDINADOR': 'Coordinador',
      'DOCENTE': 'Docente',
      'ALUMNO': 'Alumno',
      'EMPLEADOR': 'Empleador',
    };
    return roles[role as keyof typeof roles] || role;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {user.nombre} {user.apellido}
              </h1>
              <p className="text-blue-100 dark:text-blue-200">
                Mi Perfil de Usuario
              </p>
            </div>
          </div>
          <Badge className={getRoleColor(user.rol)}>
            <Shield className="w-3 h-3 mr-1" />
            {formatRole(user.rol)}
          </Badge>
        </div>
      </div>

      {/* Profile Information */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Información Personal</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre completo</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user.nombre} {user.apellido}
                </span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">RUT</span>
                </div>
                <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                  {user.rut}
                </span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <Briefcase className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Rol</span>
                </div>
                <Badge className={getRoleColor(user.rol)} variant="secondary">
                  {formatRole(user.rol)}
                </Badge>
              </div>

              {user.email && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user.email}
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5" />
              <span>Configuración de Cuenta</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Editar Información Personal
              </Button>
              
              <Button className="w-full justify-start" variant="outline">
                <Shield className="w-4 h-4 mr-2" />
                Cambiar Contraseña
              </Button>
              
              <Button className="w-full justify-start" variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Configurar Notificaciones
              </Button>
              
              <Separator />
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    Información de Seguridad
                  </h3>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                  Tu cuenta está protegida. Si necesitas hacer cambios importantes, contacta al administrador.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Información del Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <span className="font-medium text-gray-600 dark:text-gray-400">Tipo de Usuario</span>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatRole(user.rol)}
              </p>
            </div>
            
            <div className="space-y-1">
              <span className="font-medium text-gray-600 dark:text-gray-400">Estado de Cuenta</span>
              <p className="font-semibold text-green-600 dark:text-green-400">
                Activa
              </p>
            </div>
            
            <div className="space-y-1">
              <span className="font-medium text-gray-600 dark:text-gray-400">Última Sesión</span>
              <p className="font-semibold text-gray-900 dark:text-white">
                Ahora
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline">
          Volver al Dashboard
        </Button>
        <Button>
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
