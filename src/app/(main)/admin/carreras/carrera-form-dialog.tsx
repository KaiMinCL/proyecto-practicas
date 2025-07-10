"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Save, XCircle, ChevronsUpDown, Check } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { carreraSchema, type CarreraInput, type Carrera as FullCarreraType } from "@/lib/validators/carrera";
import { 
    getActiveSedesAction, 
    createCarreraAction, 
    updateCarreraAction,
    type ActionResponse 
} from './actions';

type CarreraFormInputValues = z.input<typeof carreraSchema>;
type ActiveSedeOption = { label: string; value: number };

interface CarreraFormDialogProps {
  initialData?: CarreraInput & { id?: number };
  children: React.ReactNode;
}

export function CarreraFormDialog({ initialData, children }: CarreraFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeSedes, setActiveSedes] = React.useState<ActiveSedeOption[]>([]);
  const [isSedesLoading, setIsSedesLoading] = React.useState(true);
  const [sedePopoverOpen, setSedePopoverOpen] = React.useState(false);
  const router = useRouter();

  const formMode = initialData?.id ? 'edit' : 'create';
  const form = useForm<CarreraFormInputValues, unknown, CarreraInput>({
    resolver: zodResolver(carreraSchema),
  });

  React.useEffect(() => {
    if (open) {
      setIsSedesLoading(true);
      getActiveSedesAction()
        .then(response => {
          if (response.success && response.data) {
            setActiveSedes(response.data.map(s => ({ label: s.nombre, value: s.id })));
          } else {
            toast.error(response.error || "No se pudieron cargar las sedes activas.");
          }
        })
        .catch(() => toast.error("Error crítico al cargar sedes."))
        .finally(() => setIsSedesLoading(false));

      if (formMode === 'edit' && initialData) {
        form.reset({
          nombre: initialData.nombre,
          sedeId: initialData.sedeId,
          horasPracticaLaboral: initialData.horasPracticaLaboral,
          horasPracticaProfesional: initialData.horasPracticaProfesional,
        });
      } else {
        form.reset({
          nombre: "",
          sedeId: undefined,
          horasPracticaLaboral: undefined,
          horasPracticaProfesional: undefined,
        });
      }
      form.clearErrors();
    }
  }, [open, formMode, initialData, form]);

  const onSubmitCarreraForm: SubmitHandler<CarreraInput> = async (data) => {
    setIsSubmitting(true);
    try {
      let result: ActionResponse<FullCarreraType>;

      if (formMode === 'edit' && initialData?.id) {
        result = await updateCarreraAction(initialData.id.toString(), data);
      } else { 
        result = await createCarreraAction(data);
      }

      if (result.success && result.data) {
        toast.success(
          formMode === 'edit'
            ? `Carrera "${result.data.nombre}" actualizada exitosamente.`
            : `Carrera "${result.data.nombre}" creada exitosamente.`
        );
        setOpen(false);
        router.refresh();
      } else {
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(err => {
            const fieldName = Array.isArray(err.field) ? err.field.join('.') : err.field.toString();
            if (Object.prototype.hasOwnProperty.call(form.getValues(), fieldName)) {
                form.setError(fieldName as keyof CarreraFormInputValues, {
                  type: "server",
                  message: err.message,
                });
            } else {
                toast.error(`Error: ${err.message}`);
            }
          });
          if (Object.keys(form.formState.errors).length > 0) {
              toast.warning("Por favor, corrige los errores en el formulario.");
          } else if(result.error) {
              toast.error(result.error);
          }
        } else if (result.error) {
          toast.error(result.error || `No se pudo ${formMode === 'edit' ? 'actualizar' : 'crear'} la carrera.`);
        }
      }
    } catch (error) {
      console.error(`Error al enviar el formulario de carrera en modo ${formMode}:`, error);
      toast.error("Ocurrió un error inesperado. Por favor, inténtalo más tarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogTitle = formMode === 'edit' ? "Editar Carrera" : "Crear Nueva Carrera";
  const submitButtonText = formMode === 'edit' ? "Guardar Cambios" : "Guardar Carrera";
  const submittingButtonText = formMode === 'edit' ? "Guardando Cambios..." : "Guardando...";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (isSubmitting && !isOpen) return;
      setOpen(isOpen);
    }}>
        <DialogTrigger asChild>
            {children}
        </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {formMode === 'edit' 
              ? `Editando la carrera: "${initialData?.nombre}". Modifica los detalles necesarios.`
              : "Completa los detalles de la nueva carrera."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitCarreraForm)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Carrera</FormLabel>
                  <FormControl><Input placeholder="Ej: Ingeniería en Informática" {...field} value={field.value ?? ''} disabled={isSubmitting} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sedeId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Sede Asociada</FormLabel>
                  <Popover open={sedePopoverOpen} onOpenChange={setSedePopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={sedePopoverOpen}
                          className={cn("w-full justify-between font-normal", !field.value && "text-muted-foreground")}
                          disabled={isSedesLoading || isSubmitting}
                        >
                          {isSedesLoading
                            ? "Cargando sedes..."
                            : field.value
                              ? activeSedes.find(sede => sede.value === field.value)?.label
                              : "Seleccionar sede..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                      <Command filter={(value, search) => value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0}>
                        <CommandInput placeholder="Buscar sede..." />
                        <CommandList>
                          <CommandEmpty>{isSedesLoading ? "Cargando..." : "No se encontraron sedes."}</CommandEmpty>
                          <CommandGroup>
                            {activeSedes.map((sede) => (
                              <CommandItem
                                value={sede.label}
                                key={sede.value}
                                onSelect={() => {
                                  form.setValue("sedeId", sede.value, { shouldValidate: true });
                                  setSedePopoverOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", sede.value === field.value ? "opacity-100" : "opacity-0")} />
                                {sede.label}
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="horasPracticaLaboral"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas P. Laboral</FormLabel>
                    <FormControl><Input type="number" placeholder="Ej: 240" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="horasPracticaProfesional"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas P. Profesional</FormLabel>
                    <FormControl><Input type="number" placeholder="Ej: 360" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} disabled={isSubmitting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                <XCircle className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || (formMode === 'create' && isSedesLoading)}>
                <Save className="mr-2 h-4 w-4" /> {isSubmitting ? submittingButtonText : submitButtonText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}