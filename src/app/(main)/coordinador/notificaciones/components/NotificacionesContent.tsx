'use client';

import { useState, useEffect } from 'react';
import { EstadisticasNotificacionesCards } from './EstadisticasNotificaciones';
import { TablaNotificaciones } from './TablaNotificaciones';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { 
  obtenerNotificacionesEmail, 
  obtenerEstadisticasNotificaciones,
  type NotificacionEmail,
  type EstadisticasNotificaciones
} from '../actions';

export function NotificacionesContent() {
  const [notificaciones, setNotificaciones] = useState<NotificacionEmail[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasNotificaciones>({
    enviadasHoy: 0,
    exitosasHoy: 0,
    fallidasHoy: 0,
    totalSemana: 0,
    tasaExito: 0
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true);
        const [datosNotificaciones, datosEstadisticas] = await Promise.all([
          obtenerNotificacionesEmail(1, 20),
          obtenerEstadisticasNotificaciones()
        ]);

        setNotificaciones(datosNotificaciones.notificaciones);
        setHasMore(datosNotificaciones.hasMore);
        setEstadisticas(datosEstadisticas);
      } catch (error) {
        console.error('Error al cargar notificaciones:', error);
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, []);

  const cargarMas = async () => {
    if (loadingMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const datos = await obtenerNotificacionesEmail(nextPage, 20);
      
      setNotificaciones(prev => [...prev, ...datos.notificaciones]);
      setHasMore(datos.hasMore);
      setPage(nextPage);
    } catch (error) {
      console.error('Error al cargar más notificaciones:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <>
      {/* Estadísticas */}
      <EstadisticasNotificacionesCards estadisticas={estadisticas} />

      {/* Tabla de notificaciones */}
      <TablaNotificaciones 
        notificaciones={notificaciones}
        hasMore={hasMore}
        onLoadMore={cargarMas}
        loading={loadingMore}
      />

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="w-5 h-5 mr-2 text-blue-600" />
            Información sobre Notificaciones Automáticas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Notificación de Acta 1
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Se envía automáticamente cuando el coordinador inicia el registro de una práctica. 
              Incluye credenciales de acceso para nuevos usuarios e instrucciones para completar el Acta 1.
            </p>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
              Plazo de Entrega
            </h4>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Los alumnos tienen 5 días hábiles para completar y enviar el Acta 1 desde la fecha de inicio de la práctica.
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
              Registro de Auditoría
            </h4>
            <p className="text-sm text-green-800 dark:text-green-200">
              Todos los envíos de correo se registran automáticamente en el sistema de auditoría para trazabilidad completa.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
