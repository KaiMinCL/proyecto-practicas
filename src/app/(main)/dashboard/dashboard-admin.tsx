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
import { ConfiguracionEvaluacionDialog, RepositorioInformesClient } from '@/components/custom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReporteVolumenPracticasClient } from '@/app/(main)/admin/reportes/reporte-volumen-practicas-client';
import { ReporteEstadoFinalizacionClient } from '@/app/(main)/admin/reportes/reporte-estado-finalizacion-client';

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

interface ConfiguracionEvaluacionCallback {
  pesoEvaluacionEmpleador: number;
  pesoEvaluacionInforme: number;
  notaMinimaAprobacion: number;
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

        {/* Configuración de Evaluaciones - Popup Inline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuración de Evaluaciones
            </CardTitle>
            <CardDescription>
              Ponderaciones actuales para el cálculo de notas finales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{configuracion.porcentajeEmpleador}%</div>
                  <div className="text-sm text-muted-foreground">Evaluación Empleador</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{configuracion.porcentajeInforme}%</div>
                  <div className="text-sm text-muted-foreground">Evaluación Informe</div>
                </div>
              </div>
              
              <ConfiguracionEvaluacionDialog
                onConfiguracionChange={(newConfig: ConfiguracionEvaluacionCallback) => {
                  setConfiguracion({
                    porcentajeEmpleador: newConfig.pesoEvaluacionEmpleador,
                    porcentajeInforme: newConfig.pesoEvaluacionInforme
                  });
                }}
              >
                <Button size="sm" variant="outline" className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  Modificar Ponderaciones
                </Button>
              </ConfiguracionEvaluacionDialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reportes y Análisis Integrados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Reportes y Análisis del Sistema
          </CardTitle>
          <CardDescription>
            Análisis completo del rendimiento y estadísticas del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="volumen" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="volumen" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Volumen de Prácticas</span>
              </TabsTrigger>
              <TabsTrigger value="estado" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Estado de Finalización</span>
              </TabsTrigger>
              <TabsTrigger value="repositorio" className="flex items-center space-x-2">
                <Archive className="h-4 w-4" />
                <span>Repositorio</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="volumen" className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Análisis de Volumen de Prácticas</h3>
                  <p className="text-sm text-muted-foreground">
                    Análisis del volumen de prácticas por periodo, sede y carrera
                  </p>
                </div>
                <ReporteVolumenPracticasClient />
              </div>
            </TabsContent>

            <TabsContent value="estado" className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Estado de Finalización de Prácticas</h3>
                  <p className="text-sm text-muted-foreground">
                    Análisis del estado de finalización para evaluar resultados
                  </p>
                </div>
                <ReporteEstadoFinalizacionClient />
              </div>
            </TabsContent>

            <TabsContent value="repositorio" className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Repositorio de Informes</h3>
                  <p className="text-sm text-muted-foreground">
                    Accede y gestiona los informes archivados del sistema
                  </p>
                </div>
                <RepositorioInformesClient rol="SUPER_ADMIN" />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
