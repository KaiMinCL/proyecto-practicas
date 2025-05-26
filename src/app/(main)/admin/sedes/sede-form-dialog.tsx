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
import { sedeSchema, type SedeInput } from "@/lib/validators/sede";


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
      console.log("Valores del formulario (Sede a Crear - UI solamente):", data);
      await new Promise(resolve => setTimeout(resolve, 1000));
      onOpenChange(false); 
    } catch (error) {
      console.error("Error al procesar el formulario:", error);
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
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                    <Input placeholder="Ej: Sede Valparaíso Central" {...field} value={field.value ?? ''} />
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