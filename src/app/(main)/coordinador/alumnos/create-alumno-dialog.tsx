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
import { CreateAlumnoSchema, type CreateAlumnoFormData } from '@/lib/validators';
import { createAlumnoAction } from './actions';

type Carrera = {
  id: number;
  nombre: string;
};

export function CreateAlumnoDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carreras, setCarreras] = useState<readonly Carrera[]>([]);

  const form = useForm<CreateAlumnoFormData>({
    resolver: zodResolver(CreateAlumnoSchema),
    defaultValues: {
      rut: '',
      nombre: '',
      apellido: '',
      carreraId: undefined,
    },
  });

  useEffect(() => {
    async function loadCarreras() {
      try {
        const response = await fetch('/api/carreras');
        const data = await response.json();
        setCarreras(data);
      } catch (error) {
        console.error('Error al cargar carreras:', error);
        toast.error('Error al cargar las carreras');
      }
    }
    
    if (open) {
      loadCarreras();
    }
  }, [open]);

  const onSubmit = async (data: CreateAlumnoFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      const response = await createAlumnoAction(undefined, formData);

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
              form.setError(field as keyof CreateAlumnoFormData, {
                type: 'server',
                message: messages.join(' '),
              });
            }
          });
        } else {
          toast.error(response.message || 'Error al crear el alumno');
        }
      }
    } catch (error) {
      console.error('Error al crear alumno:', error);
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
          Registrar Alumno
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Alumno</DialogTitle>
          <DialogDescription>
            Complete los datos para registrar un nuevo alumno en el sistema.
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
              name="carreraId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carrera</FormLabel>
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(value) => field.onChange(Number(value))}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una carrera" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {carreras.map(carrera => (
                        <SelectItem key={carrera.id} value={carrera.id.toString()}>
                          {carrera.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Seleccione la carrera del alumno
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Registrando...' : 'Registrar Alumno'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
