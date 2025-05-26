"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import type { Sede } from '@/lib/validators/sede';

import { columns } from './columns';
import { SedesDataTable } from './sedes-data-table';
import { SedeFormDialog } from './sede-form-dialog';

interface SedesPageClientContentProps {
  initialSedes: Sede[];
  initialFetchError: string | null;
}

export function SedesPageClientContent({
  initialSedes,
  initialFetchError,
}: SedesPageClientContentProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  // Lógica para manejar el resultado de la creación/edición se añadirá aquí
  // y se pasará a SedeFormDialog.

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Nueva Sede
        </Button>
      </div>

      {initialFetchError && (
        <Alert variant="destructive" className="mb-4">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error al Cargar Datos</AlertTitle>
          <AlertDescription>{initialFetchError}</AlertDescription>
        </Alert>
      )}

      <SedesDataTable 
        columns={columns} 
        data={initialSedes} 
        searchColumnId="nombre" 
        searchPlaceholder="Filtrar por nombre de sede..."
      />

      {/* El diálogo para crear una sede */}
      <SedeFormDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        // La prop onSubmitAction se conectará en el siguiente commit
      />
    </>
  );
}