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
  MessageSquare,
  Calendar
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
    if (nota >= 7) return { 
      color: 'bg-green-100 text-green-800 border-green-200', 
      bgIcon: 'bg-green-500',
      label: 'Excelente',
      description: 'Supera las expectativas' 
    };
    if (nota >= 6) return { 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      bgIcon: 'bg-blue-500',
      label: 'Muy Bueno',
      description: 'Cumple con las expectativas' 
    };
    if (nota >= 5) return { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      bgIcon: 'bg-yellow-500',
      label: 'Bueno',
      description: 'Cumple estándares básicos' 
    };
    if (nota >= 4) return { 
      color: 'bg-orange-100 text-orange-800 border-orange-200', 
      bgIcon: 'bg-orange-500',
      label: 'Suficiente',
      description: 'Requiere mejoras menores' 
    };
    return { 
      color: 'bg-red-100 text-red-800 border-red-200', 
      bgIcon: 'bg-red-500',
      label: 'Insuficiente',
      description: 'Requiere mejoras significativas' 
    };
  };
  
  const { color, bgIcon, label } = getNotaInfo(nota);
  
  return (
    <div className={`inline-flex items-center px-4 py-3 rounded-xl border-2 ${color} font-semibold shadow-sm`}>
      <div className={`w-6 h-6 rounded-full ${bgIcon} flex items-center justify-center mr-3`}>
        <Star className="w-4 h-4 text-white fill-current" />
      </div>
      <div className="text-left">
        <div className="text-xl font-bold">{nota.toFixed(1)}</div>
        <div className="text-xs font-medium opacity-80">{label}</div>
      </div>
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
        <div className="flex items-center gap-4">
          <Link href="/alumno/evaluaciones-informe">
            <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Evaluación de Informe
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              {practica.carrera.nombre} - {practica.carrera.sede.nombre}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-4 h-4" />
            Evaluado
          </Badge>
          <NotaDisplay nota={evaluacion.nota} />
        </div>
      </div>

      {/* Información General */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-gray-100 hover:border-gray-200 transition-colors">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              Información de la Práctica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Estudiante</p>
                <p className="text-sm font-semibold text-gray-900">
                  {practica.alumno.usuario.nombre} {practica.alumno.usuario.apellido}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">RUT</p>
                <p className="text-sm font-semibold text-gray-900">{practica.alumno.usuario.rut}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Fecha de Inicio</p>
                <p className="text-sm font-semibold text-gray-900">
                  {format(new Date(practica.fechaInicio), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Fecha de Término</p>
                <p className="text-sm font-semibold text-gray-900">
                  {format(new Date(practica.fechaTermino), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Centro de Práctica</p>
              <p className="text-sm font-semibold text-gray-900">
                {practica.centroPractica?.nombreEmpresa || 'No especificado'}
              </p>
            </div>

            {practica.direccionCentro && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Dirección</p>
                <p className="text-sm font-semibold text-gray-900">{practica.direccionCentro}</p>
              </div>
            )}

            {practica.departamento && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Departamento</p>
                <p className="text-sm font-semibold text-gray-900">{practica.departamento}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-100 hover:border-gray-200 transition-colors">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-green-600" />
              </div>
              Docente Tutor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nombre</p>
              <p className="text-sm font-semibold text-gray-900">
                {practica.docente.usuario.nombre} {practica.docente.usuario.apellido}
              </p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Fecha de Evaluación</p>
              <p className="text-sm font-semibold text-gray-900">
                {format(new Date(evaluacion.fecha), 'dd \'de\' MMMM \'de\' yyyy \'a las\' HH:mm', { locale: es })}
              </p>
            </div>

            {practica.nombreJefeDirecto && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Jefe Directo</p>
                <p className="text-sm font-semibold text-gray-900">
                  {practica.nombreJefeDirecto}
                  {practica.cargoJefeDirecto && ` - ${practica.cargoJefeDirecto}`}
                </p>
              </div>
            )}

            {practica.contactoCorreoJefe && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Contacto</p>
                <p className="text-sm font-semibold text-gray-900">{practica.contactoCorreoJefe}</p>
                {practica.contactoTelefonoJefe && (
                  <p className="text-sm font-semibold text-gray-900">{practica.contactoTelefonoJefe}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Evaluación Detallada */}
      <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            Evaluación del Informe
          </CardTitle>
          <CardDescription className="text-base">
            Evaluación realizada por el docente tutor sobre el informe de práctica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <h3 className="text-xl font-bold text-gray-900">Calificación Final</h3>
              <NotaDisplay nota={evaluacion.nota} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-semibold text-gray-700">Evaluado por</p>
                </div>
                <p className="text-base font-medium text-gray-900 ml-6">
                  {practica.docente.usuario.nombre} {practica.docente.usuario.apellido}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-semibold text-gray-700">Fecha de evaluación</p>
                </div>
                <p className="text-base font-medium text-gray-900 ml-6">
                  {format(new Date(evaluacion.fecha), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}
                </p>
              </div>
            </div>
          </div>

          {evaluacion.comentarios && (
            <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Comentarios del Docente</h3>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{evaluacion.comentarios}</p>
              </div>
            </div>
          )}

          {practica.tareasPrincipales && (
            <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-gray-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Tareas Principales Realizadas</h3>
              </div>
              <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r-lg">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{practica.tareasPrincipales}</p>
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
