"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Save, XCircle } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

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
import { createSedeAction, type ActionResponse } from './actions';

type SedeFormInputValues = z.input<typeof sedeSchema>;

interface SedeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SedeFormDialog({ open, onOpenChange }: SedeFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SedeFormInputValues, any, SedeInput>({
    resolver: zodResolver(sedeSchema),
    defaultValues: {
      nombre: "",
      direccion: "",
    },
  });

  const onSubmitSedeForm: SubmitHandler<SedeInput> = async (data) => {
    setIsSubmitting(true);
    try {
      const result: ActionResponse<Sede> = await createSedeAction(data);

      if (result.success && result.data) {
        toast.success(`Sede "${result.data.nombre}" creada exitosamente.`);
        onOpenChange(false); // Cierra el diálogo
      } else {
        // Manejo de errores de validación del servidor o errores generales de la acción
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(err => {
            const fieldName = Array.isArray(err.field) ? err.field[0] : err.field;
            if (typeof fieldName === 'string' && (fieldName === 'nombre' || fieldName === 'direccion')) {
              form.setError(fieldName as keyof SedeInput, { // Casteo seguro después de la comprobación
                type: 'server',
                message: err.message,
              });
            } else {
              // Error no asociado a un campo específico o campo no esperado
              toast.error(`Error: ${err.message}`);
            }
          });
          toast.warning("Por favor, corrige los errores en el formulario.");
        } else {
          // Error general de la acción sin detalles de campo
          toast.error(result.error || "No se pudo crear la sede. Inténtalo de nuevo.");
        }
      }
    } catch (error) {
      console.error("Error al enviar el formulario de creación de sede:", error);
      toast.error("Ocurrió un error inesperado al intentar crear la sede. Por favor, inténtalo más tarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (open) {
      form.reset({
        nombre: "",
        direccion: "", 
      });
      form.clearErrors(); // Limpia errores previos al abrir
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (isSubmitting && !isOpen) return; // Prevenir cierre mientras se envía
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Sede</DialogTitle>
          <DialogDescription>
            Completa los detalles de la nueva sede. Haz clic en "Guardar Sede" cuando termines.
          </DialogDescription>
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
                {isSubmitting ? "Guardando..." : "Guardar Sede"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}