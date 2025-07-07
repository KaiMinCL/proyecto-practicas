"use client";

import React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { XCircle, Send, AlertTriangle } from "lucide-react";

// Schema para el formulario de motivo de rechazo
const rejectionSchema = z.object({
  motivoRechazo: z.string()
    .min(10, { message: "El motivo de rechazo debe tener al menos 10 caracteres." })
    .max(1000, { message: "El motivo no puede exceder los 1000 caracteres." }),
});
type RejectionFormData = z.infer<typeof rejectionSchema>;

interface RejectionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>; // Callback que manejará la llamada a la Server Action
  isSubmittingReason: boolean; // Para deshabilitar botones mientras se procesa
}

export function RejectionReasonModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isSubmittingReason 
}: RejectionReasonModalProps) {
  const form = useForm<RejectionFormData>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: {
      motivoRechazo: "",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({ motivoRechazo: "" }); // Limpia el formulario al abrir
      form.clearErrors();
    }
  }, [isOpen, form]);

  const handleFormSubmit: SubmitHandler<RejectionFormData> = async (data) => {
    await onSubmit(data.motivoRechazo); // Llama a la función onSubmit pasada por el padre
    // El padre (RevisarActaDocenteCliente) se encargará de cerrar el modal si el submit es exitoso
  };

  return (
    <Dialog 
        open={isOpen} 
        onOpenChange={(openStatus) => {
            if (isSubmittingReason && !openStatus) return; // Prevenir cierre mientras se procesa
            if (!openStatus) onClose(); // Si se cierra de otra forma (ej. Esc), llama a onClose
        }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Indicar Motivo del Rechazo</DialogTitle>
          <DialogDescription>
            Por favor, explique brevemente por qué está rechazando la supervisión de esta práctica.
            Esta información será comunicada al Coordinador.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="motivoRechazo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo del Rechazo <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: La descripción de tareas no se alinea con los objetivos de la carrera..."
                      className="min-h-[120px]"
                      {...field}
                      disabled={isSubmittingReason}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmittingReason}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmittingReason}>
                <Send className="mr-2 h-4 w-4" />
                {isSubmittingReason ? "Enviando..." : "Enviar Rechazo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}