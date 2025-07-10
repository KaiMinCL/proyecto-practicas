'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Building, 
  GraduationCap, 
  FileText, 
  Settings, 
  BarChart3, 
  AlertTriangle,
  Eye,
  Plus,
  Edit,
  Archive,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

import type { UserJwtPayload } from '@/lib/auth-utils';

interface DashboardAdminProps {
  user: UserJwtPayload;
}

interface Stats {
  usuarios: {
    total: number;
    activos: number;
    inactivos: number;
  };
  sedes: {
    total: number;
    activas: number;
  };
  carreras: {
    total: number;
    activas: number;
  };
  practicas: {
    total: number;
    enCurso: number;
    pendientes: number;
    finalizadas: number;
  };
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  count?: number;
}

interface ConfiguracionEvaluacion {
  porcentajeEmpleador: number;
  porcentajeInforme: number;
}

export function DashboardAdmin({ user }: DashboardAdminProps) {
  const [stats, setStats] = useState<Stats>({
    usuarios: { total: 0, activos: 0, inactivos: 0 },
    sedes: { total: 0, activas: 0 },
    carreras: { total: 0, activas: 0 },
    practicas: { total: 0, enCurso: 0, pendientes: 0, finalizadas: 0 }
  });
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [configuracion, setConfiguracion] = useState<ConfiguracionEvaluacion>({
    porcentajeEmpleador: 60,
    porcentajeInforme: 40
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch stats
        const statsResponse = await fetch('/api/admin/dashboard/stats');
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
          setStats(statsData.data);
        }
        
        // Fetch alerts
        const alertsResponse = await fetch('/api/admin/dashboard/alerts');
        const alertsData = await alertsResponse.json();
        
        if (alertsData.success) {
          setAlerts(alertsData.data);
        }
        
        // Fetch configuracion
        const configResponse = await fetch('/api/admin/configuracion');
        const configData = await configResponse.json();
        
        if (configData.success) {
          setConfiguracion({
            porcentajeEmpleador: configData.data.pesoEvaluacionEmpleador,
            porcentajeInforme: configData.data.pesoEvaluacionInforme
          });
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de bienvenida */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            <p className="text-white/90 mt-1">
              Bienvenido, {user.nombre}. Gestiona el sistema de prácticas desde aquí.
            </p>
            <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-white/30">
              Super Admin
            </Badge>
          </div>
          <Settings className="h-16 w-16 text-white/30" />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Alertas y Notificaciones */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Alertas del Sistema
                </CardTitle>
                <CardDescription>
                  Situaciones que requieren atención inmediata
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/alertas">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Todas
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border ${
                  alert.type === 'error' ? 'border-red-200 bg-red-50' :
                  alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{alert.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                    </div>
                    {alert.count && (
                      <Badge variant="secondary" className="text-xs">
                        {alert.count}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usuarios.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.usuarios.activos} activos, {stats.usuarios.inactivos} inactivos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sedes</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sedes.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.sedes.activas} activas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carreras</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.carreras.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.carreras.activas} activas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prácticas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.practicas.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.practicas.enCurso} en curso, {stats.practicas.pendientes} pendientes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gestión de Entidades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gestión de Usuarios */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Gestión de Usuarios
                </CardTitle>
                <CardDescription>
                  Administra usuarios del sistema
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/usuarios">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Todos
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Usuarios activos</span>
                <span className="text-sm font-semibold">{stats.usuarios.activos}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Usuarios inactivos</span>
                <span className="text-sm font-semibold">{stats.usuarios.inactivos}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm" variant="default" className="flex-1">
                  <Link href="/admin/usuarios?action=create">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Usuario
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gestión de Sedes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Gestión de Sedes
                </CardTitle>
                <CardDescription>
                  Administra las sedes de la institución
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/sedes">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Todas
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sedes activas</span>
                <span className="text-sm font-semibold">{stats.sedes.activas}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total sedes</span>
                <span className="text-sm font-semibold">{stats.sedes.total}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm" variant="default" className="flex-1">
                  <Link href="/admin/sedes?action=create">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Sede
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gestión de Carreras */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Gestión de Carreras
                </CardTitle>
                <CardDescription>
                  Administra las carreras ofrecidas
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/carreras">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Todas
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Carreras activas</span>
                <span className="text-sm font-semibold">{stats.carreras.activas}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total carreras</span>
                <span className="text-sm font-semibold">{stats.carreras.total}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm" variant="default" className="flex-1">
                  <Link href="/admin/carreras?action=create">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Carrera
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Evaluaciones */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuración de Evaluaciones
                </CardTitle>
                <CardDescription>
                  Configura las ponderaciones de evaluación
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/configuracion">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Evaluación Empleador</span>
                <span className="text-sm font-semibold">{configuracion.porcentajeEmpleador}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Evaluación Informe</span>
                <span className="text-sm font-semibold">{configuracion.porcentajeInforme}%</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm" variant="default" className="flex-1">
                  <Link href="/admin/configuracion?section=evaluaciones">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Ponderaciones
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reportes y Análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Reportes y Análisis
                </CardTitle>
                <CardDescription>
                  Genera reportes del sistema
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/reportes">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Reportes
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prácticas este mes</span>
                <span className="text-sm font-semibold">{stats.practicas.enCurso}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prácticas finalizadas</span>
                <span className="text-sm font-semibold">{stats.practicas.finalizadas}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm" variant="default" className="flex-1">
                  <Link href="/admin/reportes?type=general">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Generar Reporte
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="w-5 h-5" />
                  Repositorio de Informes
                </CardTitle>
                <CardDescription>
                  Accede a los informes archivados
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/repositorio-informes">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Repositorio
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Informes archivados</span>
                <span className="text-sm font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Último acceso</span>
                <span className="text-sm font-semibold">-</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm" variant="default" className="flex-1">
                  <Link href="/admin/repositorio-informes?action=search">
                    <FileText className="w-4 h-4 mr-2" />
                    Buscar Informes
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
