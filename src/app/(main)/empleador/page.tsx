'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { EmpleadorService, PracticaAsignada } from '@/lib/services/empleadorService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, User, Building, Award, Eye } from 'lucide-react';
import Link from 'next/link';

const EstadoColors = {
  'EN_CURSO': 'bg-blue-100 text-blue-800',
  'FINALIZADA_PENDIENTE_EVAL': 'bg-yellow-100 text-yellow-800',
  'EVALUACION_COMPLETA': 'bg-green-100 text-green-800',
  'CERRADA': 'bg-gray-100 text-gray-800'
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
          <h1 className="text-3xl font-bold text-gray-900">
            Panel de Evaluaciones
          </h1>
          <p className="text-gray-600 mt-2">
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
                <User className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Estudiantes</p>
                  <p className="text-2xl font-bold text-gray-900">{practicas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En Curso</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {practicas.filter(p => p.estado === 'EN_CURSO').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pendiente Evaluación</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {practicas.filter(p => p.estado === 'FINALIZADA_PENDIENTE_EVAL').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Evaluadas</p>
                  <p className="text-2xl font-bold text-gray-900">
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
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No hay estudiantes asignados
              </h3>
              <p className="mt-2 text-gray-600">
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
                      className={EstadoColors[practica.estado as keyof typeof EstadoColors] || 'bg-gray-100 text-gray-800'}
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
                    <div className="flex items-center text-gray-600">
                      <Building className="h-4 w-4 mr-2" />
                      {practica.centroPractica?.nombreEmpresa || 'Sin asignar'}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(practica.fechaInicio)} - {formatDate(practica.fechaTermino)}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Badge variant="outline" className="text-xs">
                        {practica.tipo === 'LABORAL' ? 'Práctica Laboral' : 'Práctica Profesional'}
                      </Badge>
                    </div>
                  </div>

                  {practica.evaluacionEmpleador && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center text-green-800">
                        <Award className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">
                          Evaluado - Nota: {practica.evaluacionEmpleador.nota.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Evaluado el {formatDate(practica.evaluacionEmpleador.fecha)}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {!practica.evaluacionEmpleador && (
                      practica.estado === 'FINALIZADA_PENDIENTE_EVAL' || 
                      practica.estado === 'EN_CURSO'
                    ) && (
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/empleador/evaluar/${practica.id}`}>
                          <Award className="h-4 w-4 mr-2" />
                          Evaluar
                        </Link>
                      </Button>
                    )}
                    
                    {practica.evaluacionEmpleador && (
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link href={`/empleador/evaluar/${practica.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Evaluación
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
