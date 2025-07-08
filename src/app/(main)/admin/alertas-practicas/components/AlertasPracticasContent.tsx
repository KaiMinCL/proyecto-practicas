'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Mail, 
  RefreshCw, 
  TrendingUp,
  Users,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface EstadisticasAlertas {
  total: number;
  criticas: number;
  bajas: number;
  normales: number;
  porCarrera: Record<string, number>;
  promedioRetrasoEnDias: number;
}

interface ResultadoEjecucion {
  success: boolean;
  alertasEnviadas: number;
  errores: string[];
  message: string;
}

export function AlertasPracticasContent() {
  const [estadisticas, setEstadisticas] = useState<EstadisticasAlertas | null>(null);
  const [loading, setLoading] = useState(true);
  const [ejecutandoAlertas, setEjecutandoAlertas] = useState(false);
  const [ultimaEjecucion, setUltimaEjecucion] = useState<ResultadoEjecucion | null>(null);

  // Cargar estadísticas iniciales
  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/alertas-practicas');
      const data = await response.json();

      if (data.success) {
        setEstadisticas(data.estadisticas);
      } else {
        console.error('Error al cargar estadísticas:', data.error);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const ejecutarAlertas = async () => {
    try {
      setEjecutandoAlertas(true);
      const response = await fetch('/api/admin/alertas-practicas', {
        method: 'POST',
      });
      const resultado = await response.json();

      setUltimaEjecucion(resultado);
      
      // Recargar estadísticas después de ejecutar alertas
      setTimeout(cargarEstadisticas, 1000);
    } catch (error) {
      console.error('Error al ejecutar alertas:', error);
      setUltimaEjecucion({
        success: false,
        alertasEnviadas: 0,
        errores: ['Error de conexión al ejecutar alertas'],
        message: 'Error de conexión'
      });
    } finally {
      setEjecutandoAlertas(false);
    }
  };

  const getCriticidadColor = (tipo: 'criticas' | 'bajas' | 'normales') => {
    switch (tipo) {
      case 'criticas':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'bajas':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normales':
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  if (loading) {
    return <div>Cargando estadísticas...</div>;
  }

  return (
    <>
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {estadisticas?.promedioRetrasoEnDias ? 
                `Promedio: ${estadisticas.promedioRetrasoEnDias} días retraso` : 
                'Sin retrasos registrados'
              }
            </p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${getCriticidadColor('criticas')}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{estadisticas?.criticas || 0}</div>
            <p className="text-xs text-red-600">
              +15 días de retraso
            </p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${getCriticidadColor('bajas')}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bajas</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{estadisticas?.bajas || 0}</div>
            <p className="text-xs text-orange-600">
              7-14 días de retraso
            </p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${getCriticidadColor('normales')}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Normales</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estadisticas?.normales || 0}</div>
            <p className="text-xs text-green-600">
              5-6 días de retraso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Panel de control de alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2 text-blue-600" />
            Control de Alertas Automáticas
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ejecuta manualmente el proceso de alertas o programa ejecuciones automáticas
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={ejecutarAlertas}
              disabled={ejecutandoAlertas}
              className="flex items-center gap-2"
            >
              {ejecutandoAlertas ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Ejecutando...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Ejecutar Alertas Ahora
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={cargarEstadisticas}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

          {ultimaEjecucion && (
            <div className={`p-4 rounded-lg border ${
              ultimaEjecucion.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2 font-medium">
                {ultimaEjecucion.success ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {ultimaEjecucion.message}
              </div>
              
              {ultimaEjecucion.alertasEnviadas > 0 && (
                <p className="text-sm mt-1">
                  Se enviaron {ultimaEjecucion.alertasEnviadas} alerta{ultimaEjecucion.alertasEnviadas > 1 ? 's' : ''} 
                  por correo electrónico.
                </p>
              )}
              
              {ultimaEjecucion.errores.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Errores encontrados:</p>
                  <ul className="text-xs mt-1 space-y-1">
                    {ultimaEjecucion.errores.map((error, index) => (
                      <li key={index} className="ml-4">• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribución por carrera */}
      {estadisticas && Object.keys(estadisticas.porCarrera).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
              Distribución por Carrera
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(estadisticas.porCarrera).map(([carrera, cantidad]) => (
                <div key={carrera} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {carrera}
                  </span>
                  <Badge variant="outline" className="ml-2">
                    {cantidad}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información y configuración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
            Información sobre Alertas Automáticas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              ¿Cómo funcionan las alertas?
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              El sistema identifica automáticamente prácticas que han superado su fecha de término 
              y aún no han sido cerradas administrativamente. Se envían alertas por correo electrónico 
              a coordinadores y directores de carrera según la sede correspondiente.
            </p>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
              Criterios de Criticidad
            </h4>
            <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <p><strong>CRÍTICO:</strong> Más de 15 días de retraso (requiere atención inmediata)</p>
              <p><strong>BAJO:</strong> Entre 7 y 14 días de retraso</p>
              <p><strong>NORMAL:</strong> Entre 5 y 6 días de retraso (período de gracia superado)</p>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
              Acciones Recomendadas
            </h4>
            <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <p>• Revisar prácticas críticas de forma prioritaria</p>
              <p>• Contactar docentes tutores para agilizar evaluaciones pendientes</p>
              <p>• Verificar documentación completa antes del cierre</p>
              <p>• Coordinar con empleadores para evaluaciones faltantes</p>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Link 
              href="/coordinador/practicas/gestion" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Ir a Gestión de Prácticas
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
