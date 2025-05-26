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
import { createSedeAction, updateSedeAction, type ActionResponse } from './actions'; 

type SedeFormInputValues = z.input<typeof sedeSchema>;

interface SedeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Sede | null;
}

export function SedeFormDialog({ open, onOpenChange, initialData }: SedeFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const formMode = initialData?.id ? 'edit' : 'create'; // Determina el modo por la presencia de initialData.id

  const form = useForm<SedeFormInputValues, unknown, SedeInput>({
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
      let result: ActionResponse<Sede>;

      if (formMode === 'edit' && initialData?.id) {
        // Llama a updateSedeAction si estamos en modo edición y tenemos un ID
        result = await updateSedeAction(initialData.id.toString(), data);
      } else {
        // Llama a createSedeAction para el modo creación
        result = await createSedeAction(data);
      }

      if (result.success && result.data) {
        toast.success(
          formMode === 'edit'
            ? `Sede "${result.data.nombre}" actualizada exitosamente.`
            : `Sede "${result.data.nombre}" creada exitosamente.`
        );
        onOpenChange(false); // Cierra el diálogo
      } else {
        // Manejo de errores
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(err => {
            const fieldName = Array.isArray(err.field) ? err.field[0] : err.field;
            if (typeof fieldName === 'string' && (fieldName === 'nombre' || fieldName === 'direccion')) {
              form.setError(fieldName as keyof SedeInput, {
                type: 'server',
                message: err.message,
              });
            } else {
              toast.error(`Error: ${err.message}`);
            }
          });
          if (form.formState.errors) {
            toast.warning("Por favor, corrige los errores en el formulario.");
          }
        } else {
          toast.error(result.error || `No se pudo ${formMode === 'edit' ? 'actualizar' : 'crear'} la sede.`);
        }
      }
    } catch (error) {
      console.error(`Error al enviar el formulario de sede en modo ${formMode}:`, error);
      toast.error("Ocurrió un error inesperado. Por favor, inténtalo más tarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogTitle = formMode === 'edit' ? "Editar Sede" : "Crear Nueva Sede";
  const dialogDescription = formMode === 'edit' 
    ? `Editando la sede: "${initialData?.nombre}". Modifica los detalles y guarda los cambios.`
    : "Completa los detalles de la nueva sede. Haz clic en 'Guardar Sede' cuando termines.";
  const submitButtonText = formMode === 'edit' ? "Guardar Cambios" : "Guardar Sede";
  const submittingButtonText = formMode === 'edit' ? "Guardando Cambios..." : "Guardando...";


  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (isSubmitting && !isOpen) return; // Previene cierre accidental mientras se envía
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
                {isSubmitting ? submittingButtonText : submitButtonText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}