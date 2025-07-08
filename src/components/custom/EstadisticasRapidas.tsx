import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, BookOpen, Award } from 'lucide-react';

interface EstadisticaPractica {
  porEstado: Array<{
    estado: string;
    count: number;
  }>;
  porTipo: Array<{
    tipo: string;
    count: number;
  }>;
  porCarrera: Array<{
    carrera: string;
    count: number;
  }>;
}

interface EstadisticasRapidasProps {
  estadisticas: EstadisticaPractica;
  loading?: boolean;
}

const ESTADO_COLORS: Record<string, string> = {
  'PENDIENTE': 'bg-yellow-100 text-yellow-800',
  'PENDIENTE_ACEPTACION_DOCENTE': 'bg-orange-100 text-orange-800',
  'RECHAZADA_DOCENTE': 'bg-red-100 text-red-800',
  'EN_CURSO': 'bg-blue-100 text-blue-800',
  'FINALIZADA_PENDIENTE_EVAL': 'bg-purple-100 text-purple-800',
  'EVALUACION_COMPLETA': 'bg-green-100 text-green-800',
  'CERRADA': 'bg-gray-100 text-gray-800',
  'ANULADA': 'bg-red-100 text-red-800'
};

const TIPO_COLORS: Record<string, string> = {
  'LABORAL': 'bg-blue-100 text-blue-800',
  'PROFESIONAL': 'bg-green-100 text-green-800'
};

const ESTADO_LABELS: Record<string, string> = {
  'PENDIENTE': 'Pendiente',
  'PENDIENTE_ACEPTACION_DOCENTE': 'Pendiente Aceptación',
  'RECHAZADA_DOCENTE': 'Rechazada',
  'EN_CURSO': 'En Curso',
  'FINALIZADA_PENDIENTE_EVAL': 'Finalizada (Pend. Eval.)',
  'EVALUACION_COMPLETA': 'Evaluación Completa',
  'CERRADA': 'Cerrada',
  'ANULADA': 'Anulada'
};

const TIPO_LABELS: Record<string, string> = {
  'LABORAL': 'Práctica Laboral',
  'PROFESIONAL': 'Práctica Profesional'
};

export const EstadisticasRapidas: React.FC<EstadisticasRapidasProps> = ({
  estadisticas,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalPracticas = estadisticas.porEstado.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Total de Prácticas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Prácticas</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPracticas}</div>
          <div className="space-y-2 mt-3">
            {estadisticas.porEstado.slice(0, 3).map((item) => (
              <div key={item.estado} className="flex items-center justify-between">
                <Badge
                  variant="secondary"
                  className={`${ESTADO_COLORS[item.estado] || 'bg-gray-100 text-gray-800'} text-xs`}
                >
                  {ESTADO_LABELS[item.estado] || item.estado}
                </Badge>
                <span className="text-sm font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Por Tipo */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Por Tipo</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {estadisticas.porTipo.map((item) => (
              <div key={item.tipo} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="secondary"
                    className={`${TIPO_COLORS[item.tipo] || 'bg-gray-100 text-gray-800'} text-xs`}
                  >
                    {TIPO_LABELS[item.tipo] || item.tipo}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{item.count}</div>
                  <div className="text-xs text-muted-foreground">
                    {totalPracticas > 0 ? `${((item.count / totalPracticas) * 100).toFixed(1)}%` : '0%'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Por Carrera */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Por Carrera</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {estadisticas.porCarrera.slice(0, 4).map((item) => (
              <div key={item.carrera} className="flex items-center justify-between">
                <span className="text-sm font-medium truncate flex-1 mr-2">
                  {item.carrera}
                </span>
                <div className="text-right">
                  <div className="text-sm font-bold">{item.count}</div>
                  <div className="text-xs text-muted-foreground">
                    {totalPracticas > 0 ? `${((item.count / totalPracticas) * 100).toFixed(1)}%` : '0%'}
                  </div>
                </div>
              </div>
            ))}
            {estadisticas.porCarrera.length > 4 && (
              <div className="text-xs text-muted-foreground text-center pt-2">
                +{estadisticas.porCarrera.length - 4} más
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
