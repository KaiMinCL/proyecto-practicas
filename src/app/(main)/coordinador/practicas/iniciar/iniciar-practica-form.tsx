"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown} from "lucide-react";
import { cn } from "@/lib/utils";

import { 
    iniciarPracticaSchema, 
    type IniciarPracticaInput 
} from "@/lib/validators/practica";
import { 
  getAlumnosParaFormAction, 
  getDocentesParaFormAction, 
  type AlumnoOption,
  type DocenteOption
} from '../actions';

type IniciarPracticaFormValues = z.input<typeof iniciarPracticaSchema>;

export function IniciarPracticaForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [alumnosOptions, setAlumnosOptions] = React.useState<AlumnoOption[]>([]);
  const [docentesOptions, setDocentesOptions] = React.useState<DocenteOption[]>([]);

  const [isLoadingAlumnos, setIsLoadingAlumnos] = React.useState(true);
  const [isLoadingDocentes, setIsLoadingDocentes] = React.useState(false); // Solo carga docentes después de seleccionar alumno

  const [selectedAlumnoData, setSelectedAlumnoData] = React.useState<AlumnoOption | null>(null);

  const [alumnoPopoverOpen, setAlumnoPopoverOpen] = React.useState(false);
  const [docentePopoverOpen, setDocentePopoverOpen] = React.useState(false);

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

  // Fetch Alumnos al montar el componente
  React.useEffect(() => {
    setIsLoadingAlumnos(true);
    getAlumnosParaFormAction()
      .then(response => {
        if (response.success && response.data) {
          setAlumnosOptions(response.data);
        } else {
          toast.error(response.error || "No se pudieron cargar los alumnos.");
          setAlumnosOptions([]);
        }
      })
      .catch(() => toast.error("Error crítico al cargar alumnos."))
      .finally(() => setIsLoadingAlumnos(false));
  }, []);

  // Fetch Docentes cuando se selecciona un Alumno y su carrera tiene un sedeId
  React.useEffect(() => {
    form.resetField("docenteId");
    setDocentesOptions([]);

    if (selectedAlumnoData?.carreraId && selectedAlumnoData?.sedeIdDeCarrera) {
      setIsLoadingDocentes(true);
      getDocentesParaFormAction({ carreraId: selectedAlumnoData.carreraId }) 
        .then(response => {
          if (response.success && response.data) {
            setDocentesOptions(response.data);
          } else {
            toast.error(response.error || "No se pudieron cargar los docentes.");
          }
        })
        .catch(() => toast.error("Error crítico al cargar docentes."))
        .finally(() => setIsLoadingDocentes(false));
    }
  }, [selectedAlumnoData, form]);


  const onSubmitPractica: SubmitHandler<IniciarPracticaInput> = async (data) => {
    if (!selectedAlumnoData) {
        toast.error("Por favor, seleccione un alumno.");
        form.setError("alumnoId", { type: "manual", message: "Alumno es requerido." });
        return;
    }
    setIsSubmitting(true);
    const submissionData = { ...data };
    console.log("Datos del Formulario (Acta 1 - Coordinador UI):", submissionData);
    console.log("Carrera ID del Alumno seleccionado:", selectedAlumnoData.carreraId);
    toast.info("Funcionalidad de envío pendiente. Datos mostrados en consola.");

    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
  };

  return (
    <Card className="max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>Registrar Nueva Práctica</CardTitle>
        <CardDescription>
          Complete los datos iniciales del Acta 1. El alumno completará el resto de la información.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitPractica)}>
          <CardContent className="space-y-6 p-6">
            {/* Selector de Alumno */}
            <FormField
              control={form.control}
              name="alumnoId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Alumno <span className="text-red-500">*</span></FormLabel>
                  <Popover open={alumnoPopoverOpen} onOpenChange={setAlumnoPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={alumnoPopoverOpen}
                          className={cn("w-full justify-between font-normal", !field.value && "text-muted-foreground")}
                          disabled={isLoadingAlumnos || isSubmitting}
                        >
                          {isLoadingAlumnos
                            ? "Cargando alumnos..."
                            : field.value
                              ? alumnosOptions.find(opt => opt.value === field.value)?.label.split(" - Carrera:")[0]
                              : "Seleccionar alumno..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                      <Command filter={(itemValue, search) => 
                        alumnosOptions.find(opt => opt.value.toString() === itemValue)?.label.toLowerCase().includes(search.toLowerCase()) ? 1 : 0 
                      }>
                        <CommandInput placeholder="Buscar alumno por nombre, RUT, carrera..." />
                        <CommandList>
                          <CommandEmpty>{isLoadingAlumnos ? "Cargando..." : "No se encontraron alumnos."}</CommandEmpty>
                          <CommandGroup>
                            {alumnosOptions.map((option) => (
                              <CommandItem
                                value={option.value.toString()} // El valor que usa Command para filtrar/identificar
                                key={option.value}
                                onSelect={() => {
                                  form.setValue("alumnoId", option.value, { shouldValidate: true });
                                  setSelectedAlumnoData(option);
                                  setAlumnoPopoverOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", option.value === field.value ? "opacity-100" : "opacity-0")} />
                                {option.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display de Carrera del Alumno (auto-filled) */}
            {selectedAlumnoData && (
              <div className="space-y-1">
                <FormLabel className="text-sm">Información de Carrera</FormLabel>
                <div className="p-3 border rounded-md bg-slate-50 dark:bg-slate-800/50 text-sm">
                  <p><strong>Carrera:</strong> {selectedAlumnoData.carreraNombre}</p>
                  <p><strong>Sede:</strong> {selectedAlumnoData.sedeNombreDeCarrera}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (ID Carrera: {selectedAlumnoData.carreraId} - Horas Lab: {selectedAlumnoData.carreraHorasLaboral}, Prof: {selectedAlumnoData.carreraHorasProfesional})
                  </p>
                </div>
              </div>
            )}

            {/* Marcador de Posición para Tipo de Práctica */}
            <div className="p-3 border rounded-md bg-muted/30 text-sm text-muted-foreground">
              **Campo Requerido:** Tipo de Práctica (Select: Laboral/Profesional) - <i>Implementación Pendiente (HU-18.5)</i>
            </div>

            {/* Marcador de Posición para Fecha de Inicio */}
            <div className="p-3 border rounded-md bg-muted/30 text-sm text-muted-foreground">
              **Campo Requerido:** Fecha de Inicio (DatePicker) - <i>Implementación Pendiente (HU-18.5)</i>
            </div>

            {/* Marcador de Posición para Fecha de Término */}
            <div className="p-3 border rounded-md bg-muted/30 text-sm text-muted-foreground">
              **Campo Requerido:** Fecha de Término (Sugerida, DatePicker editable) - <i>Implementación Pendiente (HU-18.5)</i>
            </div>

            {/* Selector de Docente Tutor */}
            <FormField
              control={form.control}
              name="docenteId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Docente Tutor <span className="text-red-500">*</span></FormLabel>
                  <Popover open={docentePopoverOpen} onOpenChange={setDocentePopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={docentePopoverOpen}
                          className={cn("w-full justify-between font-normal",!field.value && "text-muted-foreground")}
                          disabled={!selectedAlumnoData || isLoadingDocentes || isSubmitting}
                        >
                          {isLoadingDocentes
                            ? "Cargando docentes..."
                            : field.value
                              ? docentesOptions.find(opt => opt.value === field.value)?.label
                              : (selectedAlumnoData ? "Seleccionar docente..." : "Seleccione un alumno primero")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                      <Command filter={(itemValue, search) => 
                        docentesOptions.find(opt => opt.value.toString() === itemValue)?.label.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                      }>
                        <CommandInput placeholder="Buscar docente..." />
                        <CommandList>
                          <CommandEmpty>{isLoadingDocentes ? "Cargando..." : (selectedAlumnoData ? "No se encontraron docentes." : "Seleccione un alumno.")}</CommandEmpty>
                          <CommandGroup>
                            {docentesOptions.map((option) => (
                              <CommandItem
                                value={option.value.toString()} // El valor que usa Command para filtrar/identificar
                                key={option.value}
                                onSelect={() => {
                                  form.setValue("docenteId", option.value, { shouldValidate: true });
                                  setDocentePopoverOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", option.value === field.value ? "opacity-100" : "opacity-0")} />
                                {option.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end border-t px-6 py-4">
            <Button type="submit" disabled={isSubmitting || isLoadingAlumnos || isLoadingDocentes }>
              {isSubmitting ? "Iniciando Práctica..." : "Iniciar Registro y Notificar Alumno"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}