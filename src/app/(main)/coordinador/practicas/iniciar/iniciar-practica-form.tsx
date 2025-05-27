"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";

import { 
    iniciarPracticaSchema, 
    type IniciarPracticaInput 
} from "@/lib/validators/practica"; 

type IniciarPracticaFormValues = z.input<typeof iniciarPracticaSchema>;

export function IniciarPracticaForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  // Estados para datos de selectores (alumnos, docentes) se añadirán después

  const form = useForm<IniciarPracticaFormValues, any, IniciarPracticaInput>({
    resolver: zodResolver(iniciarPracticaSchema),
    defaultValues: {
      alumnoId: undefined,
      docenteId: undefined,
      tipoPractica: undefined,
      fechaInicio: undefined,
      fechaTermino: undefined,
    },
  });

  // En el siguiente commit, aquí se cargarán los datos para los selectores (alumnos, docentes)

  const onSubmitPractica: SubmitHandler<IniciarPracticaInput> = async (data) => {
    setIsSubmitting(true);
    console.log("Datos del Formulario (Acta 1 - Coordinador UI):", data);
    
    // Aquí se llamará a iniciarPracticaAction en un commit posterior

    toast.info("Funcionalidad de envío pendiente. Datos mostrados en consola.");
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simular
    
    setIsSubmitting(false);
    form.reset(); // resetear después de un envío exitoso
  };

  return (
    <Card className="max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>Datos de la Práctica</CardTitle>
        <CardDescription>
          Por favor, ingrese la información solicitada. La fecha de término será sugerida.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitPractica)}>
          <CardContent className="space-y-6 p-6">
            {/* Los FormField se implementarán detalladamente en los próximos commits */}
            <div className="p-3 border rounded-md bg-muted/30 text-sm text-muted-foreground">
              **Campo Requerido:** Seleccionar Alumno (Combobox) - <i>Implementación Pendiente (HU-18.4)</i>
              {/* <FormField name="alumnoId" ... /> */}
            </div>

            <div className="p-3 border rounded-md bg-muted/30 text-sm text-muted-foreground">
              **Información:** Carrera del Alumno (Auto-rellenado) - <i>Implementación Pendiente (HU-18.4)</i>
            </div>
            
            <div className="p-3 border rounded-md bg-muted/30 text-sm text-muted-foreground">
              **Campo Requerido:** Tipo de Práctica (Select: Laboral/Profesional) - <i>Implementación Pendiente (HU-18.5)</i>
              {/* <FormField name="tipoPractica" ... /> */}
            </div>

            <div className="p-3 border rounded-md bg-muted/30 text-sm text-muted-foreground">
              **Campo Requerido:** Fecha de Inicio (DatePicker) - <i>Implementación Pendiente (HU-18.5)</i>
              {/* <FormField name="fechaInicio" ... /> */}
            </div>

            <div className="p-3 border rounded-md bg-muted/30 text-sm text-muted-foreground">
              **Campo Requerido:** Fecha de Término (Sugerida, DatePicker editable) - <i>Implementación Pendiente (HU-18.5)</i>
              {/* <FormField name="fechaTermino" ... /> */}
            </div>
            
            <div className="p-3 border rounded-md bg-muted/30 text-sm text-muted-foreground">
              **Campo Requerido:** Docente Tutor (Combobox, filtrado por carrera/sede) - <i>Implementación Pendiente (HU-18.4)</i>
              {/* <FormField name="docenteId" ... /> */}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t px-6 py-4">
            <Button type="submit" disabled={isSubmitting /*|| isLoadingData*/}>
              {isSubmitting ? "Iniciando Registro..." : "Iniciar Registro y Notificar Alumno"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}