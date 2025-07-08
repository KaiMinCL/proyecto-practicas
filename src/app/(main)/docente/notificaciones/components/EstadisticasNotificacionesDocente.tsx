import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Bell, TrendingUp } from 'lucide-react';
import { EstadisticasNotificacionesDocente } from '../actions';

interface EstadisticasNotificacionesDocenteProps {
  estadisticas: EstadisticasNotificacionesDocente;
}

export function EstadisticasNotificacionesDocenteCards({ estadisticas }: EstadisticasNotificacionesDocenteProps) {
  const { enviadasHoy, exitosasHoy, fallidasHoy, totalSemana, tasaExito } = estadisticas;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recibidas Hoy</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{enviadasHoy}</div>
          <p className="text-xs text-muted-foreground">
            {totalSemana > 0 ? `${Math.round((enviadasHoy / totalSemana) * 100)}% del total semanal` : 'Primera vez hoy'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entregadas</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{exitosasHoy}</div>
          <p className="text-xs text-muted-foreground">
            {enviadasHoy > 0 ? `${Math.round((exitosasHoy / enviadasHoy) * 100)}% entregadas hoy` : 'Sin notificaciones hoy'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">No Entregadas</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{fallidasHoy}</div>
          <p className="text-xs text-muted-foreground">
            {enviadasHoy > 0 ? `${Math.round((fallidasHoy / enviadasHoy) * 100)}% no entregadas hoy` : 'Sin problemas hoy'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Entrega</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{tasaExito}%</div>
          <p className="text-xs text-muted-foreground">
            Últimos 7 días ({totalSemana} notificaciones)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
