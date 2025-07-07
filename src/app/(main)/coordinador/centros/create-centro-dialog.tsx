'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Building2, User } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreateCentroSchema, type CreateCentroFormData } from '@/lib/validators/centro';

interface Empleador {
  id: number;
  usuario: {
    nombre: string;
    apellido: string;
    email: string;
  };
}

interface CreateCentroDialogProps {
  onSuccess: () => void;
}

export function CreateCentroDialog({ onSuccess }: CreateCentroDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [empleadores, setEmpleadores] = useState<Empleador[]>([]);
  const [loadingEmpleadores, setLoadingEmpleadores] = useState(false);

  const form = useForm<CreateCentroFormData>({
    resolver: zodResolver(CreateCentroSchema),
    defaultValues: {
      nombreEmpresa: '',
      giro: '',
      direccion: '',
      telefono: '',
      emailGerente: '',
      crearNuevoEmpleador: false,
      empleadorExistenteId: undefined,
      nuevoEmpleador: undefined,
    },
  });

  const crearNuevoEmpleador = form.watch('crearNuevoEmpleador');

  // Cargar empleadores cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      loadEmpleadores();
    }
  }, [open]);

  const loadEmpleadores = async () => {
    setLoadingEmpleadores(true);
    try {
      const response = await fetch('/api/empleadores');
      if (response.ok) {
        const data = await response.json();
        setEmpleadores(data.empleadores || []);
      }
    } catch (error) {
      console.error('Error al cargar empleadores:', error);
    } finally {
      setLoadingEmpleadores(false);
    }
  };

  const onSubmit = async (data: CreateCentroFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/centros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message);
        form.reset({
          nombreEmpresa: '',
          giro: '',
          direccion: '',
          telefono: '',
          emailGerente: '',
          crearNuevoEmpleador: false,
          empleadorExistenteId: undefined,
          nuevoEmpleador: undefined,
        });
        setOpen(false);
        onSuccess();
      } else {
        toast.error(result.error || 'Error al crear centro de práctica');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear centro de práctica');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resetear campos cuando cambia la opción de crear nuevo empleador
  useEffect(() => {
    if (crearNuevoEmpleador) {
      form.setValue('empleadorExistenteId', undefined);
      form.setValue('nuevoEmpleador', {
        rut: '',
        nombre: '',
        apellido: '',
        email: '',
      });
    } else {
      form.setValue('nuevoEmpleador', undefined);
    }
  }, [crearNuevoEmpleador, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#007F7C] hover:bg-[#006B68]">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Centro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#007F7C]" />
            Crear Nuevo Centro de Práctica
          </DialogTitle>
          <DialogDescription>
            Complete la información del centro de práctica y asigne un empleador como contacto.
            Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información del Centro */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Información del Centro</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="nombreEmpresa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Empresa *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Empresa ABC S.A." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="giro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giro</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Tecnología, Retail, Servicios" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono Principal</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: +56 2 2345 6789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="direccion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Av. Principal 123, Comuna, Ciudad" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="emailGerente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Gerente</FormLabel>
                      <FormControl>
                        <Input placeholder="gerente@empresa.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Empleador de Contacto */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Empleador de Contacto *</h3>
              
              <FormField
                control={form.control}
                name="crearNuevoEmpleador"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={field.value ? "nuevo" : "existente"}
                        onValueChange={(value) => field.onChange(value === "nuevo")}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="existente" id="existente" />
                          <Label htmlFor="existente">Seleccionar empleador existente</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="nuevo" id="nuevo" />
                          <Label htmlFor="nuevo">Crear nuevo empleador</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!crearNuevoEmpleador && (
                <FormField
                  control={form.control}
                  name="empleadorExistenteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empleador Existente *</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value?.toString()} 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          disabled={loadingEmpleadores}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={loadingEmpleadores ? "Cargando..." : "Seleccione un empleador"} />
                          </SelectTrigger>
                          <SelectContent>
                            {empleadores.map((empleador) => (
                              <SelectItem key={empleador.id} value={empleador.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span>
                                    {empleador.usuario.nombre} {empleador.usuario.apellido} 
                                    <span className="text-gray-500 ml-2">({empleador.usuario.email})</span>
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Seleccione un empleador registrado para que sea el contacto de este centro
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {crearNuevoEmpleador && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <h4 className="text-md font-medium text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Datos del Nuevo Empleador
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nuevoEmpleador.rut"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RUT *</FormLabel>
                          <FormControl>
                            <Input placeholder="12345678-9" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nuevoEmpleador.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input placeholder="contacto@empresa.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nuevoEmpleador.nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre *</FormLabel>
                          <FormControl>
                            <Input placeholder="Juan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nuevoEmpleador.apellido"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellido *</FormLabel>
                          <FormControl>
                            <Input placeholder="Pérez" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#007F7C] hover:bg-[#006B68]"
              >
                {isSubmitting ? 'Creando...' : 'Crear Centro'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
