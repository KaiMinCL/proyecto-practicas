"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Terminal, MoreHorizontal, Pencil, EyeOff, Eye, ArrowUpDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";

import type { Carrera, CarreraInput } from '@/lib/validators/carrera'; 
import { CarrerasDataTable } from './carreras-data-table';
import { CarreraFormDialog } from './carrera-form-dialog';

interface CarrerasPageClientContentProps {
  initialCarreras: Carrera[];
  initialFetchError: string | null;
}

export function CarrerasPageClientContent({
  initialCarreras,
  initialFetchError,
}: CarrerasPageClientContentProps) {
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [editingCarrera, setEditingCarrera] = React.useState<(CarreraInput & {id?:number}) | undefined>(undefined);

  // const [isToggleStateDialogOpen, setIsToggleStateDialogOpen] = React.useState(false);
  // const [carreraToToggleState, setCarreraToToggleState] = React.useState<Carrera | null>(null);

  const handleOpenCreateDialog = () => {
    setEditingCarrera(undefined); // Sin datos iniciales para creación
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (carreraToEdit: Carrera) => {
    // Mapea la 'Carrera' completa a 'CarreraInput & {id}'
    // CarreraInput espera sedeId, no el objeto sede.
    const carreraFormData: CarreraInput & { id: number } = {
        id: carreraToEdit.id,
        nombre: carreraToEdit.nombre,
        sedeId: carreraToEdit.sedeId, // CarreraInput espera sedeId numérico
        horasPracticaLaboral: carreraToEdit.horasPracticaLaboral,
        horasPracticaProfesional: carreraToEdit.horasPracticaProfesional,
    };
    setEditingCarrera(carreraFormData);
    setIsFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setIsFormDialogOpen(false);
  };

  // const handleOpenToggleStateDialog = (carrera: Carrera) => { ... };
  // const handleCloseToggleStateDialog = () => { ... };

  const tableColumns: ColumnDef<Carrera>[] = [
    {
        accessorKey: "nombre",
        header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Nombre Carrera<ArrowUpDown className="ml-2 h-4 w-4" /></Button>),
        cell: ({ row }) => <div className="font-medium min-w-[200px]">{row.getValue("nombre")}</div>,
    },
    {
        accessorKey: "sede.nombre",
        header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Sede Asociada<ArrowUpDown className="ml-2 h-4 w-4" /></Button>),
        cell: ({ row }) => {
            const sedeNombre = row.original.sede?.nombre;
            return <div className="min-w-[150px]">{sedeNombre || <span className="text-xs text-muted-foreground">N/A</span>}</div>;
        },
    },
    {
        accessorKey: "horasPracticaLaboral",
        header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="text-center w-full justify-center">Hrs. P. Lab.<ArrowUpDown className="ml-2 h-4 w-4" /></Button>),
        cell: ({ row }) => <div className="text-center">{row.getValue("horasPracticaLaboral")}</div>,
    },
    {
        accessorKey: "horasPracticaProfesional",
        header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="text-center w-full justify-center">Hrs. P. Prof.<ArrowUpDown className="ml-2 h-4 w-4" /></Button>),
        cell: ({ row }) => <div className="text-center">{row.getValue("horasPracticaProfesional")}</div>,
    },
    {
        accessorKey: "estado",
        header: ({ column }) => (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="text-center w-full justify-center">Estado<ArrowUpDown className="ml-2 h-4 w-4" /></Button>),
        cell: ({ row }) => {
            const estado = row.getValue("estado") as Carrera['estado'];
            const variant = estado === "ACTIVO" ? "default" : "secondary";
            return <div className="text-center"><Badge variant={variant} className="capitalize">{estado?.toLowerCase()}</Badge></div>;
        },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => {
        const carrera = row.original;
        return (
          <div className="text-right font-medium">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleOpenEditDialog(carrera)}>
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  // onClick={() => handleOpenToggleStateDialog(carrera)}
                  className={carrera.estado === "ACTIVO" ? "text-red-600 hover:!text-red-600 dark:hover:!text-red-500 focus:text-red-600 dark:focus:text-red-500" : "text-green-600 hover:!text-green-600 dark:hover:!text-green-500 focus:text-green-600 dark:focus:text-green-500"}
                >
                  {carrera.estado === "ACTIVO" ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {carrera.estado === "ACTIVO" ? "Desactivar" : "Activar"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button onClick={handleOpenCreateDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Nueva Carrera
        </Button>
      </div>

      {initialFetchError && ( /* Tu Alerta de error */
         <Alert variant="destructive" className="mb-4">
           <Terminal className="h-4 w-4" />
           <AlertTitle>Error al Cargar Datos</AlertTitle>
           <AlertDescription>{initialFetchError}</AlertDescription>
         </Alert>
      )}

      <CarrerasDataTable 
        columns={tableColumns} 
        data={initialCarreras} 
        searchColumnId="nombre" 
        searchPlaceholder="Filtrar por nombre de carrera..."
      />

      <CarreraFormDialog 
        open={isFormDialogOpen}
        onOpenChange={handleCloseFormDialog}
        initialData={editingCarrera}
      />

      {/* <ToggleCarreraStateDialog ... /> */}
    </>
  );
}