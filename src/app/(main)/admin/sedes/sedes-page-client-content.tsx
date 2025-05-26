"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Terminal, MoreHorizontal, Pencil, EyeOff, Eye, ArrowUpDown } from "lucide-react"; // Iconos añadidos
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge"; // Para estado en columnas
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table"; // Para definir columnas

import type { Sede } from '@/lib/validators/sede';
import { SedesDataTable } from './sedes-data-table';
import { SedeFormDialog } from './sede-form-dialog';
import { ToggleSedeStateDialog } from './toggle-sede-state-dialog';

interface SedesPageClientContentProps {
  initialSedes: Sede[];
  initialFetchError: string | null;
}

export function SedesPageClientContent({
  initialSedes,
  initialFetchError,
}: SedesPageClientContentProps) {
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingSede, setEditingSede] = React.useState<Sede | null>(null);

  const [isToggleStateDialogOpen, setIsToggleStateDialogOpen] = React.useState(false);
  const [sedeToToggleState, setSedeToToggleState] = React.useState<Sede | null>(null);

  const handleOpenCreateDialog = () => {
    setEditingSede(null);
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (sedeToEdit: Sede) => {
    setEditingSede(sedeToEdit);
    setIsFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setIsFormDialogOpen(false);
  };

  const handleOpenToggleStateDialog = (sede: Sede) => {
    setSedeToToggleState(sede);
    setIsToggleStateDialogOpen(true);
  };

  const handleCloseToggleStateDialog = () => {
    setIsToggleStateDialogOpen(false);
  };

  // Definimos las columnas aquí para tener acceso a handleOpenEditDialog
   const tableColumns: ColumnDef<Sede>[] = [
    {
      accessorKey: "nombre",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Nombre <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("nombre")}</div>,
    },
    {
      accessorKey: "direccion",
      header: "Dirección",
      cell: ({ row }) => {
        const direccion = row.getValue("direccion") as string | null;
        return direccion || <span className="text-xs text-muted-foreground">N/A</span>;
      },
    },
    {
      accessorKey: "estado",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Estado <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const estado = row.getValue("estado") as Sede['estado'];
        const variant = estado === "ACTIVO" ? "default" : "secondary";
        return <Badge variant={variant} className="capitalize">{estado?.toLowerCase()}</Badge>;
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Última Modificación <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("updatedAt"));
        return <div className="text-sm text-muted-foreground">{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>;
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => {
        const sede = row.original;
        return (
          <div className="text-right font-medium">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menú</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleOpenEditDialog(sede)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleOpenToggleStateDialog(sede)}
                  className={sede.estado === "ACTIVO" 
                    ? "text-red-600 hover:!text-red-600 dark:hover:!text-red-500 focus:text-red-600 dark:focus:text-red-500" 
                    : "text-green-600 hover:!text-green-600 dark:hover:!text-green-500 focus:text-green-600 dark:focus:text-green-500"}
                >
                  {sede.estado === "ACTIVO" ? (
                    <EyeOff className="mr-2 h-4 w-4" />
                  ) : (
                    <Eye className="mr-2 h-4 w-4" />
                  )}
                  {sede.estado === "ACTIVO" ? "Desactivar" : "Activar"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button onClick={handleOpenCreateDialog}>
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
        )
      }

      <SedesDataTable 
        columns={tableColumns} 
        data={initialSedes} 
        searchColumnId="nombre" 
        searchPlaceholder="Filtrar por nombre de sede..."
      />

      <SedeFormDialog 
        open={isFormDialogOpen}
        onOpenChange={handleCloseFormDialog}
        initialData={editingSede}
      />

      <ToggleSedeStateDialog
        open={isToggleStateDialogOpen}
        onOpenChange={handleCloseToggleStateDialog}
        sede={sedeToToggleState}
      />
    </>
  );
}