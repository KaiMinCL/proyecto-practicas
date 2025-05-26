"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Carrera } from '@/lib/validators/carrera'; 
import { columns } from './columns';
import { CarrerasDataTable } from './carreras-data-table';

interface CarrerasPageClientContentProps {
  initialCarreras: Carrera[];
  initialFetchError: string | null;
}

export function CarrerasPageClientContent({
  initialCarreras,
  initialFetchError,
}: CarrerasPageClientContentProps) {
  return (
    <>
      <div className="flex justify-end mb-6">
        <Button /* onClick={() => setIsFormDialogOpen(true)} // Se conectará después */ >
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Nueva Carrera
        </Button>
      </div>

      {initialFetchError && (
        <Alert variant="destructive" className="mb-4">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error al Cargar Datos</AlertTitle>
          <AlertDescription>{initialFetchError}</AlertDescription>
        </Alert>
      )}
      
      <CarrerasDataTable 
        columns={columns} 
        data={initialCarreras} 
        searchColumnId="nombre"
        searchPlaceholder="Filtrar por nombre de carrera..."
      />

      {/* Los diálogos modales para crear/editar y activar/desactivar se añadirán aquí */}
    </>
  );
}