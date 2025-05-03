"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { deactivateCarreraAction } from "@/app/(main)/admin/carreras/actions";
import { Button } from "@/components/ui/button";

export type Carrera = {
  id: string;
  nombre: string;
  sede: { nombre: string };
  estado: boolean;
};

export const columns: ColumnDef<Carrera>[] = [
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    accessorKey: "sede.nombre",
    header: "Sede",
    cell: ({ row }) => row.original.sede.nombre,
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => (row.original.estado ? "Activa" : "Inactiva"),
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: ({ row }) => {
      const carrera = row.original;

      return (
        <div className="flex gap-2">
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={async () => {
              await deactivateCarreraAction(carrera.id);
            }}
          >
            Desactivar
          </Button>
        </div>
      );
    },
  },
];