"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { deactivateSedeAction } from "@/app/(main)/admin/sedes/actions";
import { Button } from "@/components/ui/button";

export type Sede = {
  id: string;
  nombre: string;
  direccion?: string;
  estado: boolean;
};

export const columns: ColumnDef<Sede>[] = [
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    accessorKey: "direccion",
    header: "Dirección",
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
      const sede = row.original;

      return (
        <div className="flex gap-2">
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={async () => {
              await deactivateSedeAction(sede.id);
            }}
          >
            Desactivar
          </Button>
        </div>
      );
    },
  },
];