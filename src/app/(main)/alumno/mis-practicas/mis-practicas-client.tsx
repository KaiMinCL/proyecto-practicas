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
import { Edit3, Terminal, Info, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import type { PracticaConDetalles } from '@/lib/validators/practica';
import { ActionResponse } from '../practicas/actions';

interface MisPracticasClienteProps {
  initialActionResponse: ActionResponse<PracticaConDetalles[]>;
}

export function MisPracticasCliente({ initialActionResponse }: MisPracticasClienteProps) {
  // El estado se inicializa con los datos pasados desde el Server Component
  const [practicas] = React.useState<PracticaConDetalles[]>(initialActionResponse.data || []);
  const [error] = React.useState<string | null>(initialActionResponse.error || null);

  //  efinir estados de práctica donde se puede subir informe
  const puedeSubirInforme = (estado: PracticaConDetalles['estado']): boolean => {
    return [
      'EN_CURSO',
      'INFORME_RECHAZADO', // Si el informe fue rechazado, puede subir uno nuevo
      'EVALUADA_CON_PENDENCIAS', // Si fue evaluada con pendencias, podría necesitar subir correcciones
      'APROBADA', // Permitir ver el informe aunque esté aprobada
      'REPROBADA', // Permitir ver el informe aunque esté reprobada
    ].includes(estado);
  };

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
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No tienes prácticas pendientes</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Cuando tu coordinador inicie el registro de una práctica para ti, aparecerá aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {practicas.map((practica) => (
        <Card key={practica.id} className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl flex justify-between items-center">
              <span>
                Práctica de: {practica.alumno?.usuario.nombre} {practica.alumno?.usuario.apellido}
              </span>
              <span className="text-sm font-normal px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-800/30 dark:text-orange-300">
                Pendiente Completar
              </span>
            </CardTitle>
            <CardDescription>
              {practica.tipo === 'LABORAL' ? 'Práctica Laboral' : 'Práctica Profesional'} en {practica.carrera?.nombre || 'Carrera no especificada'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><strong>Sede:</strong> {practica.carrera?.sede?.nombre || 'N/A'}</p>
            <p><strong>Fecha de Inicio Programada:</strong> {format(new Date(practica.fechaInicio), "PPP", { locale: es })}</p>
            <p><strong>Fecha de Término Estimada:</strong> {format(new Date(practica.fechaTermino), "PPP", { locale: es })}</p>
            <p><strong>Docente Tutor Asignado:</strong> {practica.docente?.usuario?.nombre || ''} {practica.docente?.usuario?.apellido || 'No asignado'}</p>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-end space-x-2"> 
            {/* BOTÓN COMPLETAR ACTA 1 (EXISTENTE) */}
            {practica.estado === 'PENDIENTE' && (
              <Button asChild size="sm" variant="outline">
                <Link href={`/alumno/mis-practicas/${practica.id}/completar-acta`}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Completar Acta 1
                </Link>
              </Button>
            )}
            
            {/* BOTÓN SUBIR/VER INFORME */}
            {puedeSubirInforme(practica.estado) && (
              <Button asChild size="sm">
                <Link href={`/alumno/subir-informe?practicaId=${practica.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  {practica.informeUrl ? 'Ver/Actualizar Informe' : 'Subir Informe Final'}
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}