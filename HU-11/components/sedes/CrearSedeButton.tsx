"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { SedeForm } from "./SedeForm";

export function CrearSedeButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="mb-4">Crear Nueva Sede</Button>
      </DialogTrigger>
      <DialogContent>
        <SedeForm mode="create" />
      </DialogContent>
    </Dialog>
  );
}