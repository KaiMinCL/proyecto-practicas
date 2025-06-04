'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { EmpleadorService, PracticaAsignada } from '@/lib/services/empleadorService';
import { 
  evaluacionEmpleadorSchema, 
  EvaluacionEmpleadorInput,
  CRITERIOS_EVALUACION_EMPLEADOR,
  ESCALA_EVALUACION,
  calcularNotaFinal 
} from '@/lib/validators/evaluacion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Calculator, Save, User, Calendar, Building } from 'lucide-react';
import Link from 'next/link';

export default function EvaluarPracticaPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const practicaId = parseInt(params.practicaId as string);

  const [practica, setPractica] = useState<PracticaAsignada | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notaCalculada, setNotaCalculada] = useState<number>(0);
  const form = useForm<EvaluacionEmpleadorInput>({
    resolver: zodResolver(evaluacionEmpleadorSchema),
    defaultValues: {
      practicaId,
      criterios: CRITERIOS_EVALUACION_EMPLEADOR.map(criterio => ({
        criterioId: criterio.id,
        puntaje: 4 // Valor por defecto: "Suficiente"
      })),
      comentarios: undefined,
      notaFinal: 4.0
    }
  });

  // Observar cambios en los criterios para recalcular la nota
  const criteriosValues = form.watch('criterios');

  useEffect(() => {
    if (criteriosValues) {
      const nota = calcularNotaFinal(criteriosValues);
      setNotaCalculada(nota);
      form.setValue('notaFinal', nota);
    }
  }, [criteriosValues, form]);

  useEffect(() => {
    const fetchPractica = async () => {
      if (!user?.userId) {
        setError('No se pudo identificar el usuario');
        setLoading(false);
        return;
      }

      try {
        // Obtener empleadorId
        const empleadorResponse = await fetch(`/api/empleadores/by-user/${user.userId}`);
        if (!empleadorResponse.ok) {
          setError('No se pudo obtener la información del empleador');
          setLoading(false);
          return;
        }

        const empleadorData = await empleadorResponse.json();
        const empleadorId = empleadorData.id;

        // Obtener práctica específica
        const response = await EmpleadorService.getPracticaByEmpleador(empleadorId, practicaId);
        
        if (response.success && response.practicas?.[0]) {
          const practicaData = response.practicas[0];
          setPractica(practicaData);

          // Si ya está evaluada, cargar los datos de la evaluación
          if (practicaData.evaluacionEmpleador) {
            // TODO: Cargar datos de evaluación existente
            toast.info('Esta práctica ya ha sido evaluada. Puede ver o modificar la evaluación.');
          }
        } else {
          setError('Práctica no encontrada o no tiene acceso a ella');
        }
      } catch (err) {
        console.error('Error al cargar práctica:', err);
        setError('Error inesperado al cargar la práctica');
      } finally {
        setLoading(false);
      }
    };

    fetchPractica();
  }, [user, practicaId]);

  const onSubmit = async (data: EvaluacionEmpleadorInput) => {
    setSubmitting(true);
    try {
      // TODO: Implementar guardado de evaluación
      console.log('Datos de evaluación:', data);
      toast.success('Evaluación guardada exitosamente');
      router.push('/empleador');
    } catch (error) {
      console.error('Error al guardar evaluación:', error);
      toast.error('Error al guardar la evaluación');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getNotaColor = (nota: number) => {
    if (nota >= 5.5) return 'text-green-600 bg-green-50';
    if (nota >= 4.0) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/empleador">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!practica) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Práctica no encontrada</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/empleador">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Evaluación de Desempeño
            </h1>
            <p className="text-gray-600 mt-2">
              Acta 2 - Evaluación del Empleador
            </p>
          </div>
        </div>

        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Estudiante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Estudiante</p>
                <p className="text-lg font-semibold">
                  {practica.alumno.usuario.nombre} {practica.alumno.usuario.apellido}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Carrera</p>
                <p className="text-lg">{practica.alumno.carrera.nombre}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-lg">{practica.alumno.usuario.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Tipo de Práctica</p>
                <Badge variant="outline">
                  {practica.tipo === 'LABORAL' ? 'Práctica Laboral' : 'Práctica Profesional'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Período</p>
                <p className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(practica.fechaInicio)} - {formatDate(practica.fechaTermino)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Centro de Práctica</p>
                <p className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {practica.centroPractica?.nombreEmpresa || 'Sin asignar'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evaluation Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Criteria Evaluation */}
            <Card>
              <CardHeader>
                <CardTitle>Criterios de Evaluación</CardTitle>
                <CardDescription>
                  Evalúe cada criterio utilizando la escala de 1 a 7, donde 1 es "Muy Deficiente" y 7 es "Excelente"
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {CRITERIOS_EVALUACION_EMPLEADOR.map((criterio, index) => (
                  <FormField
                    key={criterio.id}
                    control={form.control}
                    name={`criterios.${index}.puntaje`}
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <div className="border-l-4 border-blue-500 pl-4">
                          <FormLabel className="text-base font-semibold">
                            {criterio.nombre} <span className="text-sm text-gray-500">({criterio.peso}%)</span>
                          </FormLabel>
                          <FormDescription className="text-sm text-gray-600">
                            {criterio.descripcion}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                            className="grid grid-cols-1 md:grid-cols-7 gap-4"
                          >
                            {ESCALA_EVALUACION.map((escala) => (
                              <div key={escala.valor} className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value={escala.valor.toString()}
                                  id={`${criterio.id}-${escala.valor}`}
                                />
                                <label
                                  htmlFor={`${criterio.id}-${escala.valor}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  <div className="text-center">
                                    <div className="font-bold">{escala.valor}</div>
                                    <div className="text-xs text-gray-600">{escala.descripcion}</div>
                                  </div>
                                </label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Calculated Grade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Nota Calculada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`inline-flex items-center px-4 py-2 rounded-lg font-bold text-2xl ${getNotaColor(notaCalculada)}`}>
                  {notaCalculada.toFixed(1)}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Esta nota se calcula automáticamente basada en los pesos de cada criterio
                </p>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle>Comentarios Adicionales</CardTitle>
                <CardDescription>
                  Agregue comentarios adicionales sobre el desempeño del estudiante (opcional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="comentarios"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Ingrese comentarios adicionales sobre el desempeño del estudiante..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Máximo 2000 caracteres
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" asChild>
                <Link href="/empleador">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={submitting}>
                <Save className="h-4 w-4 mr-2" />
                {submitting ? 'Guardando...' : 'Guardar Evaluación'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
