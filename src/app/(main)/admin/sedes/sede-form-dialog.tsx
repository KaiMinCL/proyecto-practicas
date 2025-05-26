// src/app/(main)/admin/sedes/sede-form-dialog.tsx
"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Save, XCircle } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sedeSchema, type SedeInput, type Sede } from "@/lib/validators/sede";
type SedeFormInputValues = z.input<typeof sedeSchema>;

interface SedeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Sede | null; // Para poblar el formulario en modo edición
  // onSubmitAction: (mode: 'create' | 'edit', data: SedeInput, id?: number) => Promise<any>; // Para el próximo commit
}

export function SedeFormDialog({ open, onOpenChange, initialData }: SedeFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const formMode = initialData ? 'edit' : 'create';

  const form = useForm<SedeFormInputValues, any, SedeInput>({
    resolver: zodResolver(sedeSchema),
  });

  React.useEffect(() => {
    if (open) {
      if (formMode === 'edit' && initialData) {
        form.reset({
          nombre: initialData.nombre,
          direccion: initialData.direccion,
        });
      } else {
        form.reset({
          nombre: "",
          direccion: "",
        });
      }
      form.clearErrors();
    }
  }, [open, formMode, initialData, form]);

  const onSubmitSedeForm: SubmitHandler<SedeInput> = async (data) => {
    setIsSubmitting(true);
    try {
      if (formMode === 'edit' && initialData) {
        console.log("Valores del formulario (Sede a Editar - UI solamente):", { id: initialData.id, ...data });
        // Aquí llamaremos a updateSedeAction en el próximo commit
      } else {
        console.log("Valores del formulario (Sede a Crear - UI solamente):", data);
        // Aquí llamaremos a createSedeAction en el próximo commit
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular llamada API
      onOpenChange(false); 
    } catch (error) {
      console.error(`Error al procesar el formulario en modo ${formMode}:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogTitle = formMode === 'edit' ? "Editar Sede" : "Crear Nueva Sede";
  const dialogDescription = formMode === 'edit' 
    ? `Editando la sede: "${initialData?.nombre}". Modifica los detalles y guarda los cambios.`
    : "Completa los detalles de la nueva sede. Haz clic en 'Guardar Sede' cuando termines.";
  const submitButtonText = formMode === 'edit' ? "Guardar Cambios" : "Guardar Sede";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (isSubmitting && !isOpen) return;
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitSedeForm)} className="space-y-5 pt-2">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Sede</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Sede Valparaíso Central" {...field} value={field.value ?? ''} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Av. Errázuriz 1050, Valparaíso"
                      className="resize-none h-24"
                      {...field}
                      value={field.value ?? ''}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? (formMode === 'edit' ? "Guardando Cambios..." : "Guardando...") : submitButtonText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}