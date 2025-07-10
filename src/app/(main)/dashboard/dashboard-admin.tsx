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
  Briefcase,
  History
} from 'lucide-react';

import type { UserJwtPayload } from '@/lib/auth-utils';
import { ConfiguracionEvaluacionDialog, RepositorioInformesClient } from '@/components/custom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReporteVolumenPracticasClient } from '@/app/(main)/admin/reportes/reporte-volumen-practicas-client';
import { ReporteEstadoFinalizacionClient } from '@/app/(main)/admin/reportes/reporte-estado-finalizacion-client';
import { CarreraFormDialog } from '../admin/carreras/carrera-form-dialog';
import { SedeFormDialog } from '../admin/sedes/sede-form-dialog';
import { CreateUserDialog } from '../admin/usuarios/create-user-dialog';
import { CreateCentroDialog } from '../../../components/custom/create-centro-dialog';


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
  centros: {
    total: number;
    activos: number;
  };
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
    practicas: { total: 0, enCurso: 0, pendientes: 0, finalizadas: 0 },
    centros: { total: 0, activos: 0 },
  });
  
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
        
        const [statsResponse, configResponse] = await Promise.all([
          fetch('/api/admin/dashboard/stats'),
          fetch('/api/admin/configuracion')
        ]);

        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
        
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

       {/* Reportes y Análisis Integrados */}
      <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Reportes y Análisis del Sistema
                    </CardTitle>
                    <CardDescription>
                        Análisis gráfico del rendimiento y estadísticas del sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="volumen" className="space-y-6">
                        {/* Se ajusta a 2 columnas */}
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
                <CreateUserDialog />
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
                <SedeFormDialog>
                  <Button size="sm" variant="default" className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Sede
                  </Button>
                </SedeFormDialog>
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
                <CarreraFormDialog>
                    <Button size="sm" variant="default" className="flex-1">
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Carrera
                    </Button>
                </CarreraFormDialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gestión de Centros de Práctica */}
         <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Centros de Práctica
                </CardTitle>
                <CardDescription>
                  Administra las empresas y organizaciones.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/centros-practica">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Todos
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Centros activos</span>
                <span className="text-sm font-semibold">{stats.centros.activos}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total centros</span>
                <span className="text-sm font-semibold">{stats.centros.total}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <CreateCentroDialog onSuccess={() => {
                    // Idealmente, aquí se refrescarían los datos del dashboard.
                    // Por ahora, solo abre el diálogo.
                }}>
                    <Button size="sm" variant="default" className="flex-1">
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Centro
                    </Button>
                </CreateCentroDialog>
              </div>
            </div>
          </CardContent>
        </Card>

                 {/* Repositorio de Informes */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Archive className="w-5 h-5" />
                                    Repositorio de Informes
                                </CardTitle>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link href="/admin/repositorio-informes">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Accede a todos los informes históricos de prácticas finalizadas y evaluadas en el sistema.</p>
                    </CardContent>
                </Card>

        {/* Logs de Auditoría */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Logs de Auditoría
                </CardTitle>
              </div>
               <Button asChild variant="outline" size="sm">
                <Link href="/admin/auditoria">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">Consulta el registro de acciones y eventos importantes dentro del sistema para seguimiento.</p>
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
    </div>
  );
}