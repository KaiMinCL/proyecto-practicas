'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Users } from 'lucide-react';
import { ReporteEstadoFinalizacionClient } from './reporte-estado-finalizacion-client';
import { ReporteVolumenPracticasClient } from './reporte-volumen-practicas-client';
import { ReporteNominaAlumnosClient } from './reporte-nomina-alumnos-client';
import { useAuth } from '@/hooks/useAuth';

export function ReportesGeneralesClient() {
  const { user } = useAuth();

  // Determinar qué reportes mostrar según el rol
  const puedeVerReportesGenerales = user && ['SUPER_ADMIN', 'DIRECTOR_CARRERA'].includes(user.rol);
  const puedeVerNominaAlumnos = user && ['DIRECTOR_CARRERA', 'COORDINADOR'].includes(user.rol);

  return (
    <Tabs defaultValue={puedeVerReportesGenerales ? "volumen" : "nomina"} className="space-y-6">
      <TabsList className={`grid w-full h-12 ${puedeVerReportesGenerales && puedeVerNominaAlumnos ? 'grid-cols-3' : puedeVerReportesGenerales ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {puedeVerReportesGenerales && (
          <>
            <TabsTrigger value="volumen" className="flex items-center space-x-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              <span>Volumen de Prácticas</span>
            </TabsTrigger>
            <TabsTrigger value="estado" className="flex items-center space-x-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>Estado de Finalización</span>
            </TabsTrigger>
          </>
        )}
        {puedeVerNominaAlumnos && (
          <TabsTrigger value="nomina" className="flex items-center space-x-2 text-sm">
            <Users className="h-4 w-4" />
            <span>Nómina de Alumnos</span>
          </TabsTrigger>
        )}
      </TabsList>

      {puedeVerReportesGenerales && (
        <>
          <TabsContent value="volumen" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground dark:text-foreground-dark">
                  Reporte de Volumen de Prácticas
                </h2>
                <p className="text-muted-foreground dark:text-muted-foreground-dark">
                  Análisis del volumen de prácticas iniciadas por periodo, sede, escuela y carrera.
                </p>
              </div>
              <ReporteVolumenPracticasClient />
            </div>
          </TabsContent>

          <TabsContent value="estado" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground dark:text-foreground-dark">
                  Reporte de Estado de Finalización
                </h2>
                <p className="text-muted-foreground dark:text-muted-foreground-dark">
                  Análisis del estado de finalización de las prácticas para evaluar resultados.
                </p>
              </div>
              <ReporteEstadoFinalizacionClient />
            </div>
          </TabsContent>
        </>
      )}

      {puedeVerNominaAlumnos && (
        <TabsContent value="nomina" className="space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground dark:text-foreground-dark">
                Reporte de Nómina de Alumnos en Práctica
              </h2>
              <p className="text-muted-foreground dark:text-muted-foreground-dark">
                Nómina detallada de alumnos actualmente en práctica para propósitos administrativos.
              </p>
            </div>
            <ReporteNominaAlumnosClient />
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}
