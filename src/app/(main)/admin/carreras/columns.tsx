"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil, EyeOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Carrera } from '@/lib/validators/carrera';

export const columns: ColumnDef<Carrera>[] = [
  {
    accessorKey: "nombre",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Nombre Carrera
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium min-w-[200px]">{row.getValue("nombre")}</div>, // Añadido min-w
  },
  {
    accessorKey: "sede.nombre", // Accede al nombre de la sede anidada
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Sede Asociada
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const sedeNombre = row.original.sede?.nombre;
      return <div className="min-w-[150px]">{sedeNombre || <span className="text-xs text-muted-foreground">N/A</span>}</div>;
    },
    filterFn: (row, id, value) => { // Para filtrar por nombre de sede
      return (row.original.sede?.nombre.toLowerCase() || '').includes(String(value).toLowerCase());
    }
  },
  {
    accessorKey: "horasPracticaLaboral",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="text-center w-full justify-center">
        Hrs. P. Lab.
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("horasPracticaLaboral")}</div>,
  },
  {
    accessorKey: "horasPracticaProfesional",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="text-center w-full justify-center">
        Hrs. P. Prof.
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("horasPracticaProfesional")}</div>,
  },
  {
    accessorKey: "estado",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="text-center w-full justify-center">
        Estado
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
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
      // Los handlers para estas acciones se conectarán en commits posteriores
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
              <DropdownMenuItem /* onClick={() => handleOpenEditDialog(carrera)} */ >
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                /* onClick={() => handleOpenToggleStateDialog(carrera)} */
                className={carrera.estado === "ACTIVO" 
                  ? "text-red-600 hover:!text-red-600 dark:hover:!text-red-500 focus:text-red-600 dark:focus:text-red-500" 
                  : "text-green-600 hover:!text-green-600 dark:hover:!text-green-500 focus:text-green-600 dark:focus:text-green-500"}
              >
                {carrera.estado === "ACTIVO" ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {carrera.estado === "ACTIVO" ? "Desactivar" : "Activar"}
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