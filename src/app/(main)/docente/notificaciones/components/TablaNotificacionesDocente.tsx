import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Bell, User, Calendar, ExternalLink, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { NotificacionEmailDocente } from '../actions';

interface TablaNotificacionesDocenteProps {
  notificaciones: NotificacionEmailDocente[];
  hasMore: boolean;
  onLoadMore: () => void;
  loading?: boolean;
}

export function TablaNotificacionesDocente({ 
  notificaciones, 
  hasMore, 
  onLoadMore, 
  loading = false 
}: TablaNotificacionesDocenteProps) {
  const getStatusBadge = (exitoso: boolean) => {
    if (exitoso) {
      return (
        <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Entregada
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-red-700 bg-red-50 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      );
    }
  };

  const getTipoIcon = (tipo: string) => {
    if (tipo.includes('ACTA1')) {
      return <Bell className="w-4 h-4 text-blue-600" />;
    }
    return <Bell className="w-4 h-4 text-gray-600" />;
  };

  if (notificaciones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Notificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No hay notificaciones
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Aún no has recibido notificaciones sobre completado de Acta 1.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Notificaciones</CardTitle>
        <p className="text-sm text-muted-foreground">
          Registro de notificaciones recibidas cuando estudiantes completan el Acta 1
        </p>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estudiante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asunto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {notificaciones.map((notificacion) => (
                <tr key={notificacion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTipoIcon(notificacion.tipo)}
                      <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                        Acta 1 Completado
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {notificacion.alumno.nombre}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {notificacion.alumno.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate" title={notificacion.asunto}>
                      {notificacion.asunto}
                    </div>
                    {notificacion.errorMessage && (
                      <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={notificacion.errorMessage}>
                        Error: {notificacion.errorMessage}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(notificacion.exitoso)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-1" />
                      {format(new Date(notificacion.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {notificacion.entidadRelacionada && (
                      <Link
                        href={`/docente/practicas/${notificacion.entidadRelacionada.id}`}
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Ver Práctica
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {hasMore && (
          <div className="px-6 py-4 border-t">
            <Button 
              variant="outline" 
              onClick={onLoadMore}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Cargando...
                </>
              ) : (
                'Cargar más notificaciones'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
