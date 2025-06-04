'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { ArrowLeft, Calculator, Save, User, Calendar, Building, CheckCircle, AlertTriangle, Clock, Award } from 'lucide-react';
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<EvaluacionEmpleadorInput | null>(null);
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
    }  }, [criteriosValues, form]);

  const cargarEvaluacionExistente = useCallback(async (empleadorId: number, practicaId: number) => {
    try {
      const evaluacion = await EmpleadorService.getEvaluacion(empleadorId, practicaId);
      
      if (evaluacion) {
        // Cargar comentarios
        if (evaluacion.comentarios) {
          form.setValue('comentarios', evaluacion.comentarios);
        }        // Como no tenemos los criterios individuales guardados, calculamos hacia atrás
        // Para simplificar, establecemos todos los criterios en un valor que dé la nota final
        const notaObjetivo = evaluacion.nota;
        const valorCriterio = Math.round(notaObjetivo);
        
        const criteriosData = CRITERIOS_EVALUACION_EMPLEADOR.map(criterio => ({
          criterioId: criterio.id,
          puntaje: valorCriterio
        }));

        form.setValue('criterios', criteriosData);
        form.setValue('notaFinal', evaluacion.nota);
        setNotaCalculada(evaluacion.nota);
        setIsEditingExisting(true);
        
        toast.info('Esta práctica ya ha sido evaluada. Puede modificar la evaluación existente.', {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error al cargar evaluación existente:', error);
      toast.error('Error al cargar la evaluación existente');
    }
  }, [form]);

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
          setPractica(practicaData);          // Si ya está evaluada, cargar los datos de la evaluación
          if (practicaData.evaluacionEmpleador) {
            await cargarEvaluacionExistente(empleadorId, practicaId);
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
    };    fetchPractica();
  }, [user, practicaId, cargarEvaluacionExistente]);const onSubmit = async (data: EvaluacionEmpleadorInput) => {
    // Validación adicional antes de mostrar el diálogo
    if (!practica?.id) {
      toast.error('Error: No se pudo identificar la práctica');
      return;
    }

    // Validar que todos los criterios tengan puntaje
    const criteriosSinPuntaje = data.criterios.filter(c => !c.puntaje || c.puntaje < 1 || c.puntaje > 7);
    if (criteriosSinPuntaje.length > 0) {
      toast.error('Por favor, asigne un puntaje válido (1-7) a todos los criterios');
      return;
    }

    // Validar que la nota final esté en rango válido
    if (data.notaFinal < 1.0 || data.notaFinal > 7.0) {
      toast.error('La nota final debe estar entre 1.0 y 7.0');
      return;
    }

    // Mostrar diálogo de confirmación
    setPendingFormData(data);
    setShowConfirmDialog(true);
  };
  const handleConfirmSubmit = async () => {
    if (!pendingFormData || !user?.userId) {
      toast.error('No se pudo identificar el usuario');
      return;
    }

    if (!practica?.id) {
      toast.error('Error: No se pudo identificar la práctica');
      return;
    }

    setSubmitting(true);
    setShowConfirmDialog(false);
    
    try {
      // Obtener empleadorId
      const empleadorResponse = await fetch(`/api/empleadores/by-user/${user.userId}`);
      if (!empleadorResponse.ok) {
        const errorText = await empleadorResponse.text();
        console.error('Error al obtener empleador:', errorText);
        toast.error('No se pudo obtener la información del empleador');
        return;
      }

      const empleadorData = await empleadorResponse.json();
      const empleadorId = empleadorData.id;

      if (!empleadorId) {
        toast.error('No se encontró el empleador asociado');
        return;
      }

      // Guardar evaluación con mejor manejo de errores
      const response = await EmpleadorService.guardarEvaluacion(empleadorId, pendingFormData);
      
      if (response.success) {
        const message = isEditingExisting 
          ? 'Evaluación actualizada exitosamente' 
          : 'Evaluación guardada exitosamente';
        
        toast.success(message, {
          description: `Nota final: ${pendingFormData.notaFinal.toFixed(1)} - Estudiante: ${practica.alumno.usuario.nombre} ${practica.alumno.usuario.apellido}`,
          duration: 5000,
        });
        
        // Actualizar el estado de la práctica
        if (practica) {
          setPractica({
            ...practica,
            evaluacionEmpleador: {
              id: response.evaluacionId || 0,
              nota: pendingFormData.notaFinal,
              fecha: new Date()
            },
            estado: 'EVALUACION_COMPLETA'
          });
        }
        
        setIsEditingExisting(true);
        
        // Redirigir después de un breve delay para mostrar el mensaje
        setTimeout(() => {
          router.push('/empleador');
        }, 2500);
      } else {
        toast.error(response.message || 'Error al guardar la evaluación');
        if (response.errors) {
          Object.entries(response.errors).forEach(([field, messages]) => {
            messages.forEach((message) => {
              toast.error(`Error en ${field}: ${message}`, { duration: 4000 });
            });
          });
        }
      }
    } catch (error) {
      console.error('Error al guardar evaluación:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      toast.error(`Error inesperado al guardar la evaluación: ${errorMessage}`, {
        duration: 6000
      });
    } finally {
      setSubmitting(false);
      setPendingFormData(null);
    }};

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

  const getNotaStatus = (nota: number) => {
    if (nota >= 5.5) return 'Aprobado';
    if (nota >= 4.0) return 'Suficiente';
    return 'Insuficiente';
  };

  const calculateCompletionPercentage = () => {
    const totalCriterios = CRITERIOS_EVALUACION_EMPLEADOR.length;
    const completedCriterios = criteriosValues?.filter(c => c.puntaje && c.puntaje > 0).length || 0;
    return Math.round((completedCriterios / totalCriterios) * 100);
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
      <div className="space-y-6">        {/* Header */}
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/empleador">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                Evaluación de Desempeño
              </h1>
              {isEditingExisting && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ya Evaluada
                </Badge>
              )}
            </div>
            <p className="text-gray-600 mt-2">
              Acta 2 - Evaluación del Empleador
              {isEditingExisting && " (Editando evaluación existente)"}
            </p>
          </div>
        </div>

        {/* Alert for existing evaluation */}
        {isEditingExisting && (
          <Alert className="bg-blue-50 border-blue-200">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Esta práctica ya ha sido evaluada anteriormente. Puede modificar los criterios y guardar los cambios.
              La nota actual es: <strong>{practica?.evaluacionEmpleador?.nota.toFixed(1)}</strong>
            </AlertDescription>
          </Alert>
        )}

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
                <CardTitle>Criterios de Evaluación</CardTitle>                <CardDescription>
                  Evalúe cada criterio utilizando la escala de 1 a 7, donde 1 es &ldquo;Muy Deficiente&rdquo; y 7 es &ldquo;Excelente&rdquo;
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
                <CardDescription>
                  La nota se calcula automáticamente basada en los pesos de cada criterio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center px-6 py-3 rounded-lg font-bold text-3xl ${getNotaColor(notaCalculada)} border-2`}>
                    <Award className="h-6 w-6 mr-2" />
                    {notaCalculada.toFixed(1)}
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${notaCalculada >= 4.0 ? 'text-green-600' : 'text-red-600'}`}>
                      {getNotaStatus(notaCalculada)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Progreso: {calculateCompletionPercentage()}% completado
                    </div>
                  </div>
                </div>
                {calculateCompletionPercentage() < 100 && (
                  <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        Faltan {CRITERIOS_EVALUACION_EMPLEADOR.length - (criteriosValues?.filter(c => c.puntaje && c.puntaje > 0).length || 0)} criterios por evaluar
                      </span>
                    </div>
                  </div>
                )}
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
            </Card>            {/* Submit Button */}
            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" asChild>
                <Link href="/empleador">Cancelar</Link>
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || !form.formState.isValid || calculateCompletionPercentage() < 100}
                className={isEditingExisting ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                <Save className="h-4 w-4 mr-2" />
                {submitting 
                  ? 'Guardando...' 
                  : isEditingExisting 
                    ? 'Actualizar Evaluación' 
                    : 'Guardar Evaluación'
                }
              </Button>
            </div>
            {calculateCompletionPercentage() < 100 && (
              <div className="flex justify-end">
                <p className="text-sm text-gray-500 italic">
                  Complete todos los criterios para habilitar el guardado
                </p>
              </div>
            )}
          </form>
        </Form>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Confirmar {isEditingExisting ? 'Actualización' : 'Evaluación'}
              </DialogTitle>
              <DialogDescription>
                {isEditingExisting 
                  ? 'Está a punto de actualizar la evaluación existente. Esta acción sobrescribirá los datos anteriores.'
                  : 'Está a punto de guardar la evaluación de desempeño. Una vez guardada, podrá modificarla si es necesario.'
                }
              </DialogDescription>
            </DialogHeader>
              {pendingFormData && (
              <div className="my-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Resumen de la Evaluación:</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Estudiante:</span>
                    <span className="font-medium">
                      {practica?.alumno.usuario.nombre} {practica?.alumno.usuario.apellido}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Carrera:</span>
                    <span className="font-medium">{practica?.alumno.carrera.nombre}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tipo de Práctica:</span>
                    <Badge variant="outline" className="h-5">
                      {practica?.tipo === 'LABORAL' ? 'Práctica Laboral' : 'Práctica Profesional'}
                    </Badge>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between items-center">
                    <span>Nota Final:</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-xl px-3 py-1 rounded ${getNotaColor(pendingFormData.notaFinal)}`}>
                        {pendingFormData.notaFinal.toFixed(1)}
                      </span>
                      <span className={`text-sm font-medium ${pendingFormData.notaFinal >= 4.0 ? 'text-green-600' : 'text-red-600'}`}>
                        ({getNotaStatus(pendingFormData.notaFinal)})
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Criterios Evaluados:</span>
                    <span className="font-medium">{pendingFormData.criterios.length} de {CRITERIOS_EVALUACION_EMPLEADOR.length}</span>
                  </div>
                  {pendingFormData.comentarios && (
                    <div className="mt-3 p-2 bg-white rounded border">                      <span className="text-gray-600 font-medium">Comentarios:</span>
                      <p className="text-gray-800 text-xs mt-1 italic">
                        &ldquo;{pendingFormData.comentarios.substring(0, 150)}
                        {pendingFormData.comentarios.length > 150 ? '...' : ''}&rdquo;
                      </p>
                    </div>
                  )}
                  <div className="mt-3 text-xs text-gray-500">
                    Fecha de evaluación: {new Date().toLocaleDateString('es-CL')}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowConfirmDialog(false)}
                disabled={submitting}
              >
                Revisar
              </Button>
              <Button 
                type="button" 
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className={isEditingExisting ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {submitting 
                  ? 'Guardando...' 
                  : isEditingExisting 
                    ? 'Confirmar Actualización' 
                    : 'Confirmar Evaluación'
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
