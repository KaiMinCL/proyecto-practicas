'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Edit, Building2 } from 'lucide-react';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UpdateCentroSchema, type UpdateCentroFormData } from '@/lib/validators/centro';

interface Empleador {
  id: number;
  nombre: string;
  email: string;
}

interface CentroPractica {
  id: number;
  nombreEmpresa: string;
  giro?: string;
  direccion?: string;
  telefono?: string;
  emailGerente?: string;
  empleadores: Empleador[];
  cantidadPracticas: number;
}

interface EditCentroDialogProps {
  centro: CentroPractica;
  onSuccess: () => void;
}

export function EditCentroDialog({ centro, onSuccess }: EditCentroDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateCentroFormData>({
    resolver: zodResolver(UpdateCentroSchema),
    defaultValues: {
      id: centro.id,
      nombreEmpresa: centro.nombreEmpresa,
      giro: centro.giro || '',
      direccion: centro.direccion || '',
      telefono: centro.telefono || '',
      emailGerente: centro.emailGerente || '',
    },
  });

  // Actualizar los valores del formulario cuando cambie el centro
  useEffect(() => {
    form.reset({
      id: centro.id,
      nombreEmpresa: centro.nombreEmpresa,
      giro: centro.giro || '',
      direccion: centro.direccion || '',
      telefono: centro.telefono || '',
      emailGerente: centro.emailGerente || '',
    });
  }, [centro, form]);

  const onSubmit = async (data: UpdateCentroFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/centros/${centro.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message);
        setOpen(false);
        onSuccess();
      } else {
        toast.error(result.error || 'Error al actualizar centro de práctica');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar centro de práctica');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#007F7C]" />
            Editar Centro de Práctica
          </DialogTitle>
          <DialogDescription>
            Modifica la información del centro de práctica <strong>{centro.nombreEmpresa}</strong>.
            Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form id="edit-centro-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            {/* Información de empleadores asociados */}
            {centro.empleadores && centro.empleadores.length > 0 && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Empleadores Asociados ({centro.empleadores.length})
                </h4>
                <div className="space-y-2">
                  {centro.empleadores.map((empleador) => (
                    <div key={empleador.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{empleador.nombre}</span>
                      <span className="text-gray-500">{empleador.email}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Para gestionar los empleadores asociados, use la función &quot;Asociar Empleador&quot; en la tabla principal.
                </p>
              </div>
            )}
          </form>
        </Form>

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
            form="edit-centro-form"
            disabled={isSubmitting}
            className="bg-[#007F7C] hover:bg-[#006B68]"
          >
            {isSubmitting ? 'Actualizando...' : 'Actualizar Centro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
