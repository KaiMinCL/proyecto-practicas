"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { CarreraForm } from "./CarreraForm";

export function CrearCarreraButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="mb-4">Crear Nueva Carrera</Button>
      </DialogTrigger>
      <DialogContent>
        <CarreraForm mode="create" />
      </DialogContent>
    </Dialog>
  );
}