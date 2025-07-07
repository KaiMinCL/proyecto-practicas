'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
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
      'SUPER_ADMIN': 'bg-destructive text-destructive-foreground',
      'DIRECTOR_CARRERA': 'bg-primary text-primary-foreground',
      'COORDINADOR': 'bg-secondary text-secondary-foreground',
      'DOCENTE': 'bg-accent text-accent-foreground',
      'ALUMNO': 'bg-orange-500 text-white', // Keeping orange for students for now for variety
      'EMPLEADOR': 'bg-blue-500 text-white', // Keeping blue for employers for now for variety
    };
    return colors[role as keyof typeof colors] || 'bg-muted text-muted-foreground';
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
      <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {user.nombre} {user.apellido}
              </h1>
              <p className="text-primary-foreground/80">
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
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Nombre completo</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {user.nombre} {user.apellido}
                </span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">RUT</span>
                </div>
                <span className="text-sm font-mono font-semibold text-foreground">
                  {user.rut}
                </span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Rol</span>
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
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Email</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
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
              
              <div className="bg-secondary/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-secondary-foreground" />
                  <h3 className="font-medium text-secondary-foreground">
                    Información de Seguridad
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
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
              <span className="font-medium text-muted-foreground">Tipo de Usuario</span>
              <p className="font-semibold text-foreground">
                {formatRole(user.rol)}
              </p>
            </div>
            
            <div className="space-y-1">
              <span className="font-medium text-muted-foreground">Estado de Cuenta</span>
              <p className="font-semibold text-accent">
                Activa
              </p>
            </div>
            
            <div className="space-y-1">
              <span className="font-medium text-muted-foreground">Última Sesión</span>
              <p className="font-semibold text-foreground">
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
