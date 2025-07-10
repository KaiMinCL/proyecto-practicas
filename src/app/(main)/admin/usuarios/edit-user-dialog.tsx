'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { UpdateUserSchema, type UpdateUserFormData } from '@/lib/validators';
import { useRouter } from 'next/navigation';
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
  const [tipoUsuario, setTipoUsuario] = useState<'ALUMNO' | 'DOCENTE' | 'EMPLEADOR' | null>(null);
  const [carreras, setCarreras] = useState<Array<{ id: number; nombre: string }>>([]);
  const [centros, setCentros] = useState<Array<{ id: number; nombreEmpresa: string }>>([]);
  const [userData, setUserData] = useState<any>(null);
  // Estados locales para campos específicos
  const [alumnoCarreraId, setAlumnoCarreraId] = useState<number | undefined>(undefined);
  const [alumnoFotoUrl, setAlumnoFotoUrl] = useState<string>('');
  const [docenteCarreras, setDocenteCarreras] = useState<number[]>([]);
  const [empleadorCentros, setEmpleadorCentros] = useState<number[]>([]);

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

  useEffect(() => {
    async function loadUserData() {
      const user = await fetch(`/api/usuarios/${userId}`).then(r => r.json());
      setUserData(user);
      let rolValue: 'DIRECTOR_CARRERA' | 'COORDINADOR' | 'DOCENTE' = 'DOCENTE';
      switch ((user.rol?.nombre || '').toUpperCase()) {
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
      if (user.alumno) {
        setTipoUsuario('ALUMNO');
        setAlumnoCarreraId(user.alumno.carreraId);
        setAlumnoFotoUrl(user.alumno.fotoUrl || '');
      } else if (user.docente) {
        setTipoUsuario('DOCENTE');
        setDocenteCarreras(user.docente.carreras?.map((c: any) => c.carreraId) || []);
      } else if (user.empleador) {
        setTipoUsuario('EMPLEADOR');
        setEmpleadorCentros(user.empleador.centros?.map((c: any) => c.centroPracticaId) || []);
      }
    }
    async function loadSedes() {
      const response = await fetch('/api/sedes');
      const data = await response.json();
      setSedes(Array.isArray(data) ? data : data.sedes || []);
    }
    async function loadCarreras() {
      const response = await fetch('/api/carreras');
      const data = await response.json();
      setCarreras(Array.isArray(data) ? data : data.carreras || []);
    }
    async function loadCentros() {
      const response = await fetch('/api/centros');
      const data = await response.json();
      setCentros(Array.isArray(data) ? data : data.centros || []);
    }
    if (open) {
      loadUserData();
      loadSedes();
      loadCarreras();
      loadCentros();
    }
  }, [open, userId, form]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const body: any = {
        id: userId,
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        rol: data.rol,
        sedeId: data.sedeId,
      };
      if (tipoUsuario === 'ALUMNO') {
        body.carreraId = alumnoCarreraId;
        body.fotoUrl = alumnoFotoUrl;
      }
      if (tipoUsuario === 'DOCENTE') {
        body.carreras = docenteCarreras;
      }
      if (tipoUsuario === 'EMPLEADOR') {
        body.centros = empleadorCentros;
      }
      const response = await fetch('/api/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast.success(result.message);
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(result.error || result.message || 'Error al actualizar usuario');
      }
    } catch (error) {
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
      <DialogContent className="sm:max-w-[600px]">
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
            {/* Campos específicos por tipo de usuario */}
            {tipoUsuario === 'ALUMNO' && (
              <>
                <FormItem>
                  <FormLabel>Carrera</FormLabel>
                  <Select
                    value={alumnoCarreraId?.toString()}
                    onValueChange={v => setAlumnoCarreraId(Number(v))}
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
                </FormItem>
                <FormItem>
                  <FormLabel>Foto (URL)</FormLabel>
                  <FormControl>
                    <Input value={alumnoFotoUrl} onChange={e => setAlumnoFotoUrl(e.target.value)} disabled={isSubmitting} />
                  </FormControl>
                </FormItem>
              </>
            )}
            {tipoUsuario === 'DOCENTE' && (
              <FormItem>
                <FormLabel>Carreras</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {carreras.map(carrera => (
                    <label key={carrera.id} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={docenteCarreras.includes(carrera.id)}
                        onChange={e => {
                          if (e.target.checked) setDocenteCarreras([...docenteCarreras, carrera.id]);
                          else setDocenteCarreras(docenteCarreras.filter(id => id !== carrera.id));
                        }}
                        disabled={isSubmitting}
                      />
                      {carrera.nombre}
                    </label>
                  ))}
                </div>
              </FormItem>
            )}
            {tipoUsuario === 'EMPLEADOR' && (
              <FormItem>
                <FormLabel>Centros de Práctica</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {centros.map(centro => (
                    <label key={centro.id} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={empleadorCentros.includes(centro.id)}
                        onChange={e => {
                          if (e.target.checked) setEmpleadorCentros([...empleadorCentros, centro.id]);
                          else setEmpleadorCentros(empleadorCentros.filter(id => id !== centro.id));
                        }}
                        disabled={isSubmitting}
                      />
                      {centro.nombreEmpresa}
                    </label>
                  ))}
                </div>
              </FormItem>
            )}
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
