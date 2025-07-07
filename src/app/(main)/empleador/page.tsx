'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { EmpleadorService, PracticaAsignada } from '@/lib/services/empleadorService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, User, Building, Award, Eye, AlertTriangle, Clock, CheckCircle2, FileText } from 'lucide-react';
import Link from 'next/link';

const EstadoColors = {
  'EN_CURSO': 'bg-secondary text-secondary-foreground',
  'FINALIZADA_PENDIENTE_EVAL': 'bg-orange-500 text-white',
  'EVALUACION_COMPLETA': 'bg-accent text-accent-foreground',
  'CERRADA': 'bg-muted text-muted-foreground'
};

const EstadoLabels = {
  'EN_CURSO': 'En Curso',
  'FINALIZADA_PENDIENTE_EVAL': 'Pendiente Evaluación',
  'EVALUACION_COMPLETA': 'Evaluación Completa',
  'CERRADA': 'Cerrada'
};

export default function EmpleadorDashboard() {
  const { user } = useAuth();
  const [practicas, setPracticas] = useState<PracticaAsignada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchPracticas = async () => {
      if (!user?.userId) {
        setError('No se pudo identificar el usuario');
        setLoading(false);
        return;
      }

      try {
        // Primero obtener el empleadorId usando el userId
        const empleadorResponse = await fetch(`/api/empleadores/by-user/${user.userId}`);
        
        if (!empleadorResponse.ok) {
          setError('No se pudo obtener la información del empleador');
          setLoading(false);
          return;
        }

        const empleadorData = await empleadorResponse.json();
        const empleadorId = empleadorData.id;

        if (!empleadorId) {
          setError('No se encontró el empleador asociado al usuario');
          setLoading(false);
          return;
        }

        const response = await EmpleadorService.getPracticasByEmpleador(empleadorId);
        
        if (response.success && response.practicas) {
          setPracticas(response.practicas);
        } else {
          setError(response.message || 'Error al cargar las prácticas');
        }
      } catch (err) {
        console.error('Error al cargar prácticas:', err);
        setError('Error inesperado al cargar las prácticas');
      } finally {
        setLoading(false);
      }
    };

    fetchPracticas();
  }, [user]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Panel de Evaluaciones
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona las evaluaciones de desempeño de los estudiantes en práctica
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Estudiantes</p>
                  <p className="text-2xl font-bold text-foreground">{practicas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-accent" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">En Curso</p>
                  <p className="text-2xl font-bold text-foreground">
                    {practicas.filter(p => p.estado === 'EN_CURSO').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pendiente Evaluación</p>
                  <p className="text-2xl font-bold text-foreground">
                    {practicas.filter(p => p.estado === 'FINALIZADA_PENDIENTE_EVAL').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-secondary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Evaluadas</p>
                  <p className="text-2xl font-bold text-foreground">
                    {practicas.filter(p => p.evaluacionEmpleador).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Practices List */}
        {practicas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium text-foreground">
                No hay estudiantes asignados
              </h3>
              <p className="mt-2 text-muted-foreground">
                Actualmente no tienes estudiantes en práctica asignados para evaluar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {practicas.map((practica) => (
              <Card key={practica.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {practica.alumno.usuario.nombre} {practica.alumno.usuario.apellido}
                    </CardTitle>
                    <Badge 
                      className={EstadoColors[practica.estado as keyof typeof EstadoColors] || 'bg-muted text-muted-foreground'}
                    >
                      {EstadoLabels[practica.estado as keyof typeof EstadoLabels] || practica.estado}
                    </Badge>
                  </div>
                  <CardDescription>
                    {practica.alumno.carrera.nombre}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Building className="h-4 w-4 mr-2" />
                      {practica.centroPractica?.nombreEmpresa || 'Sin asignar'}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(practica.fechaInicio)} - {formatDate(practica.fechaTermino)}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {practica.tipo === 'LABORAL' ? 'Práctica Laboral' : 'Práctica Profesional'}
                      </Badge>
                    </div>
                  </div>                  {practica.evaluacionEmpleador && (
                    <div className="bg-accent/10 border border-accent/20 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-accent-foreground">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">
                            Evaluación Completada
                          </span>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold px-2 py-1 rounded ${
                            practica.evaluacionEmpleador.nota >= 5.5 ? 'bg-accent text-accent-foreground' :
                            practica.evaluacionEmpleador.nota >= 4.0 ? 'bg-orange-400 text-orange-900' :
                            'bg-destructive text-destructive-foreground'
                          }`}>
                            {practica.evaluacionEmpleador.nota.toFixed(1)}
                          </div>
                          <div className="text-xs text-accent/80 mt-1">
                            {practica.evaluacionEmpleador.nota >= 4.0 ? 'Aprobado' : 'Reprobado'}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-accent/80 mt-2 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Evaluado el {formatDate(practica.evaluacionEmpleador.fecha)}
                      </p>
                    </div>
                  )}

                  {!practica.evaluacionEmpleador && (
                    practica.estado === 'FINALIZADA_PENDIENTE_EVAL' || 
                    practica.estado === 'EN_CURSO'
                  ) && (
                    <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg">
                      <div className="flex items-center text-orange-700 dark:text-orange-300">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">
                          {practica.estado === 'EN_CURSO' ? 'En Curso - Sin Evaluar' : 'Pendiente de Evaluación'}
                        </span>
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        {practica.estado === 'EN_CURSO' 
                          ? 'Práctica en desarrollo, evalúe cuando termine'
                          : 'La práctica ha finalizado y requiere evaluación'
                        }
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3">
                    {!practica.evaluacionEmpleador && (
                      practica.estado === 'FINALIZADA_PENDIENTE_EVAL' || 
                      practica.estado === 'EN_CURSO'
                    ) && (
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/empleador/evaluar/${practica.id}`}>
                          <FileText className="h-4 w-4 mr-2" />
                          {practica.estado === 'EN_CURSO' ? 'Evaluar' : 'Evaluar Ahora'}
                        </Link>
                      </Button>
                    )}
                    
                    {practica.evaluacionEmpleador && (
                      <Button asChild variant="outline" size="sm" className="flex-1 border-accent text-accent hover:bg-accent/10">
                        <Link href={`/empleador/evaluar/${practica.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver/Editar
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
