'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { UserPlus, Users, X } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { AssociateEmpleadorSchema, type AssociateEmpleadorFormData } from '@/lib/validators/centro';

interface Empleador {
  id: number;
  nombre: string;
  email: string;
}

interface EmpleadorListItem {
  id: number;
  rut: string;
  nombre: string;
  apellido: string;
  email: string;
  estado: string;
}

interface CentroPractica {
  id: number;
  nombreEmpresa: string;
  giro?: string;
  direccion?: string;
  telefono?: string;
  emailGerente?: string;
  nombreContacto?: string;
  emailContacto?: string;
  telefonoContacto?: string;
  empleadores: Empleador[];
  cantidadPracticas: number;
}

interface AssociateCentroDialogProps {
  centro: CentroPractica;
  onSuccess: () => void;
}

export function AssociateCentroDialog({ centro, onSuccess }: AssociateCentroDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [empleadores, setEmpleadores] = useState<EmpleadorListItem[]>([]);
  const [loadingEmpleadores, setLoadingEmpleadores] = useState(false);

  const form = useForm<AssociateEmpleadorFormData>({
    resolver: zodResolver(AssociateEmpleadorSchema),
    defaultValues: {
      centroPracticaId: centro.id,
      empleadorId: undefined,
    },
  });

  const fetchEmpleadores = useCallback(async () => {
    setLoadingEmpleadores(true);
    try {
      const response = await fetch('/api/empleadores');
      if (!response.ok) {
        throw new Error('Error al cargar empleadores');
      }
      const data = await response.json();
      
      // Filtrar empleadores que no estén ya asociados al centro
      const asociatedIds = centro.empleadores.map(e => e.id);
      const availableEmpleadores = data.filter((emp: EmpleadorListItem) => 
        !asociatedIds.includes(emp.id) && emp.estado === 'ACTIVO'
      );
      
      setEmpleadores(availableEmpleadores);
    } catch (error) {
      console.error('Error al cargar empleadores:', error);
      toast.error('Error al cargar empleadores disponibles');
    } finally {
      setLoadingEmpleadores(false);
    }
  }, [centro.empleadores]);

  useEffect(() => {
    if (open) {
      fetchEmpleadores();
    }
  }, [open, centro.empleadores, fetchEmpleadores]);

  const onSubmit = async (data: AssociateEmpleadorFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/centros/asociar-empleador', {
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
        form.reset({ centroPracticaId: centro.id, empleadorId: undefined });
        onSuccess();
      } else {
        toast.error(result.error || 'Error al asociar empleador');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al asociar empleador');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisassociate = async (empleadorId: number) => {
    try {
      const response = await fetch('/api/centros/asociar-empleador', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          centroPracticaId: centro.id,
          empleadorId: empleadorId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message);
        onSuccess();
      } else {
        toast.error(result.error || 'Error al desasociar empleador');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al desasociar empleador');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-[#007F7C] border-[#007F7C] hover:bg-[#007F7C] hover:text-white">
          <UserPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#007F7C]" />
            Gestionar Empleadores
          </DialogTitle>
          <DialogDescription>
            Asocia o desasocia empleadores del centro <strong>{centro.nombreEmpresa}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Empleadores asociados actuales */}
          {centro.empleadores.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Empleadores Asociados</h4>
              <div className="space-y-2">
                {centro.empleadores.map((empleador) => (
                  <div key={empleador.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div>
                      <div className="font-medium text-sm">{empleador.nombre}</div>
                      <div className="text-xs text-gray-500">{empleador.email}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisassociate(empleador.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulario para asociar nuevo empleador */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Asociar Nuevo Empleador</h4>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="empleadorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seleccionar Empleador</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        value={field.value?.toString()}
                        disabled={loadingEmpleadores}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              loadingEmpleadores 
                                ? "Cargando empleadores..." 
                                : empleadores.length === 0 
                                  ? "No hay empleadores disponibles" 
                                  : "Selecciona un empleador"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {empleadores.map((empleador) => (
                            <SelectItem key={empleador.id} value={empleador.id.toString()}>
                              <div className="flex flex-col">
                                <span>{empleador.nombre} {empleador.apellido}</span>
                                <span className="text-xs text-gray-500">{empleador.email}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {empleadores.length === 0 && !loadingEmpleadores && (
                        <p className="text-xs text-gray-500">
                          Todos los empleadores activos ya están asociados a este centro.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cerrar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || empleadores.length === 0}
                    className="bg-[#007F7C] hover:bg-[#006B68]"
                  >
                    {isSubmitting ? 'Asociando...' : 'Asociar'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
