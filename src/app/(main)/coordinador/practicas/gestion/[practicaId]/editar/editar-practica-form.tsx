"use client";

import React from "react";
import { useRouter } from "next/navigation";
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
    FormField, 
    FormItem, 
    FormLabel, 
    FormMessage, 
    FormDescription 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronsUpDown, Save, CalendarIcon, ExternalLink, Settings, User as UserIcon, Building, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { 
    editarPracticaCoordDCSchema, 
    type EditarPracticaCoordDCInput,
    type PracticaConDetalles 
} from "@/lib/validators/practica";

// Asegúrate que la ruta a las actions sea correcta
import { 
    getDocentesParaFormAction,
    sugerirFechaTerminoAction,   
    updatePracticaCoordDCAction, // <--- Acción para actualizar la práctica
    type DocenteOption,
    type ActionResponse 
} from '../../../actions'; 
import { TipoPractica as PrismaTipoPracticaEnum, EstadoPractica as PrismaEstadoPracticaEnum } from "@prisma/client";

interface EditarPracticaFormProps {
  practicaOriginal: PracticaConDetalles;
}

// Tipo para los valores de ENTRADA del formulario (antes de la transformación de Zod)
type FormInputValues = z.input<typeof editarPracticaCoordDCSchema>;
// El tipo de SALIDA del schema Zod (después de transformaciones) es EditarPracticaCoordDCInput

// Componente InfoDisplay para mostrar datos no editables
const InfoDisplay: React.FC<{ label: string; value?: string | number | boolean | null | Date; isDate?: boolean; isBoolean?: boolean; isList?: boolean;}> = ({ label, value, isDate, isBoolean, isList }) => {
    let displayValue: React.ReactNode;
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
      displayValue = <span className="text-muted-foreground italic">No provisto</span>;
    } else if (isDate && value instanceof Date) {
      displayValue = format(new Date(value), "PPP", { locale: es });
    } else if (isBoolean) {
      displayValue = value ? 'Sí' : 'No';
    } else if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
      displayValue = <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{value} <ExternalLink className="inline h-3 w-3 ml-1"/></a>;
    } else if (isList && typeof value === 'string') {
      displayValue = <div className="whitespace-pre-wrap">{value}</div>;
    } else {
      displayValue = value.toString();
    }
    return ( <div className="py-1"> <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</dt> <dd className="mt-0.5 text-sm text-gray-900 dark:text-gray-100">{displayValue}</dd> </div> );
};


export function EditarPracticaForm({ practicaOriginal }: EditarPracticaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const [docentesOptions, setDocentesOptions] = React.useState<DocenteOption[]>([]);
  const [isLoadingDocentes, setIsLoadingDocentes] = React.useState(true);
  const [docentePopoverOpen, setDocentePopoverOpen] = React.useState(false);

  const [suggestedFechaTermino, setSuggestedFechaTermino] = React.useState<Date | null>(null);
  const [isLoadingSugerenciaFechaTermino, setIsLoadingSugerenciaFechaTermino] = React.useState(false);

  const tipoPracticaActual = practicaOriginal.tipo;
  const carreraIdActual = practicaOriginal.carreraId;

  const form = useForm<FormInputValues, any, EditarPracticaCoordDCInput>({
    resolver: zodResolver(editarPracticaCoordDCSchema),
    defaultValues: {
      docenteId: practicaOriginal.docenteId ?? undefined,
      fechaInicio: practicaOriginal.fechaInicio ? new Date(practicaOriginal.fechaInicio) : undefined,
      fechaTermino: practicaOriginal.fechaTermino ? new Date(practicaOriginal.fechaTermino) : undefined,
      estado: practicaOriginal.estado ?? undefined,
      direccionCentro: practicaOriginal.direccionCentro ?? "",
      departamento: practicaOriginal.departamento ?? "",
      nombreJefeDirecto: practicaOriginal.nombreJefeDirecto ?? "",
      cargoJefeDirecto: practicaOriginal.cargoJefeDirecto ?? "",
      contactoCorreoJefe: practicaOriginal.contactoCorreoJefe ?? "",
      contactoTelefonoJefe: practicaOriginal.contactoTelefonoJefe ?? "",
      practicaDistancia: practicaOriginal.practicaDistancia ?? false,
      tareasPrincipales: practicaOriginal.tareasPrincipales ?? "",
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    if (carreraIdActual) {
      setIsLoadingDocentes(true);
      getDocentesParaFormAction({ carreraId: carreraIdActual })
        .then(response => {
          if (response.success && response.data) setDocentesOptions(response.data);
          else toast.error(response.error || "No se pudieron cargar los docentes.");
        })
        .catch(() => toast.error("Error crítico al cargar docentes."))
        .finally(() => setIsLoadingDocentes(false));
    }
  }, [carreraIdActual]);

  const watchedFechaInicio = form.watch("fechaInicio");

  React.useEffect(() => {
    const fechaInicioValue = watchedFechaInicio;
    let fechaInicioDate: Date | null = null;
    if (fechaInicioValue) {
        fechaInicioDate = new Date(fechaInicioValue);
    }

    if (fechaInicioDate && !isNaN(fechaInicioDate.getTime()) && tipoPracticaActual && carreraIdActual) {
      setIsLoadingSugerenciaFechaTermino(true);
      setSuggestedFechaTermino(null);
      sugerirFechaTerminoAction(format(fechaInicioDate, "yyyy-MM-dd"), tipoPracticaActual, carreraIdActual)
      .then(response => {
        if (response.success && response.data?.fechaTerminoSugerida) {
          const parts = response.data.fechaTerminoSugerida.split('-');
          const utcDate = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
          setSuggestedFechaTermino(utcDate);
          // No pre-llenamos fechaTermino aquí para que el usuario decida. Solo mostramos sugerencia.
        } else { console.warn(response.error || "No se pudo re-sugerir fecha de término."); }
      })
      .catch(() => console.warn("Error crítico al re-sugerir fecha de término."))
      .finally(() => setIsLoadingSugerenciaFechaTermino(false));
    } else { setSuggestedFechaTermino(null); }
  }, [watchedFechaInicio, tipoPracticaActual, carreraIdActual]);

  const onSubmit: SubmitHandler<EditarPracticaCoordDCInput> = async (data) => {
    setIsSubmitting(true);
    try {
      const result: ActionResponse<PracticaConDetalles> = await updatePracticaCoordDCAction(practicaOriginal.id, data);

      if (result.success && result.data) {
        toast.success(result.message || "Práctica actualizada exitosamente.");
        // Resetea el formulario con los nuevos datos del servidor para limpiar 'isDirty' y reflejar cambios.
        form.reset({
            docenteId: result.data.docenteId ?? undefined,
            fechaInicio: result.data.fechaInicio ? new Date(result.data.fechaInicio) : undefined,
            fechaTermino: result.data.fechaTermino ? new Date(result.data.fechaTermino) : undefined,
            estado: result.data.estado ?? undefined,
            direccionCentro: result.data.direccionCentro ?? "",
            departamento: result.data.departamento ?? "",
            nombreJefeDirecto: result.data.nombreJefeDirecto ?? "",
            cargoJefeDirecto: result.data.cargoJefeDirecto ?? "",
            contactoCorreoJefe: result.data.contactoCorreoJefe ?? "",
            contactoTelefonoJefe: result.data.contactoTelefonoJefe ?? "",
            practicaDistancia: result.data.practicaDistancia ?? false,
            tareasPrincipales: result.data.tareasPrincipales ?? "",
        });
        router.refresh(); // Refresca los datos del Server Component de la página actual
      } else {
        let serverErrorProcessed = false;
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(err => {
            if (err.field && Array.isArray(err.field) && err.field.length > 0) {
              const fieldName = err.field.join('.') as keyof FormInputValues; 
               if (Object.prototype.hasOwnProperty.call(form.getValues(), fieldName)) {
                    form.setError(fieldName, { type: "server", message: err.message });
               } else { toast.error(`Error en '${String(err.field)}': ${err.message}`); }
               serverErrorProcessed = true;
            } else if (err.message) { 
              form.setError("root.serverError", { type: "custom", message: err.message });
              serverErrorProcessed = true; 
            }
          });
        }
        if (serverErrorProcessed && Object.keys(form.formState.errors).length > 0) {
             if(!form.formState.errors.root?.serverError) {
                 toast.warning("Por favor, corrige los errores indicados en el formulario.");
             }
        } else if (result.error) { 
          toast.error(result.error || "No se pudo actualizar la práctica.");
        } else if (!serverErrorProcessed && !result.success) {
            toast.error("Ocurrió un error desconocido al actualizar la práctica.");
        }
      }
    } catch (error) {
      console.error("Error al actualizar la práctica:", error);
      toast.error("Ocurrió un error inesperado al intentar guardar los cambios.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader><CardTitle className="text-xl">Información General (No Editable)</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
              <InfoDisplay label="Alumno" value={`${practicaOriginal.alumno?.usuario.nombre} ${practicaOriginal.alumno?.usuario.apellido} (${practicaOriginal.alumno?.usuario.rut})`} />
              <InfoDisplay label="Carrera" value={practicaOriginal.carrera?.nombre} />
              <InfoDisplay label="Sede" value={practicaOriginal.carrera?.sede?.nombre} />
              <InfoDisplay label="Tipo de Práctica" value={tipoPracticaActual === PrismaTipoPracticaEnum.LABORAL ? "Laboral" : "Profesional"} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle  className="text-xl">Actualizar Datos de la Práctica</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="docenteId" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Docente Tutor Asignado</FormLabel> {/* Opcional, por lo tanto no * */}
                  <Popover open={docentePopoverOpen} onOpenChange={setDocentePopoverOpen}>
                    <PopoverTrigger asChild><FormControl>
                      <Button variant="outline" role="combobox" className={cn("w-full justify-between font-normal", !field.value && "text-muted-foreground")} disabled={isLoadingDocentes || isSubmitting}>
                        {isLoadingDocentes ? "Cargando..." : field.value ? docentesOptions.find(d => d.value === field.value)?.label : "Seleccionar docente..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button></FormControl></PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0"><Command filter={(itemVal, search) => docentesOptions.find(opt=>opt.value.toString()===itemVal)?.label.toLowerCase().includes(search.toLowerCase())?1:0}><CommandInput placeholder="Buscar docente..." /><CommandList><CommandEmpty>No hay docentes.</CommandEmpty><CommandGroup>{docentesOptions.map(opt => (<CommandItem value={opt.value.toString()} key={opt.value} onSelect={() => {form.setValue("docenteId", opt.value, {shouldValidate:true}); setDocentePopoverOpen(false);}}><Check className={cn("mr-2 h-4 w-4", opt.value === field.value ? "opacity-100":"opacity-0")} />{opt.label}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent>
                  </Popover><FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="estado" render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado de la Práctica</FormLabel> {/* Opcional */}
                  <Select onValueChange={field.onChange} value={field.value ?? undefined} disabled={isSubmitting}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar estado..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.values(PrismaEstadoPracticaEnum).map(s => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="fechaInicio" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Fecha de Inicio</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isSubmitting}>{field.value ? format(new Date(field.value), "PPP", {locale:es}) : <span>Seleccionar fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={field.onChange} disabled={(date) => date < new Date("1900-01-01") || isSubmitting} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="fechaTermino" render={({ field }) => (
                  <FormItem className="flex flex-col"><FormLabel>Fecha de Término</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")} disabled={isSubmitting || isLoadingSugerenciaFechaTermino}>{isLoadingSugerenciaFechaTermino ? "Calculando..." : field.value ? format(new Date(field.value), "PPP", {locale:es}) : <span>Seleccionar fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={field.onChange} disabled={(date) => (watchedFechaInicio && date < new Date(watchedFechaInicio)) || isSubmitting} initialFocus /></PopoverContent></Popover>{suggestedFechaTermino && !isLoadingSugerenciaFechaTermino && (<FormDescription className="mt-1 text-xs">Sugerencia: {format(suggestedFechaTermino, "PPP", {locale:es})}</FormDescription>)}<FormMessage /></FormItem>
              )}/>
            </div>
            
            <h4 className="text-md font-semibold text-gray-600 dark:text-gray-300 pt-4 border-t mt-6">Datos del Centro de Práctica (Editables)</h4>
            <FormField control={form.control} name="direccionCentro" render={({ field }) => (<FormItem><FormLabel>Dirección Centro Práctica</FormLabel><FormControl><Input placeholder="Dirección..." {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="departamento" render={({ field }) => (<FormItem><FormLabel>Departamento</FormLabel><FormControl><Input placeholder="Departamento..." {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem> )}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="nombreJefeDirecto" render={({ field }) => (<FormItem><FormLabel>Nombre Jefe Directo</FormLabel><FormControl><Input placeholder="Nombre..." {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem> )}/>
              <FormField control={form.control} name="cargoJefeDirecto" render={({ field }) => (<FormItem><FormLabel>Cargo Jefe Directo</FormLabel><FormControl><Input placeholder="Cargo..." {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem> )}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="contactoCorreoJefe" render={({ field }) => (<FormItem><FormLabel>Email Jefe Directo</FormLabel><FormControl><Input type="email" placeholder="Email..." {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem> )}/>
              <FormField control={form.control} name="contactoTelefonoJefe" render={({ field }) => (<FormItem><FormLabel>Teléfono Jefe Directo</FormLabel><FormControl><Input placeholder="Teléfono..." {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem> )}/>
            </div>
            <FormField control={form.control} name="practicaDistancia" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>¿Práctica a distancia?</FormLabel></div><FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} disabled={isSubmitting} /></FormControl></FormItem> )}/>
            <FormField control={form.control} name="tareasPrincipales" render={({ field }) => (<FormItem><FormLabel>Tareas Principales</FormLabel><FormControl><Textarea placeholder="Tareas..." className="min-h-[100px]" {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem> )}/>

          </CardContent>
        </Card>
        <CardFooter className="flex justify-end mt-8 border-t pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting} className="mr-2">
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || isLoadingDocentes || isLoadingSugerenciaFechaTermino || !form.formState.isDirty}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Guardando Cambios..." : "Guardar Cambios"}
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}