"use client";

import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ArrowUpDown, MoreHorizontal, Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { PracticaConDetalles } from '@/lib/validators/practica'; 
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { EstadoPractica as PrismaEstadoPracticaEnum } from "@prisma/client";


// Helper para capitalizar y reemplazar guiones bajos
const formatEstado = (estado: string) => {
  if (!estado) return 'N/A';
  return estado.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
};

export const columnsPracticasGestion: ColumnDef<PracticaConDetalles>[] = [
  {
    id: "alumno",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Alumno <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const alumno = row.original.alumno?.usuario;
      return <div className="font-medium min-w-[200px]">{alumno ? `${alumno.apellido}, ${alumno.nombre}` : 'N/A'}</div>;
    },
    accessorFn: row => `${row.alumno?.usuario.apellido || ''} ${row.alumno?.usuario.nombre || ''}`, // Para sorting
  },
  {
    accessorKey: "alumno.usuario.rut", // Asumiendo que PracticaConDetalles lo tiene
    header: "RUT Alumno",
    cell: ({ row }) => row.original.alumno?.usuario.rut || 'N/A',
  },
  {
    accessorKey: "carrera.nombre",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Carrera <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="min-w-[150px]">{row.original.carrera?.nombre || 'N/A'}</div>,
  },
  {
    accessorKey: "carrera.sede.nombre",
    header: "Sede",
    cell: ({ row }) => row.original.carrera?.sede?.nombre || 'N/A',
  },
  {
    id: "docente",
    header: "Docente Tutor",
    cell: ({ row }) => {
      const docente = row.original.docente?.usuario;
      return docente ? `${docente.apellido}, ${docente.nombre}` : 'N/A';
    },
    accessorFn: row => `${row.docente?.usuario.apellido || ''} ${row.docente?.usuario.nombre || ''}`,
  },
  {
    accessorKey: "fechaInicio",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        F. Inicio <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => format(new Date(row.getValue("fechaInicio")), "P", { locale: es }),
  },
  {
    accessorKey: "fechaTermino",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        F. Término <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => format(new Date(row.getValue("fechaTermino")), "P", { locale: es }),
  },
  {
    accessorKey: "estado",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="text-center w-full justify-center">
        Estado <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const estado = row.getValue("estado") as PrismaEstadoPracticaEnum;
      let variant: "default" | "secondary" | "destructive" | "outline"  = "outline";
      switch (estado) {
        case PrismaEstadoPracticaEnum.PENDIENTE:
        case PrismaEstadoPracticaEnum.PENDIENTE_ACEPTACION_DOCENTE:
        case PrismaEstadoPracticaEnum.EN_CURSO:
          variant = "secondary"; break;
        case PrismaEstadoPracticaEnum.ANULADA:
        case PrismaEstadoPracticaEnum.RECHAZADA_DOCENTE:
          variant = "destructive"; break;
        case PrismaEstadoPracticaEnum.CERRADA:
        case PrismaEstadoPracticaEnum.EVALUACION_COMPLETA:
          variant = "outline"; break;
        default:
          variant = "default";
      }
      return <div className="text-center"><Badge variant={variant}>{formatEstado(estado)}</Badge></div>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Acciones</div>,
    cell: ({ row }) => {
      const practica = row.original;
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
              <DropdownMenuItem asChild>
                <Link href={`/coordinador/practicas/gestion/${practica.id}/editar`}> {/* Ajusta esta ruta si es necesario */}
                  <Edit className="mr-2 h-4 w-4" /> Editar Práctica
                </Link>
              </DropdownMenuItem>
              {/* Aquí podrías añadir más acciones en el futuro, como "Ver Detalles" */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    enableSorting: false,
  },
];