'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CreateCentroSchema, type CreateCentroFormData } from '@/lib/validators/centro';

interface CreateCentroDialogProps {
  onSuccess: () => void;
}

export function CreateCentroDialog({ onSuccess }: CreateCentroDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateCentroFormData>({
    resolver: zodResolver(CreateCentroSchema),
    defaultValues: {
      nombreEmpresa: '',
      giro: '',
      direccion: '',
      telefono: '',
      emailGerente: '',
      nombreContacto: '',
      emailContacto: '',
      telefonoContacto: '',
    },
  });

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
        setOpen(false);
        form.reset();
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#007F7C] hover:bg-[#006B68] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Centro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Centro de Práctica</DialogTitle>
          <DialogDescription>
            Registra un nuevo centro donde los alumnos pueden realizar sus prácticas.
            Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              <FormField
                control={form.control}
                name="nombreContacto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Contacto Práctica</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Juan Pérez" {...field} />
                    </FormControl>
                    <FormDescription>
                      Persona responsable de las prácticas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailContacto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Contacto</FormLabel>
                    <FormControl>
                      <Input placeholder="contacto@empresa.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefonoContacto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono Contacto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: +56 9 8765 4321" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
