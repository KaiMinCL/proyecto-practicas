'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  FileCheck, 
  Building, 
  User, 
  Calendar, 
  Star, 
  CheckCircle2, 
  Lock,
  GraduationCap,
  Calculator,
  School
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

interface ActaFinalData {
  practica: {
    id: number;
    tipo: string;
    fechaInicio: string;
    fechaTermino: string;
    estado: string;
    alumno: {
      nombre: string;
      apellido: string;
      rut: string;
      carrera: string;
    };
    centroPractica: {
      nombre: string;
      giro: string;
    } | null;
    docente: {
      nombre: string;
      apellido: string;
    };
  };
  evaluaciones: {
    informe: {
      nota: number;
      fecha: string;
      porcentaje: number;
    };
    empleador: {
      nota: number;
      fecha: string;
      porcentaje: number;
    };
  };
  notaFinalPonderada: number;
  estadoActaFinal: string;
}

export default function ActaFinalPage({ params }: { params: Promise<{ practicaId: string }> }) {
  const router = useRouter();
  const [practicaId, setPracticaId] = useState<string>('');
  const [data, setData] = useState<ActaFinalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setPracticaId(resolvedParams.practicaId);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (practicaId) {
      fetchActaFinalData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practicaId]);

  const fetchActaFinalData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/practicas/${practicaId}/acta-final`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar datos del acta final');
      }

      const actaData = await response.json();
      setData(actaData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleValidarYCerrar = async () => {
    try {
      setSubmitting(true);
      
      const response = await fetch(`/api/practicas/${practicaId}/acta-final`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al validar el acta final');
      }

      const result = await response.json();
      toast.success(result.message || 'Acta Final cerrada exitosamente');
      
      // Actualizar el estado local
      setData(prev => prev ? {
        ...prev,
        estadoActaFinal: 'VALIDADA'
      } : null);

      // Redirigir a la lista de prácticas después de un pequeño delay
      setTimeout(() => {
        router.push('/docente/practicas');
      }, 2000);

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al validar el acta');
    } finally {
      setSubmitting(false);
    }
  };

  const getNotaColor = (nota: number) => {
    if (nota >= 6.5) return 'text-green-600 bg-green-50 border-green-200';
    if (nota >= 5.5) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (nota >= 4.0) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getNotaLabel = (nota: number) => {
    if (nota >= 6.5) return 'Excelente';
    if (nota >= 5.5) return 'Muy Bueno';
    if (nota >= 4.0) return 'Suficiente';
    return 'Insuficiente';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos del acta final...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="max-w-md mx-auto">
          <AlertDescription>{error || 'No se encontraron datos del acta final'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isActaCerrada = data.estadoActaFinal === 'VALIDADA' || data.estadoActaFinal === 'CERRADA';

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <FileCheck className="mr-3 h-8 w-8 text-emerald-600" />
              Acta Final Ponderada
            </h1>
            <p className="text-muted-foreground mt-2">
              Validación y cierre oficial de la práctica
            </p>
          </div>
          {isActaCerrada && (
            <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
              <Lock className="w-4 h-4 mr-1" />
              Acta Cerrada
            </Badge>
          )}
        </div>
        <Separator />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información de la Práctica */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del Estudiante */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5 text-blue-600" />
                Información del Estudiante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                  <p className="font-semibold">{data.practica.alumno.nombre} {data.practica.alumno.apellido}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">RUT</p>
                  <p className="font-semibold">{data.practica.alumno.rut}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Carrera</p>
                  <p className="font-semibold flex items-center">
                    <GraduationCap className="w-4 h-4 mr-1 text-purple-600" />
                    {data.practica.alumno.carrera}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Práctica</p>
                  <Badge variant="outline">
                    {data.practica.tipo === 'LABORAL' ? 'Práctica Laboral' : 'Práctica Profesional'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datos de la Práctica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5 text-orange-600" />
                Centro de Práctica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.practica.centroPractica ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Empresa</p>
                    <p className="font-semibold">{data.practica.centroPractica.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Giro</p>
                    <p className="font-semibold">{data.practica.centroPractica.giro || 'No especificado'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground italic">Información del centro de práctica no disponible</p>
              )}
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Inicio</p>
                  <p className="font-semibold flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-green-600" />
                    {format(new Date(data.practica.fechaInicio), "dd 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Término</p>
                  <p className="font-semibold flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-red-600" />
                    {format(new Date(data.practica.fechaTermino), "dd 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Docente Supervisor</p>
                <p className="font-semibold flex items-center">
                  <School className="w-4 h-4 mr-1 text-emerald-600" />
                  {data.practica.docente.nombre} {data.practica.docente.apellido}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumen de Evaluaciones y Nota Final */}
        <div className="space-y-6">
          {/* Evaluaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="mr-2 h-5 w-5 text-yellow-600" />
                Evaluaciones
              </CardTitle>
              <CardDescription>
                Notas de evaluación obtenidas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Evaluación del Informe */}
              <div className="border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-900/10">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium text-sm">Evaluación del Informe</p>
                  <Badge variant="secondary">{data.evaluaciones.informe.porcentaje}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className={`px-3 py-1 rounded-lg border ${getNotaColor(data.evaluaciones.informe.nota)}`}>
                    <span className="font-bold text-lg">{data.evaluaciones.informe.nota.toFixed(1)}</span>
                    <span className="text-xs ml-1">({getNotaLabel(data.evaluaciones.informe.nota)})</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(data.evaluaciones.informe.fecha), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>

              {/* Evaluación del Empleador */}
              <div className="border rounded-lg p-4 bg-purple-50/50 dark:bg-purple-900/10">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-medium text-sm">Evaluación del Empleador</p>
                  <Badge variant="secondary">{data.evaluaciones.empleador.porcentaje}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className={`px-3 py-1 rounded-lg border ${getNotaColor(data.evaluaciones.empleador.nota)}`}>
                    <span className="font-bold text-lg">{data.evaluaciones.empleador.nota.toFixed(1)}</span>
                    <span className="text-xs ml-1">({getNotaLabel(data.evaluaciones.empleador.nota)})</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(data.evaluaciones.empleador.fecha), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nota Final Ponderada */}
          <Card className="border-2 border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <CardTitle className="flex items-center text-emerald-700 dark:text-emerald-300">
                <Calculator className="mr-2 h-5 w-5" />
                Nota Final Ponderada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className={`mx-auto w-24 h-24 rounded-full border-4 flex items-center justify-center ${getNotaColor(data.notaFinalPonderada)} text-3xl font-bold`}>
                  {data.notaFinalPonderada.toFixed(1)}
                </div>
                <div>
                  <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                    {getNotaLabel(data.notaFinalPonderada)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Escala 1.0 - 7.0
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card>
            <CardContent className="pt-6">
              {!isActaCerrada ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={submitting}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {submitting ? 'Validando...' : 'Validar y Cerrar Acta'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Validación del Acta Final</AlertDialogTitle>
                      <AlertDialogDescription>
                        Al validar y cerrar el acta final, se oficializará la calificación de la práctica con una nota de <strong>{data.notaFinalPonderada.toFixed(1)}</strong>. 
                        Esta acción no se puede deshacer y las evaluaciones quedarán bloqueadas para modificaciones.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleValidarYCerrar}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Confirmar Validación
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center text-green-600">
                    <CheckCircle2 className="w-6 h-6 mr-2" />
                    <span className="font-semibold">Acta Final Validada</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    La práctica ha sido oficialmente cerrada
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botón Volver */}
      <div className="mt-8 flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => router.push('/docente/practicas')}
          className="px-6"
        >
          Volver a Mis Prácticas
        </Button>
      </div>
    </div>
  );
}