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
        // Fetch stats filtrados por carrera
        const statsResponse = await fetch('/api/director/dashboard/stats');
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
        // Fetch alerts filtrados por carrera
        const alertsResponse = await fetch('/api/director/dashboard/alerts');
        const alertsData = await alertsResponse.json();
        if (alertsData.success) {
          setAlerts(alertsData.data);
        }
        // Fetch configuración (puede seguir usando el endpoint global)
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

      {/* Segunda fila de cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gestión de Alumnos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Gestión de Alumnos
                </CardTitle>
                <CardDescription>
                  Administra los alumnos de tu carrera
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/director/alumnos">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Todos
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total alumnos</span>
                <span className="text-sm font-semibold">{stats.usuarios.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Activos</span>
                <span className="text-sm font-semibold">{stats.usuarios.activos}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gestión de Prácticas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Gestión de Prácticas
                </CardTitle>
                <CardDescription>
                  Supervisa y administra las prácticas de tu carrera
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/director/practicas">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Todos
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">En curso</span>
                <span className="text-sm font-semibold">{stats.practicas.enCurso}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pendientes de revisión</span>
                <span className="text-sm font-semibold">{stats.practicas.pendientes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Finalizadas</span>
                <span className="text-sm font-semibold">{stats.practicas.finalizadas}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gestión de Documentos y Actas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="w-5 h-5" />
                  Documentos y Actas
                </CardTitle>
                <CardDescription>
                  Gestiona documentos, actas y reportes de tu carrera
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/director/documentos">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Todos
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Repositorio de informes</span>
                <span className="text-sm font-semibold">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Actas gestionadas</span>
                <span className="text-sm font-semibold">-</span>
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="volumen" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Volumen de Prácticas</span>
              </TabsTrigger>
              <TabsTrigger value="estado" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Estado de Finalización</span>
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
