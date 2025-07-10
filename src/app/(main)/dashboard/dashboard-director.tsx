'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
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

interface DashboardDirectorProps {
  user: UserJwtPayload;
}

interface Stats {
  usuarios: {
    total: number;
    activos: number;
    inactivos: number;
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

export function DashboardDirector({ user }: DashboardDirectorProps) {
  const [stats, setStats] = useState<Stats>({
    usuarios: { total: 0, activos: 0, inactivos: 0 },
    carreras: { total: 0, activas: 0 },
    practicas: { total: 0, enCurso: 0, pendientes: 0, finalizadas: 0 }
  });
  
  const [configuracion, setConfiguracion] = useState<ConfiguracionEvaluacion>({
    porcentajeEmpleador: 60,
    porcentajeInforme: 40
  });
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
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

        // Fetch configuración
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">
          ¡Bienvenido, {user.nombre} {user.apellido}!
        </h1>
        <p className="text-white/90">
          Sistema de Gestión de Prácticas Profesionales
        </p>
        <Badge variant="secondary" className="mt-3 bg-white/20 text-white border-white/30">
          Director de Carrera
        </Badge>
      </div>

      {/* Alertas y Notificaciones */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                  Alertas del Sistema
                </CardTitle>
                <CardDescription>
                  Situaciones que requieren atención
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Link href="/admin/alertas">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Todas
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-card/50 hover:bg-card/70 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    alert.type === 'error' ? 'bg-destructive' :
                    alert.type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground">{alert.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.description}</p>
                  </div>
                  {alert.count && (
                    <Badge variant="secondary" className="text-xs bg-muted/50 text-muted-foreground border-0">
                      {alert.count}
                    </Badge>
                  )}
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
            <CardTitle className="text-sm font-medium">Prácticas Activas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.practicas.enCurso}</div>
            <p className="text-xs text-muted-foreground">
              {stats.practicas.pendientes} pendientes de revisión
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carreras</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.carreras.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.carreras.activas} activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usuarios.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.usuarios.activos} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prácticas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.practicas.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.practicas.finalizadas} finalizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Segunda fila de cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        {/* Acceso rápido a Carreras */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Gestión de Carreras
                </CardTitle>
                <CardDescription>
                  Administra las carreras de tu dirección
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
                    Nueva Carrera
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acceso al Repositorio */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="w-5 h-5" />
                  Repositorio de Informes
                </CardTitle>
                <CardDescription>
                  Consulta informes históricos
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/repositorio-informes">
                  <Eye className="w-4 h-4 mr-2" />
                  Abrir
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Informes disponibles</span>
                <span className="text-sm font-semibold">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Último acceso</span>
                <span className="text-sm font-semibold">-</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm" variant="default" className="flex-1">
                  <Link href="/admin/repositorio-informes">
                    <FileText className="w-4 h-4 mr-2" />
                    Buscar Informes
                  </Link>
                </Button>
              </div>
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
                <RepositorioInformesClient rol="DIRECTOR_CARRERA" />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
