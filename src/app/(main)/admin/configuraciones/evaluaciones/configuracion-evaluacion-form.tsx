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

interface ConfiguracionEvaluacionFormProps {
  initialConfig?: ConfiguracionEvaluacionType | null;
}

// Tipo para los valores del formulario, basado en la entrada del schema Zod
type FormValues = z.input<typeof configuracionEvaluacionSchema>;

export function ConfiguracionEvaluacionForm({ initialConfig }: ConfiguracionEvaluacionFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues, any, ConfiguracionEvaluacionInput>({
    resolver: zodResolver(configuracionEvaluacionSchema),
    defaultValues: {
      porcentajeInforme: initialConfig?.porcentajeInforme ?? 0, 
      porcentajeEmpleador: initialConfig?.porcentajeEmpleador ?? 0,
    },
    mode: "onChange", // Para que la validación de la suma (refine) se active al cambiar los valores
  });

  // Observa los valores para calcular y mostrar la suma actual
  const watchedInforme = form.watch("porcentajeInforme");
  const watchedEmpleador = form.watch("porcentajeEmpleador");
  
  // Asegurarse que sean números antes de sumar
  const informeValue = Number(watchedInforme) || 0;
  const empleadorValue = Number(watchedEmpleador) || 0;
  const currentSum = informeValue + empleadorValue;

  // Este onSubmit se conectará luego
  const onSubmit: SubmitHandler<ConfiguracionEvaluacionInput> = async (data) => {
    setIsSubmitting(true);
    console.log("Configuración a guardar (UI Solamente):", data);
    toast.info("Funcionalidad de guardado pendiente. Datos mostrados en consola.");
    
    // Simular envío
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    form.reset(data);
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
                      // El valor del campo se maneja por RHF, la coerción por Zod
                      onChange={event => field.onChange(event.target.value === '' ? undefined : parseInt(event.target.value, 10))}
                      value={field.value ?? ""} // Para inputs numéricos, mostrar string vacío si es undefined
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
                currentSum !== 100 ? "bg-destructive/10 border-destructive/50" : "bg-green-500/10 border-green-500/50"
            )}>
                <p className="font-medium">
                    Suma Actual de Porcentajes: 
                    <span className={cn("font-bold ml-1", currentSum !== 100 ? "text-destructive" : "text-green-700 dark:text-green-400")}>
                        {currentSum}%
                    </span>
                </p>
                {/* El error del .refine() de Zod se mostrará aquí si es un error a nivel de schema */}
                {form.formState.errors.root?.message && (
                    <p className="text-xs text-destructive mt-1">{form.formState.errors.root.message}</p>
                )}
                 {currentSum !== 100 && !form.formState.errors.root?.message && ( // Muestra este solo si Zod aún no ha puesto el error
                    <p className="text-xs text-destructive mt-1">La suma debe ser 100% para poder guardar.</p>
                )}
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isSubmitting || currentSum !== 100 || !form.formState.isDirty}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}