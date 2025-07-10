'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { IniciarPracticaForm } from './iniciar-practica-form';

interface IniciarPracticaDialogProps {
  children: React.ReactNode;
  onPracticaIniciada: () => void;
}

export function IniciarPracticaDialog({ children, onPracticaIniciada }: IniciarPracticaDialogProps) {
  const [open, setOpen] = React.useState(false);

  const handleSuccess = () => {
    setOpen(false); // Cierra el diálogo al tener éxito
    onPracticaIniciada(); // Llama a la función de refresco del dashboard
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Nueva Práctica</DialogTitle>
          <DialogDescription>
            Completa los datos para formalizar el inicio de una nueva práctica.
          </DialogDescription>
        </DialogHeader>
        <IniciarPracticaForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}