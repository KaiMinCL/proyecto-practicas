'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AlertaManual {
  id: number;
  asunto: string | null;
  mensaje: string;
  enviadoPor: string;
  fecha: string;
}

interface HistorialAlertasManualesProps {
  practicaId: number;
}

export function HistorialAlertasManuales({ practicaId }: HistorialAlertasManualesProps) {
  const [alertas, setAlertas] = useState<AlertaManual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarHistorial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/alertas/manual?practicaId=${practicaId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar historial');
      }

      setAlertas(data.historial || []);
    } catch (err) {
      console.error('Error al cargar historial de alertas:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [practicaId]);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Historial de Alertas Manuales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Cargando historial...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Historial de Alertas Manuales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Error al cargar el historial: {error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={cargarHistorial}
            variant="outline" 
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Historial de Alertas Manuales
        </CardTitle>
        <Button 
          onClick={cargarHistorial}
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        {alertas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No se han enviado alertas manuales para esta práctica</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alertas.map((alerta) => (
              <div
                key={alerta.id}
                className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {alerta.asunto || 'Sin asunto'}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(new Date(alerta.fecha), 'PPP p', { locale: es })}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {alerta.enviadoPor}
                  </Badge>
                </div>
                <div className="bg-white rounded border p-3 text-sm text-gray-700">
                  <p className="whitespace-pre-wrap">{alerta.mensaje}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
