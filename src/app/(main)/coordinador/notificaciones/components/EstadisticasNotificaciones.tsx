import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Mail, Clock, TrendingUp } from 'lucide-react';
import { EstadisticasNotificaciones } from '../actions';

interface EstadisticasNotificacionesProps {
  estadisticas: EstadisticasNotificaciones;
}

export function EstadisticasNotificacionesCards({ estadisticas }: EstadisticasNotificacionesProps) {
  const { enviadasHoy, exitosasHoy, fallidasHoy, totalSemana, tasaExito } = estadisticas;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Enviadas Hoy</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
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
          <CardTitle className="text-sm font-medium">Exitosas</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{exitosasHoy}</div>
          <p className="text-xs text-muted-foreground">
            {enviadasHoy > 0 ? `${Math.round((exitosasHoy / enviadasHoy) * 100)}% de éxito hoy` : 'Sin envíos hoy'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fallidas</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{fallidasHoy}</div>
          <p className="text-xs text-muted-foreground">
            {enviadasHoy > 0 ? `${Math.round((fallidasHoy / enviadasHoy) * 100)}% fallos hoy` : 'Sin fallos hoy'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{tasaExito}%</div>
          <p className="text-xs text-muted-foreground">
            Últimos 7 días ({totalSemana} envíos)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
