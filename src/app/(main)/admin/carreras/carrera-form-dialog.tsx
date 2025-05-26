"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Save, XCircle, ChevronsUpDown, Check } from "lucide-react";
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

import { carreraSchema, type CarreraInput } from "@/lib/validators/carrera";
import { getActiveSedesAction, type ActionResponse } from './actions';

type CarreraFormInputValues = z.input<typeof carreraSchema>;
type ActiveSedeOption = { label: string; value: number };

interface CarreraFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: CarreraInput & { id?: number };
}

export function CarreraFormDialog({ open, onOpenChange, initialData }: CarreraFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeSedes, setActiveSedes] = React.useState<ActiveSedeOption[]>([]);
  const [isSedesLoading, setIsSedesLoading] = React.useState(true); 
  const [sedePopoverOpen, setSedePopoverOpen] = React.useState(false);

  const formMode = initialData?.id ? 'edit' : 'create';

  const form = useForm<CarreraFormInputValues, any, CarreraInput>({
    resolver: zodResolver(carreraSchema),
  });

  React.useEffect(() => {
    if (open) {
      setIsSedesLoading(true);
      getActiveSedesAction()
        .then(response => {
          if (response.success && response.data) {
            setActiveSedes(response.data.map(sede => ({ label: sede.nombre, value: sede.id })));
          } else {
            toast.error(response.error || "No se pudieron cargar las sedes activas.");
            setActiveSedes([]);
          }
        })
        .catch(err => {
          toast.error("Error crítico al cargar sedes activas.");
          console.error(err);
        })
        .finally(() => setIsSedesLoading(false));

      // Configurar valores del formulario
      if (formMode === 'edit' && initialData) {
        form.reset({
          nombre: initialData.nombre,
          sedeId: initialData.sedeId,
          horasPracticaLaboral: initialData.horasPracticaLaboral,
          horasPracticaProfesional: initialData.horasPracticaProfesional,
        });
      } else { // Modo creación
        form.reset({
          nombre: "",
          sedeId: undefined, // Para que el placeholder del combobox funcione
          horasPracticaLaboral: undefined,
          horasPracticaProfesional: undefined,
        });
      }
      form.clearErrors();
    }
  }, [open, formMode, initialData, form]);

  const onSubmitCarreraForm: SubmitHandler<CarreraInput> = async (data) => {
    setIsSubmitting(true);
    console.log(`Valores del formulario (Carrera a ${formMode === 'edit' ? 'Editar' : 'Crear'} - UI):`, data);
    // Lógica de envío a Server Action en el próximo commit
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simular
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const dialogTitle = formMode === 'edit' ? "Editar Carrera" : "Crear Nueva Carrera";
  const submitButtonText = formMode === 'edit' ? "Guardar Cambios" : "Guardar Carrera";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (isSubmitting && !isOpen) return;
      onOpenChange(isOpen);
    }}>
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
                      <Command>
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
                    <FormControl><Input type="number" placeholder="Ej: 240" {...field} value={field.value ?? ''} disabled={isSubmitting} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} /></FormControl>
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
                    <FormControl><Input type="number" placeholder="Ej: 360" {...field} value={field.value ?? ''} disabled={isSubmitting} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)}/></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                <XCircle className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || isSedesLoading}>
                <Save className="mr-2 h-4 w-4" /> {isSubmitting ? "Guardando..." : submitButtonText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}