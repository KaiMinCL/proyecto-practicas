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
  Clock,
  Building,
  UserPlus,
  MapPin,
  Bell,
  FileCheck,
  Key
} from 'lucide-react';

import type { UserJwtPayload } from '@/lib/auth-utils';
import { RepositorioInformesClient } from '@/components/custom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DashboardCoordinadorProps {
  user: UserJwtPayload;
}

interface Stats {
  usuarios: {
    total: number;
    activos: number;
    inactivos: number;
  };
  alumnos: {
    total: number;
    enPractica: number;
    pendientes: number;
  };
  empleadores: {
    total: number;
    activos: number;
  };
  practicas: {
    total: number;
    enCurso: number;
    pendientes: number;
    finalizadas: number;
  };
  documentos: {
    total: number;
    pendientes: number;
  };
  centros: {
    total: number;
    activos: number;
  };
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  count?: number;
}

export function DashboardCoordinador({ user }: DashboardCoordinadorProps) {
  const [stats, setStats] = useState<Stats>({
    usuarios: { total: 0, activos: 0, inactivos: 0 },
    alumnos: { total: 0, enPractica: 0, pendientes: 0 },
    empleadores: { total: 0, activos: 0 },
    practicas: { total: 0, enCurso: 0, pendientes: 0, finalizadas: 0 },
    documentos: { total: 0, pendientes: 0 },
    centros: { total: 0, activos: 0 }
  });
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch stats desde el endpoint de coordinador
        const statsResponse = await fetch('/api/coordinador/stats');
        const statsData = await statsResponse.json();
        
        if (statsResponse.ok) {
          // Adaptar los datos del coordinador al formato esperado
          setStats({
            usuarios: {
              total: statsData.totalAlumnos + statsData.totalEmpleadores,
              activos: statsData.alumnosConPracticaActiva + statsData.empleadoresActivos,
              inactivos: (statsData.totalAlumnos + statsData.totalEmpleadores) - (statsData.alumnosConPracticaActiva + statsData.empleadoresActivos)
            },
            alumnos: {
              total: statsData.totalAlumnos,
              enPractica: statsData.alumnosConPracticaActiva,
              pendientes: statsData.practicasPendientesRevision
            },
            empleadores: {
              total: statsData.totalEmpleadores,
              activos: statsData.empleadoresActivos
            },
            practicas: {
              total: statsData.practicasEsteMes,
              enCurso: statsData.alumnosConPracticaActiva,
              pendientes: statsData.practicasPendientesRevision,
              finalizadas: 0 // Se podría agregar al endpoint
            },
            documentos: {
              total: statsData.documentosSubidos,
              pendientes: statsData.practicasPendientesRevision
            },
            centros: {
              total: statsData.totalCentros,
              activos: statsData.centrosActivos
            }
          });
        }
        
        // Crear alertas básicas para coordinador
        const alertsData: Alert[] = [];
        
        if (statsData.practicasPendientesRevision > 0) {
          alertsData.push({
            id: '1',
            type: 'warning',
            title: 'Prácticas pendientes de revisión',
            description: `Tienes ${statsData.practicasPendientesRevision} prácticas que requieren revisión`,
            count: statsData.practicasPendientesRevision
          });
        }
        
        if (statsData.totalAlumnos > 0 && statsData.alumnosConPracticaActiva === 0) {
          alertsData.push({
            id: '2',
            type: 'info',
            title: 'Sin alumnos en práctica',
            description: 'No hay alumnos con prácticas activas en este momento',
          });
        }
        
        setAlerts(alertsData);
        
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
          Coordinador
        </Badge>
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
                  <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                  Alertas del Sistema
                </CardTitle>
                <CardDescription>
                  Situaciones que requieren atención inmediata
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Link href="/coordinador/notificaciones">
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
      {/* Eliminado: Cards simples de Estudiantes, Empleadores, Prácticas en Curso y Documentos */}

      {/* Segunda fila de cards - Gestión específica del coordinador */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gestión de Estudiantes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Gestión de Estudiantes
                </CardTitle>
                <CardDescription>
                  Administra estudiantes y sus prácticas
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/coordinador/alumnos">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Todos
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total estudiantes</span>
                <span className="text-sm font-semibold">{stats.alumnos.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">En práctica</span>
                <span className="text-sm font-semibold">{stats.alumnos.enPractica}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm" variant="default" className="flex-1">
                  <Link href="/coordinador/alumnos?action=create">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Nuevo Estudiante
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gestión de Empleadores */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Gestión de Empleadores
                </CardTitle>
                <CardDescription>
                  Centros de práctica y empleadores
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/coordinador/empleadores">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Todos
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total empleadores</span>
                <span className="text-sm font-semibold">{stats.empleadores.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Activos</span>
                <span className="text-sm font-semibold">{stats.empleadores.activos}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm" variant="default" className="flex-1">
                  <Link href="/coordinador/empleadores?action=create">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Empleador
                  </Link>
                </Button>
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
                  Iniciar y supervisar prácticas
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/coordinador/practicas">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Todas
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
                <span className="text-sm text-muted-foreground">Pendientes revisión</span>
                <span className="text-sm font-semibold">{stats.practicas.pendientes}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm" variant="default" className="flex-1">
                  <Link href="/coordinador/practicas/iniciar">
                    <Plus className="w-4 h-4 mr-2" />
                    Iniciar Práctica
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gestión de Centros */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Gestión de Centros
                </CardTitle>
                <CardDescription>
                  Gestiona centros de práctica y convenios
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/coordinador/centros">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Todos
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total centros</span>
                <span className="text-sm font-semibold">{stats.centros.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Activos</span>
                <span className="text-sm font-semibold">{stats.centros.activos}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm" variant="default" className="flex-1">
                  <Link href="/coordinador/centros?action=create">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Centro
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                Administra usuarios y consulta claves iniciales de forma segura.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/coordinador/usuarios">
                <Eye className="w-4 h-4 mr-2" />
                Ver Todos
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Usuarios totales</span>
              <span className="text-sm font-semibold">{stats.usuarios.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Activos</span>
              <span className="text-sm font-semibold">{stats.usuarios.activos}</span>
            </div>
            <div className="flex gap-2 pt-2">
              <Button asChild size="sm" variant="default" className="flex-1">
                <Link href="/coordinador/usuarios?action=create">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Usuario
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="flex-1">
                <Link href="/coordinador/usuarios?action=clave">
                  <Key className="w-4 h-4 mr-2" />
                  Revisar Clave
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Herramientas y Repositorio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Herramientas y Repositorio
          </CardTitle>
          <CardDescription>
            Acceso a documentos, repositorio de informes y herramientas de gestión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="repositorio" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="repositorio" className="flex items-center space-x-2">
                <Archive className="h-4 w-4" />
                <span>Repositorio</span>
              </TabsTrigger>
              <TabsTrigger value="documentos" className="flex items-center space-x-2">
                <FileCheck className="h-4 w-4" />
                <span>Documentos</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="repositorio" className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Repositorio de Informes</h3>
                  <p className="text-sm text-muted-foreground">
                    Accede a informes históricos y documentos de prácticas
                  </p>
                </div>
                <RepositorioInformesClient rol="COORDINADOR" />
              </div>
            </TabsContent>

            <TabsContent value="documentos" className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Gestión de Documentos</h3>
                  <p className="text-sm text-muted-foreground">
                    Administra documentos y materiales de apoyo
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{stats.documentos.total}</div>
                    <div className="text-sm text-muted-foreground">Documentos subidos</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{stats.documentos.pendientes}</div>
                    <div className="text-sm text-muted-foreground">Pendientes revisión</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button asChild size="sm" variant="default" className="flex-1">
                    <Link href="/coordinador/documentos">
                      <FileCheck className="w-4 h-4 mr-2" />
                      Gestionar Documentos
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href="/coordinador/documentos?action=upload">
                      <Plus className="w-4 h-4 mr-2" />
                      Subir Documento
                    </Link>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
