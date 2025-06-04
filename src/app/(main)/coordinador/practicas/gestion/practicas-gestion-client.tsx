"use client";

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Info } from "lucide-react"; 
import type { PracticaConDetalles } from '@/lib/validators/practica';
import { columnsPracticasGestion } from './columns'; 
import { PracticasGestionDataTable } from './practicas-gestion-data-table';
import { ActionResponse } from '../actions';


interface PracticasGestionClienteProps {
  initialActionResponse: ActionResponse<PracticaConDetalles[]>;
}

export function PracticasGestionCliente({ initialActionResponse }: PracticasGestionClienteProps) {
  const [practicas] = React.useState<PracticaConDetalles[]>(initialActionResponse.data || []);
  const [error] = React.useState<string | null>(initialActionResponse.error || null);

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error al Cargar Prácticas</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  // Aquí no hay botón de "Crear" porque el flujo de "Iniciar Práctica" está en otra página.
  // Esta página es solo para listar y gestionar existentes.

  return (
    <>
      {practicas.length === 0 && !error && (
         <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <Info className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No hay prácticas para mostrar</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Intenta ajustar los filtros o inicia nuevas prácticas.
            </p>
        </div>
      )}
      {practicas.length > 0 && (
        <PracticasGestionDataTable 
            columns={columnsPracticasGestion} 
            data={practicas} 
        />
      )}
    </>
  );
}