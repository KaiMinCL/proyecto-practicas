'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getSedesAction } from './actions';
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
import { CreateUserSchema, type CreateUserFormData } from '@/lib/validators';
import { createUserAction } from './actions';

export function CreateUserDialog() {  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [sedes, setSedes] = React.useState<Array<{ id: number; nombre: string }>>([]);

  React.useEffect(() => {
    async function loadSedes() {
      try {
        const result = await getSedesAction();
        if (result.success) {
          setSedes(result.data ?? []);
        } else {
          toast.error('Error al cargar las sedes');
        }
      } catch (error) {
        console.error('Error al cargar sedes:', error);
        toast.error('Error al cargar las sedes');
      }
    }
    
    if (open) {
      loadSedes();
    }
  }, [open]);

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      rut: '',
      nombre: '',
      apellido: '',
      email: '',
      rol: 'Docente',
      sedeId: undefined,
    },
  });

  const onSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      const response = await createUserAction(undefined, formData);

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
        // Mostrar errores específicos de campo
        if (response.errors) {
          Object.entries(response.errors).forEach(([field, messages]) => {
            if (field === 'general') {
              toast.error(messages.join(' '));
            } else {
              form.setError(field as keyof CreateUserFormData, {
                type: 'server',
                message: messages.join(' '),
              });
            }
          });
        } else {
          toast.error(response.message || 'Error al crear el usuario');
        }
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Crear Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Crear Nuevo Usuario
          </DialogTitle>
          <DialogDescription>
            Complete los datos del nuevo usuario. Se generará una contraseña inicial automáticamente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} placeholder="Ej: Juan" />
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
                    <FormLabel>Apellido *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} placeholder="Ej: Pérez" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="rut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUT *</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} placeholder="12345678-9" />
                  </FormControl>
                  <FormDescription>
                    Formato: 12345678-9 (sin puntos, con guión)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} disabled={isSubmitting} placeholder="usuario@institucion.cl" />
                  </FormControl>
                  <FormDescription>
                    Correo electrónico institucional
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DirectorCarrera">Director de Carrera</SelectItem>
                        <SelectItem value="Coordinador">Coordinador</SelectItem>
                        <SelectItem value="Docente">Docente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sedeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sede *</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(Number(value))}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una sede" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sedes.map(sede => (
                          <SelectItem key={sede.id} value={sede.id.toString()}>
                            {sede.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950/20 dark:border-blue-800">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">Información importante:</p>
                  <ul className="mt-1 text-blue-700 dark:text-blue-200 space-y-1">
                    <li>• Se generará una contraseña inicial automáticamente</li>
                    <li>• El usuario deberá cambiarla en su primer acceso</li>
                    <li>• Se validará que el RUT y email no existan previamente</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Usuario
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
