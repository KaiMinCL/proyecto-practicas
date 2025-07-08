import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Mail, User, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { NotificacionEmail } from '../actions';

interface TablaNotificacionesProps {
  notificaciones: NotificacionEmail[];
  hasMore: boolean;
  onLoadMore: () => void;
  loading?: boolean;
}

export function TablaNotificaciones({ 
  notificaciones, 
  hasMore, 
  onLoadMore, 
  loading = false 
}: TablaNotificacionesProps) {
  const getStatusBadge = (exitoso: boolean) => {
    if (exitoso) {
      return (
        <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Enviado
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
    switch (tipo.toLowerCase()) {
      case 'acta_1':
      case 'completar_acta_1':
        return <Mail className="w-4 h-4 text-blue-600" />;
      case 'credenciales':
        return <User className="w-4 h-4 text-purple-600" />;
      case 'recordatorio':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <Mail className="w-4 h-4 text-gray-600" />;
    }
  };

  if (notificaciones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Notificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No hay notificaciones
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Aún no se han enviado notificaciones por correo electrónico.
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
          Registro completo de notificaciones enviadas por correo electrónico
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
                  Destinatario
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {notificaciones.map((notificacion) => (
                <tr key={notificacion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTipoIcon(notificacion.tipo)}
                      <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {notificacion.tipo.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {notificacion.destinatario.nombre}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {notificacion.destinatario.email}
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
