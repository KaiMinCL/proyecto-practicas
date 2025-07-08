'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  GraduationCap, 
  FileText, 
  Star,
  User,
  AlertCircle,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { getEvaluacionInformeAction } from '../../practicas/actions';
import { notFound } from 'next/navigation';

interface EvaluacionInformeData {
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
      <span className="ml-2 text-sm">({label})</span>
    </div>
  );
}

export function EvaluacionInformeDetalleClient({ practicaId }: Props) {
  const [data, setData] = useState<EvaluacionInformeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarEvaluacion() {
      try {
        const result = await getEvaluacionInformeAction(practicaId);
        
        if (result.success && result.data) {
          setData(result.data as EvaluacionInformeData);
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
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/alumno/evaluaciones-informe">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Error</h1>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/alumno/evaluaciones-informe">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Evaluación de Informe
            </h1>
            <p className="text-gray-600 mt-1">
              {practica.carrera.nombre} - {practica.carrera.sede.nombre}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Evaluado
          </Badge>
          <NotaDisplay nota={evaluacion.nota} />
        </div>
      </div>

      {/* Información General */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información de la Práctica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Estudiante</p>
                <p className="text-sm text-gray-900">
                  {practica.alumno.usuario.nombre} {practica.alumno.usuario.apellido}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">RUT</p>
                <p className="text-sm text-gray-900">{practica.alumno.usuario.rut}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Fecha de Inicio</p>
                <p className="text-sm text-gray-900">
                  {format(new Date(practica.fechaInicio), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Fecha de Término</p>
                <p className="text-sm text-gray-900">
                  {format(new Date(practica.fechaTermino), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600">Centro de Práctica</p>
              <p className="text-sm text-gray-900">
                {practica.centroPractica?.nombreEmpresa || 'No especificado'}
              </p>
            </div>

            {practica.direccionCentro && (
              <div>
                <p className="text-sm font-medium text-gray-600">Dirección</p>
                <p className="text-sm text-gray-900">{practica.direccionCentro}</p>
              </div>
            )}

            {practica.departamento && (
              <div>
                <p className="text-sm font-medium text-gray-600">Departamento</p>
                <p className="text-sm text-gray-900">{practica.departamento}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Docente Tutor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Nombre</p>
              <p className="text-sm text-gray-900">
                {practica.docente.usuario.nombre} {practica.docente.usuario.apellido}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-600">Fecha de Evaluación</p>
              <p className="text-sm text-gray-900">
                {format(new Date(evaluacion.fecha), 'dd \'de\' MMMM \'de\' yyyy \'a las\' HH:mm', { locale: es })}
              </p>
            </div>

            {practica.nombreJefeDirecto && (
              <div>
                <p className="text-sm font-medium text-gray-600">Jefe Directo</p>
                <p className="text-sm text-gray-900">
                  {practica.nombreJefeDirecto}
                  {practica.cargoJefeDirecto && ` - ${practica.cargoJefeDirecto}`}
                </p>
              </div>
            )}

            {practica.contactoCorreoJefe && (
              <div>
                <p className="text-sm font-medium text-gray-600">Contacto</p>
                <p className="text-sm text-gray-900">{practica.contactoCorreoJefe}</p>
                {practica.contactoTelefonoJefe && (
                  <p className="text-sm text-gray-900">{practica.contactoTelefonoJefe}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Evaluación Detallada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Evaluación del Informe
          </CardTitle>
          <CardDescription>
            Evaluación realizada por el docente tutor sobre el informe de práctica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Calificación Final</h3>
              <NotaDisplay nota={evaluacion.nota} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-600">Evaluado por</p>
                <p className="text-gray-900">
                  {practica.docente.usuario.nombre} {practica.docente.usuario.apellido}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Fecha de evaluación</p>
                <p className="text-gray-900">
                  {format(new Date(evaluacion.fecha), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}
                </p>
              </div>
            </div>
          </div>

          {evaluacion.comentarios && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Comentarios del Docente</h3>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{evaluacion.comentarios}</p>
              </div>
            </div>
          )}

          {practica.tareasPrincipales && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tareas Principales Realizadas</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{practica.tareasPrincipales}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex justify-center">
        <Link href="/alumno/evaluaciones-informe">
          <Button variant="outline" size="lg">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Evaluaciones
          </Button>
        </Link>
      </div>
    </div>
  );
}
