"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardFooter, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { 
    Form, 
    FormControl, 
    FormDescription, 
    FormField, 
    FormItem, 
    FormLabel, 
    FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";

import { 
    configuracionEvaluacionSchema, 
    type ConfiguracionEvaluacionInput,
    type ConfiguracionEvaluacion as ConfiguracionEvaluacionType 
} from "@/lib/validators/configuracion";
import { updateConfiguracionEvaluacionAction, type ActionResponse } from './actions';


interface ConfiguracionEvaluacionFormProps {
  initialConfig?: ConfiguracionEvaluacionType | null;
}

// Tipo para los valores del formulario, basado en la entrada del schema Zod
type FormValues = z.input<typeof configuracionEvaluacionSchema>;

export function ConfiguracionEvaluacionForm({ initialConfig }: ConfiguracionEvaluacionFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues, unknown, ConfiguracionEvaluacionInput>({
    resolver: zodResolver(configuracionEvaluacionSchema),
    defaultValues: {
      porcentajeInforme: initialConfig?.porcentajeInforme ?? 0, 
      porcentajeEmpleador: initialConfig?.porcentajeEmpleador ?? 0,
    },
    mode: "onChange",
  });

  // Observar los valores para calcular y mostrar la suma actual
  const watchedInforme = form.watch("porcentajeInforme");
  const watchedEmpleador = form.watch("porcentajeEmpleador");
  
  // Asegurarse que sean números antes de sumar
  const informeValue = Number(watchedInforme) || 0;
  const empleadorValue = Number(watchedEmpleador) || 0;
  const currentSum = informeValue + empleadorValue;

  const onSubmit: SubmitHandler<ConfiguracionEvaluacionInput> = async (data) => {
    setIsSubmitting(true);
    let refineErrorShown = false; // Para mostrar solo un error de .refine() como error de root    
    try {
      const result: ActionResponse<ConfiguracionEvaluacionType> = await updateConfiguracionEvaluacionAction(data);

      if (result.success && result.data) {
        toast.success(result.message || "Configuración de ponderación actualizada exitosamente.");
        // Resetea el formulario con los datos actualizados del servidor
        form.reset({
            porcentajeInforme: result.data.porcentajeInforme,
            porcentajeEmpleador: result.data.porcentajeEmpleador,
        });
      } else {
        // Manejo de errores devueltos por la Server Action
        let serverErrorProcessed = false;
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(err => {
            // Errores de campo específicos (aunque en este schema es más probable el error de 'refine')
            if (err.field && Array.isArray(err.field) && err.field.length > 0) { 
              const fieldName = err.field.join('.') as keyof FormValues; 
               if (Object.prototype.hasOwnProperty.call(form.getValues(), fieldName)) {
                    form.setError(fieldName, { type: "server", message: err.message });
                    form.setFocus(fieldName); 
               } else {
                    toast.error(`Error en '${fieldName}': ${err.message}`);
               }
               serverErrorProcessed = true;
            } else if (err.message && !refineErrorShown) { 
              // Esto maneja errores de Zod donde e.path (ahora err.field) es un array vacío [],
              form.setError("root.serverError", { type: "custom", message: err.message });
              serverErrorProcessed = true; 
              refineErrorShown = true; // Para asegurar que solo se muestre un error de root de este tipo
            }
          });
        }
        
       // Si después de procesar result.errors, aún no se ha mostrado un error de formulario específico
        if (!serverErrorProcessed && result.error) {
          toast.error(result.error || "No se pudo actualizar la configuración.");
        } else if (!serverErrorProcessed && !result.success) { // Error desconocido si no hay detalles
            toast.error("Ocurrió un error desconocido al actualizar la configuración.");
        } else if (serverErrorProcessed && Object.keys(form.formState.errors).length > 0 && !form.formState.errors.root?.serverError){
            // Si se establecieron errores de campo pero no el de root, avisa al usuario.
            toast.warning("Por favor, corrige los errores indicados en el formulario.");
        }
      }
    } catch (error) {
      console.error("Error al guardar la configuración:", error);
      toast.error("Ocurrió un error inesperado al intentar guardar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Establecer Ponderaciones</CardTitle>
        <CardDescription>
          La suma de ambos porcentajes debe ser 100.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="porcentajeInforme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Porcentaje Nota Informe Docente (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Ej: 60" 
                      {...field}
                      onChange={event => field.onChange(event.target.value === '' ? undefined : parseInt(event.target.value, 10))}
                      value={field.value ?? ""}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Peso de la nota del informe de práctica evaluado por el docente.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="porcentajeEmpleador"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Porcentaje Nota Evaluación Empleador (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Ej: 40" 
                      {...field}
                      onChange={event => field.onChange(event.target.value === '' ? undefined : parseInt(event.target.value, 10))}
                      value={field.value ?? ""}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Peso de la nota de la evaluación del desempeño realizada por el empleador.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className={cn(
                "p-3 border rounded-md text-sm",
                currentSum !== 100 || form.formState.errors.root?.serverError 
                    ? "bg-destructive/10 border-destructive/50 text-destructive" 
                    : "bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400"
            )}>
                <p className="font-medium">
                    Suma Actual de Porcentajes: 
                    <span className={cn("font-bold ml-1")}>
                        {currentSum}%
                    </span>
                </p>
                {form.formState.errors.root?.serverError && ( // Muestra error de Zod .refine del servidor
                    <p className="text-xs mt-1">{form.formState.errors.root.serverError.message}</p>
                )}
                {currentSum !== 100 && !form.formState.errors.root?.serverError && (
                    <p className="text-xs mt-1">La suma debe ser 100% para poder guardar.</p>
                )}
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || currentSum !== 100 || !form.formState.isDirty}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}