'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp } from 'lucide-react';
import { ReporteEstadoFinalizacionClient } from './reporte-estado-finalizacion-client';
import { ReporteVolumenPracticasClient } from './reporte-volumen-practicas-client';

export function ReportesGeneralesClient() {
  return (
    <Tabs defaultValue="volumen" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 h-12">
        <TabsTrigger value="volumen" className="flex items-center space-x-2 text-sm">
          <BarChart3 className="h-4 w-4" />
          <span>Volumen de Prácticas</span>
        </TabsTrigger>
        <TabsTrigger value="estado" className="flex items-center space-x-2 text-sm">
          <TrendingUp className="h-4 w-4" />
          <span>Estado de Finalización</span>
        </TabsTrigger>
      </TabsList>

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
    </Tabs>
  );
}
