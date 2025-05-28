"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardFooter, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileSpreadsheet, Terminal, Info, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import type { PracticaConDetalles } from '@/lib/validators/practica';
import type { ActionResponse } from '../practicas/actions';

interface PracticasPendientesDocenteClienteProps {
  initialActionResponse: ActionResponse<PracticaConDetalles[]>;
}

export function PracticasPendientesDocenteCliente({ initialActionResponse }: PracticasPendientesDocenteClienteProps) {
  const [practicas, setPracticas] = React.useState<PracticaConDetalles[]>(initialActionResponse.data || []);
  const [error, setError] = React.useState<string | null>(initialActionResponse.error || null);

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error al Cargar Prácticas</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (practicas.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
        <Info className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No tiene prácticas pendientes de aceptación</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Cuando un alumno complete su Acta 1 y usted sea el tutor asignado, la práctica aparecerá aquí para su revisión.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {practicas.map((practica) => (
        <Card key={practica.id} className="flex flex-col shadow-sm hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">
              {practica.alumno?.usuario.nombre} {practica.alumno?.usuario.apellido}
            </CardTitle>
            <CardDescription>
              RUT: {practica.alumno?.usuario.rut} <br/>
              Carrera: {practica.carrera?.nombre || 'N/A'} (Sede: {practica.carrera?.sede?.nombre || 'N/A'})
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-1 flex-grow">
            <p><strong>Tipo:</strong> {practica.tipo === 'LABORAL' ? 'Laboral' : 'Profesional'}</p>
            <p><strong>Inicio:</strong> {format(new Date(practica.fechaInicio), "P", { locale: es })}</p>
            <p><strong>Término (Est.):</strong> {format(new Date(practica.fechaTermino), "P", { locale: es })}</p>
            {practica.fechaCompletadoAlumno && (
                <p className="text-xs text-muted-foreground pt-1">Acta completada por alumno: {format(new Date(practica.fechaCompletadoAlumno), "Pp", { locale: es })}</p>
             )}
          </CardContent>
          <CardFooter className="border-t mt-auto">
            <Button asChild size="sm" className="w-full mt-4">
              <Link href={`/docente/practicas-pendientes/${practica.id}/revisar-acta`}>
                <UserCheck className="mr-2 h-4 w-4" />
                Revisar y Decidir Acta 1
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}