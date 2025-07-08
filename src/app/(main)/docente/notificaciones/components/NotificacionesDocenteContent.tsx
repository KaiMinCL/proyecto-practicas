'use client';

import { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Bell, CheckCircle, BookOpen } from 'lucide-react';
import { 
  obtenerNotificacionesEmailDocente, 
  obtenerEstadisticasNotificacionesDocente,
  type NotificacionEmailDocente,
  type EstadisticasNotificacionesDocente
} from '../actions';
import { EstadisticasNotificacionesDocenteCards } from './EstadisticasNotificacionesDocente';
import { TablaNotificacionesDocente } from './TablaNotificacionesDocente';

export function NotificacionesDocenteContent() {
  const [notificaciones, setNotificaciones] = useState<NotificacionEmailDocente[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasNotificacionesDocente>({
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
          obtenerNotificacionesEmailDocente(1, 20),
          obtenerEstadisticasNotificacionesDocente()
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
      const datos = await obtenerNotificacionesEmailDocente(nextPage, 20);
      
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
      <EstadisticasNotificacionesDocenteCards estadisticas={estadisticas} />

      {/* Tabla de notificaciones */}
      <TablaNotificacionesDocente 
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
            Información sobre Notificaciones de Acta 1
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              Notificación Automática
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Recibes una notificación por correo electrónico cada vez que un estudiante asignado completa el Acta 1. 
              La notificación incluye el nombre del estudiante y un enlace directo para revisar la práctica.
            </p>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Acción Requerida
            </h4>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Una vez que recibas la notificación, debes revisar el Acta 1 del estudiante y proceder con la aceptación 
              o solicitar correcciones según corresponda. Es importante responder en tiempo oportuno.
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2 flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              Acceso Directo
            </h4>
            <p className="text-sm text-green-800 dark:text-green-200">
              Cada notificación incluye un enlace directo que te lleva exactamente a la práctica del estudiante, 
              permitiendo un acceso rápido para la revisión del Acta 1 completado.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
