'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { notFound } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft,
  Building2,
  Calendar,
  Star,
  User,
  MapPin,
  Mail,
  Phone,
  AlertCircle,
  FileText,
  CheckCircle
} from 'lucide-react';
import { getEvaluacionEmpleadorAction } from '../../practicas/actions';

interface EvaluacionData {
  practica: {
    id: number;
    fechaInicio: string;
    fechaTermino: string;
    direccionCentro: string | null;
    departamento: string | null;
    nombreJefeDirecto: string | null;
    cargoJefeDirecto: string | null;
    contactoCorreoJefe: string | null;
    contactoTelefonoJefe: string | null;
    tareasPrincipales: string | null;
    carrera: {
      id: number;
      nombre: string;
      sede: {
        id: number;
        nombre: string;
      };
    };
    docente: {
      usuario: {
        id: number;
        nombre: string;
        apellido: string;
      };
    };
    centroPractica: {
      nombreEmpresa: string;
    } | null;
    alumno: {
      usuario: {
        nombre: string;
        apellido: string;
        rut: string;
      };
    };
  };
  evaluacion: {
    id: number;
    nota: number;
    fecha: string;
    comentarios: string | null;
  };
}

interface Props {
  practicaId: number;
}

function NotaDisplay({ nota }: { nota: number }) {
  const getNotaInfo = (nota: number) => {
    if (nota >= 7) return { color: 'bg-green-100 text-green-800 border-green-200', label: 'Excelente' };
    if (nota >= 6) return { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Muy Bueno' };
    if (nota >= 5) return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Bueno' };
    if (nota >= 4) return { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Suficiente' };
    return { color: 'bg-red-100 text-red-800 border-red-200', label: 'Insuficiente' };
  };
  
  const { color, label } = getNotaInfo(nota);
  
  return (
    <div className={`inline-flex items-center px-4 py-2 rounded-lg border ${color} font-semibold`}>
      <Star className="w-5 h-5 mr-2 fill-current" />
      <span className="text-lg">{nota.toFixed(1)}</span>
      <span className="ml-2 text-sm font-medium">({label})</span>
    </div>
  );
}

export function EvaluacionEmpleadorDetalleClient({ practicaId }: Props) {
  const [data, setData] = useState<EvaluacionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarEvaluacion() {
      try {
        const result = await getEvaluacionEmpleadorAction(practicaId);
        
        if (result.success && result.data) {
          setData(result.data as EvaluacionData);
        } else {
          setError(result.error || 'Error al cargar la evaluación');
        }
      } catch (err) {
        setError('Error inesperado al cargar la evaluación');
        console.error('Error cargando evaluación:', err);
      } finally {
        setLoading(false);
      }
    }

    cargarEvaluacion();
  }, [practicaId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-96 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-48"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
          
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-48"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/alumno/evaluaciones-empleador">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
        
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    notFound();
  }

  const { practica, evaluacion } = data;

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between border-b pb-4">
        <Link href="/alumno/evaluaciones-empleador">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Evaluaciones
          </Button>
        </Link>
        
        <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 mr-1" />
          Evaluación Completada
        </Badge>
      </div>

      {/* Título y nota */}
      <div className="text-center space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Evaluación de Empleador
          </h1>
          <p className="text-lg text-gray-600">
            {practica.carrera.nombre} - {practica.carrera.sede.nombre}
          </p>
        </div>
        
        <div className="flex justify-center">
          <NotaDisplay nota={evaluacion.nota} />
        </div>
        
        <p className="text-sm text-gray-500">
          Evaluado el {format(new Date(evaluacion.fecha), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}
        </p>
      </div>

      {/* Información de la práctica */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Información del Estudiante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Nombre completo</p>
              <p className="text-gray-900">{practica.alumno.usuario.nombre} {practica.alumno.usuario.apellido}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">RUT</p>
              <p className="text-gray-900">{practica.alumno.usuario.rut}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Docente tutor</p>
              <p className="text-gray-900">{practica.docente.usuario.nombre} {practica.docente.usuario.apellido}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Período de Práctica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Fecha de inicio</p>
              <p className="text-gray-900">{format(new Date(practica.fechaInicio), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Fecha de término</p>
              <p className="text-gray-900">{format(new Date(practica.fechaTermino), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Duración</p>
              <p className="text-gray-900">
                {Math.ceil((new Date(practica.fechaTermino).getTime() - new Date(practica.fechaInicio).getTime()) / (1000 * 60 * 60 * 24))} días
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información del centro de práctica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Centro de Práctica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Empresa</p>
              <p className="text-gray-900">{practica.centroPractica?.nombreEmpresa || 'No especificada'}</p>
            </div>
            
            {practica.departamento && (
              <div>
                <p className="text-sm font-medium text-gray-700">Departamento</p>
                <p className="text-gray-900">{practica.departamento}</p>
              </div>
            )}
            
            {practica.direccionCentro && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-700 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Dirección
                </p>
                <p className="text-gray-900">{practica.direccionCentro}</p>
              </div>
            )}
          </div>

          {(practica.nombreJefeDirecto || practica.contactoCorreoJefe || practica.contactoTelefonoJefe) && (
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Jefe Directo</p>
              <div className="grid gap-3 md:grid-cols-2">
                {practica.nombreJefeDirecto && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Nombre</p>
                    <p className="text-gray-900">{practica.nombreJefeDirecto}</p>
                    {practica.cargoJefeDirecto && (
                      <p className="text-sm text-gray-600">{practica.cargoJefeDirecto}</p>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  {practica.contactoCorreoJefe && (
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-gray-900">{practica.contactoCorreoJefe}</span>
                    </div>
                  )}
                  
                  {practica.contactoTelefonoJefe && (
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-gray-900">{practica.contactoTelefonoJefe}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tareas principales */}
      {practica.tareasPrincipales && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Tareas Principales Desarrolladas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 whitespace-pre-wrap">{practica.tareasPrincipales}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comentarios de la evaluación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Comentarios de la Evaluación
          </CardTitle>
          <CardDescription>
            Observaciones y comentarios del empleador sobre tu desempeño
          </CardDescription>
        </CardHeader>
        <CardContent>
          {evaluacion.comentarios ? (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-gray-900 whitespace-pre-wrap">{evaluacion.comentarios}</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3" />
              <p>No se proporcionaron comentarios adicionales en esta evaluación.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones finales */}
      <div className="flex justify-center pt-4">
        <Link href="/alumno/evaluaciones-empleador">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a todas las evaluaciones
          </Button>
        </Link>
      </div>
    </div>
  );
}
