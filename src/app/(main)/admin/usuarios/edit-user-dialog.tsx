'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { UpdateUserSchema, type UpdateUserFormData } from '@/lib/validators';
import { useRouter } from 'next/navigation';
import { getUserAction, updateUserAction } from './actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil } from 'lucide-react';

interface EditUserDialogProps {
  userId: number;
}

export function EditUserDialog({ userId }: EditUserDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sedes, setSedes] = useState<Array<{ id: number; nombre: string }>>([]);

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {
      id: userId,
      nombre: '',
      apellido: '',
      email: '',
      rol: 'DOCENTE',
      sedeId: undefined,
    },
  });

  // Cargar datos del usuario al abrir el diálogo
  useEffect(() => {
    async function loadUserData() {
      const user = await getUserAction(userId);
      if (user) {
        // Mapear el rol recibido a los valores del enum
        let rolValue: 'DIRECTOR_CARRERA' | 'COORDINADOR' | 'DOCENTE' = 'DOCENTE';
        switch ((user.rol.nombre || '').toUpperCase()) {
          case 'DIRECTOR_CARRERA':
          case 'DIRECTOR CARRERA':
          case 'DIRECTOR':
            rolValue = 'DIRECTOR_CARRERA';
            break;
          case 'COORDINADOR':
            rolValue = 'COORDINADOR';
            break;
          case 'DOCENTE':
            rolValue = 'DOCENTE';
            break;
        }
        form.reset({
          id: user.id,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          rol: rolValue,
          sedeId: user.sedeId ?? undefined,
        });
      }
    }

    async function loadSedes() {
      const response = await fetch('/api/sedes');
      const data = await response.json();
      // Si la respuesta es { sedes: [...] }, usar data.sedes, si no, usar data directamente
      setSedes(Array.isArray(data) ? data : data.sedes || []);
    }
    
    if (open) {
      loadUserData();
      loadSedes();
    }
  }, [open, userId, form]);

  const onSubmit = async (data: UpdateUserFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('id', userId.toString());
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'id') return;
        formData.append(key, value.toString());
      });

      const response = await updateUserAction(undefined, formData);

      if (response.success) {
        toast.success(response.message);
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
              form.setError(field as keyof UpdateUserFormData, {
                type: 'server',
                message: messages.join(' '),
              });
            }
          });
        } else {
          toast.error(response.message || 'Error al actualizar el usuario');
        }
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-600">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Usuario
          </DialogTitle>
          <DialogDescription>
            Actualice los datos del usuario. Nota: El RUT no se puede modificar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="rol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
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
                      <SelectItem value="DIRECTOR_CARRERA">Director de Carrera</SelectItem>
                      <SelectItem value="COORDINADOR">Coordinador</SelectItem>
                      <SelectItem value="DOCENTE">Docente</SelectItem>
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
                  <FormLabel>Sede</FormLabel>
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
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Guardar Cambios
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
