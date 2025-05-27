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
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger
 } from "@/components/ui/popover";
import { 
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
 } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue 
} from "@/components/ui/select";
import { Check, ChevronsUpDown, Save, CalendarIcon} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { 
    iniciarPracticaSchema, 
    type IniciarPracticaInput,
    type PracticaConDetalles
} from "@/lib/validators/practica";
import { 
  getAlumnosParaFormAction, 
  getDocentesParaFormAction, 
  sugerirFechaTerminoAction,
  iniciarPracticaAction,
  type AlumnoOption,
  type DocenteOption,
  type ActionResponse
} from '../actions';
import { TipoPractica as PrismaTipoPracticaEnum } from '@prisma/client';

type IniciarPracticaFormValues = z.input<typeof iniciarPracticaSchema>;

export function IniciarPracticaForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [alumnosOptions, setAlumnosOptions] = React.useState<AlumnoOption[]>([]);
  const [docentesOptions, setDocentesOptions] = React.useState<DocenteOption[]>([]);
  const [isLoadingAlumnos, setIsLoadingAlumnos] = React.useState(true);
  const [isLoadingDocentes, setIsLoadingDocentes] = React.useState(false);
  const [isLoadingSugerenciaFechaTermino, setIsLoadingSugerenciaFechaTermino] = React.useState(false);
  const [selectedAlumnoData, setSelectedAlumnoData] = React.useState<AlumnoOption | null>(null);
  const [suggestedFechaTermino, setSuggestedFechaTermino] = React.useState<Date | null>(null);
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

  React.useEffect(() => {
    setIsLoadingAlumnos(true);
    getAlumnosParaFormAction()
      .then(response => {
        if (response.success && response.data) setAlumnosOptions(response.data);
        else toast.error(response.error || "No se pudieron cargar los alumnos.");
      })
      .catch(() => toast.error("Error crítico al cargar alumnos."))
      .finally(() => setIsLoadingAlumnos(false));
  }, []);

  React.useEffect(() => {
    form.resetField("docenteId");
    setDocentesOptions([]);
    if (selectedAlumnoData?.carreraId) {
      setIsLoadingDocentes(true);
      getDocentesParaFormAction({ carreraId: selectedAlumnoData.carreraId })
        .then(response => {
          if (response.success && response.data) setDocentesOptions(response.data);
          else toast.error(response.error || "No se pudieron cargar docentes.");
        })
        .catch(() => toast.error("Error crítico al cargar docentes."))
        .finally(() => setIsLoadingDocentes(false));
    }
  }, [selectedAlumnoData, form]);

  const watchedFechaInicio = form.watch("fechaInicio");
  const watchedTipoPractica = form.watch("tipoPractica");

  // Efecto para sugerir fecha de término
  React.useEffect(() => {
    const fechaInicioValue = watchedFechaInicio;
    let fechaInicioDate: Date | null = null;
    if (fechaInicioValue) {
        fechaInicioDate = new Date(fechaInicioValue);
    }

    if (fechaInicioDate && !isNaN(fechaInicioDate.getTime()) && watchedTipoPractica && selectedAlumnoData?.carreraId) {
      setIsLoadingSugerenciaFechaTermino(true);
      setSuggestedFechaTermino(null); 

      sugerirFechaTerminoAction(
        format(fechaInicioDate, "yyyy-MM-dd"), // Asegura formato yyyy-MM-dd
        watchedTipoPractica as PrismaTipoPracticaEnum,
        selectedAlumnoData.carreraId
      )
      .then(response => {
        if (response.success && response.data?.fechaTerminoSugerida) {
          const parts = response.data.fechaTerminoSugerida.split('-');
          const utcDate = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
          setSuggestedFechaTermino(utcDate);
          form.setValue("fechaTermino", utcDate, { shouldValidate: true });
        } else {
          toast.error(response.error || "No se pudo sugerir la fecha de término.");
          form.resetField("fechaTermino");
        }
      })
      .catch(() => toast.error("Error crítico al sugerir fecha de término."))
      .finally(() => setIsLoadingSugerenciaFechaTermino(false));
    } else {
      setSuggestedFechaTermino(null);
    }
  }, [watchedFechaInicio, watchedTipoPractica, selectedAlumnoData, form]);

  const onSubmitPractica: SubmitHandler<IniciarPracticaInput> = async (data) => {
    if (!selectedAlumnoData?.carreraId) {
        toast.error("Información de carrera del alumno no disponible. Por favor, re-seleccione el alumno.");
        form.setError("alumnoId", { type: "manual", message: "Información de carrera no encontrada." });
        return;
    }
    setIsSubmitting(true);
    
    try {
      // Llamamos a la Server Action para iniciar la práctica
      const result: ActionResponse<PracticaConDetalles> = await iniciarPracticaAction(data, selectedAlumnoData.carreraId);

      if (result.success && result.data) {
        toast.success(`Registro de práctica para "${result.data.alumno?.usuario.nombre} ${result.data.alumno?.usuario.apellido}" iniciado exitosamente. Estado: PENDIENTE.`);
        form.reset({
            alumnoId: undefined,
            docenteId: undefined,
            tipoPractica: undefined,
            fechaInicio: undefined,
            fechaTermino: undefined,
        });
        // Limpiamos los estados relacionados
        setSelectedAlumnoData(null);
        setDocentesOptions([]);
        setSuggestedFechaTermino(null);
      } else {
        // Manejo de errores devueltos por la Server Action
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(err => {
            const fieldName = Array.isArray(err.field) ? err.field.join('.') : err.field.toString();
            if (Object.prototype.hasOwnProperty.call(form.getValues(), fieldName)) {
                 form.setError(fieldName as keyof IniciarPracticaFormValues, {
                    type: "server",
                    message: err.message,
                 });
            } else {
                 toast.error(`Error: ${err.message}`);
            }
          });
          if (Object.keys(form.formState.errors).length > 0) {
              toast.warning("Por favor corrige los errores en el formulario.");
          } else if(result.error) {
              toast.error(result.error);
          }
        } else if (result.error) {
          toast.error(result.error || "No se pudo iniciar el registro de la práctica.");
        } else {
          toast.error("Ocurrió un error desconocido al iniciar la práctica.");
        }
      }
    } catch (error) {
      console.error("Error al enviar el formulario de inicio de práctica:", error);
      toast.error("Ocurrió un error inesperado. Por favor, inténtalo más tarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>Registrar Nueva Práctica</CardTitle>
        <CardDescription>
          Complete los datos iniciales del Acta 1. La fecha de término es
          sugerida y puede ser modificada.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitPractica)}>
          <CardContent className="space-y-6 p-6">
            <FormField
              control={form.control}
              name="alumnoId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Alumno <span className="text-red-500">*</span>
                  </FormLabel>
                  <Popover
                    open={alumnoPopoverOpen}
                    onOpenChange={setAlumnoPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={alumnoPopoverOpen}
                          className={cn(
                            "w-full justify-between font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoadingAlumnos || isSubmitting}
                        >
                          {isLoadingAlumnos
                            ? "Cargando alumnos..."
                            : field.value
                              ? alumnosOptions
                                  .find((opt) => opt.value === field.value)
                                  ?.label.split(" - Carrera:")[0]
                              : "Seleccionar alumno..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                      <Command
                        filter={(itemValue, search) =>
                          alumnosOptions
                            .find((opt) => opt.value.toString() === itemValue)
                            ?.label.toLowerCase()
                            .includes(search.toLowerCase())
                            ? 1
                            : 0
                        }
                      >
                        <CommandInput placeholder="Buscar alumno por nombre, RUT, carrera..." />
                        <CommandList>
                          <CommandEmpty>
                            {isLoadingAlumnos
                              ? "Cargando..."
                              : "No se encontraron alumnos."}
                          </CommandEmpty>
                          <CommandGroup>
                            {alumnosOptions.map((option) => (
                              <CommandItem
                                value={option.value.toString()}
                                key={option.value}
                                onSelect={() => {
                                  form.setValue("alumnoId", option.value, {
                                    shouldValidate: true,
                                  });
                                  setSelectedAlumnoData(option);
                                  setAlumnoPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    option.value === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
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

            {selectedAlumnoData && (
              <div className="space-y-1">
                <FormLabel className="text-sm">
                  Información de Carrera
                </FormLabel>
                <div className="p-3 border rounded-md bg-slate-50 dark:bg-slate-800/50 text-sm">
                  <p>
                    <strong>Carrera:</strong>{" "}
                    {selectedAlumnoData.carreraNombre}
                  </p>
                  <p>
                    <strong>Sede:</strong>{" "}
                    {selectedAlumnoData.sedeNombreDeCarrera}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (ID Carrera: {selectedAlumnoData.carreraId} - Horas Lab:{" "}
                    {selectedAlumnoData.carreraHorasLaboral}, Prof:{" "}
                    {selectedAlumnoData.carreraHorasProfesional})
                  </p>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="tipoPractica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tipo de Práctica <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value} // RHF maneja el valor aquí
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(PrismaTipoPracticaEnum).map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo === PrismaTipoPracticaEnum.LABORAL
                            ? "Práctica Laboral"
                            : "Práctica Profesional"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fechaInicio"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Fecha de Inicio <span className="text-red-500">*</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isSubmitting}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP", { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setDate(new Date().getDate() - 1)) || // No fechas de ayer o antes
                          isSubmitting
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fechaTermino"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Fecha de Término (Confirmar/Modificar){" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isSubmitting || isLoadingSugerenciaFechaTermino}
                        >
                          {isLoadingSugerenciaFechaTermino
                            ? "Calculando sugerencia..."
                            : field.value
                              ? format(new Date(field.value), "PPP", { locale: es })
                              : <span>Seleccionar fecha</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          (watchedFechaInicio &&
                            date < new Date(watchedFechaInicio)) ||
                          isSubmitting
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {suggestedFechaTermino && !isLoadingSugerenciaFechaTermino && (
                    <FormDescription className="mt-1 text-xs">
                      Fecha sugerida:{" "}
                      {format(suggestedFechaTermino, "PPP", { locale: es })}.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="docenteId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Docente Tutor <span className="text-red-500">*</span>
                  </FormLabel>
                  <Popover
                    open={docentePopoverOpen}
                    onOpenChange={setDocentePopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={docentePopoverOpen}
                          className={cn(
                            "w-full justify-between font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={
                            !selectedAlumnoData ||
                            isLoadingDocentes ||
                            isSubmitting
                          }
                        >
                          {isLoadingDocentes
                            ? "Cargando docentes..."
                            : field.value
                              ? docentesOptions.find(
                                  (opt) => opt.value === field.value
                                )?.label
                              : selectedAlumnoData
                                ? "Seleccionar docente..."
                                : "Seleccione un alumno primero"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                      <Command
                        filter={(itemValue, search) =>
                          docentesOptions
                            .find((opt) => opt.value.toString() === itemValue)
                            ?.label.toLowerCase()
                            .includes(search.toLowerCase())
                            ? 1
                            : 0
                        }
                      >
                        <CommandInput placeholder="Buscar docente..." />
                        <CommandList>
                          <CommandEmpty>
                            {isLoadingDocentes
                              ? "Cargando..."
                              : selectedAlumnoData
                                ? "No se encontraron docentes."
                                : "Seleccione un alumno."}
                          </CommandEmpty>
                          <CommandGroup>
                            {docentesOptions.map((option) => (
                              <CommandItem
                                value={option.value.toString()}
                                key={option.value}
                                onSelect={() => {
                                  form.setValue("docenteId", option.value, {
                                    shouldValidate: true,
                                  });
                                  setDocentePopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    option.value === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
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
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingAlumnos ||
                isLoadingDocentes ||
                isLoadingSugerenciaFechaTermino
              }
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting
                ? "Iniciando Práctica..."
                : "Iniciar Registro y Notificar Alumno"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}