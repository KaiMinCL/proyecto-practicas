'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateEmpleadorSchema, type CreateEmpleadorFormData } from '@/lib/validators/empleador';
import { createEmpleadorAction } from './actions';

type CentroPractica = {
  id: number;
  nombreEmpresa: string;
  direccion?: string;
};

export function CreateEmpleadorDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [centros, setCentros] = useState<readonly CentroPractica[]>([]);

  const form = useForm<CreateEmpleadorFormData>({
    resolver: zodResolver(CreateEmpleadorSchema),
    defaultValues: {
      rut: '',
      nombre: '',
      apellido: '',
      email: '',
      centroPracticaId: undefined,
    },
  });

  useEffect(() => {
    async function loadCentros() {
      try {
        const response = await fetch('/api/centros');
        const data = await response.json();
        setCentros(data);
      } catch (error) {
        console.error('Error al cargar centros:', error);
        toast.error('Error al cargar los centros de práctica');
      }
    }
    
    if (open) {
      loadCentros();
    }
  }, [open]);

  const onSubmit = async (data: CreateEmpleadorFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      const response = await createEmpleadorAction(undefined, formData);

      if (response.success) {
        toast.success(response.message);
        if (response.initialPassword) {
          toast.info(`Contraseña inicial: ${response.initialPassword}`, {
            duration: 10000,
          });
        }
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        if (response.errors) {
          Object.entries(response.errors).forEach(([field, messages]) => {
            if (field === 'general') {
              toast.error(messages.join(' '));
            } else {
              form.setError(field as keyof CreateEmpleadorFormData, {
                type: 'server',
                message: messages.join(' '),
              });
            }
          });
        } else {
          toast.error(response.message || 'Error al crear el empleador');
        }
      }
    } catch (error) {
      console.error('Error al crear empleador:', error);
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Empleador
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Empleador</DialogTitle>
          <DialogDescription>
            Complete los datos para registrar un nuevo empleador en el sistema.
            La contraseña inicial se generará automáticamente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUT</FormLabel>
                  <FormControl>
                    <Input placeholder="12345678-9" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>
                    RUT con guion y dígito verificador
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apellido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="centroPracticaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Centro de Práctica</FormLabel>
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(value) => field.onChange(Number(value))}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un centro de práctica" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {centros.map(centro => (
                        <SelectItem key={centro.id} value={centro.id.toString()}>
                          {centro.nombreEmpresa}
                          {centro.direccion && ` - ${centro.direccion}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Seleccione el centro de práctica donde trabaja el empleador
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Registrando...' : 'Registrar Empleador'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
