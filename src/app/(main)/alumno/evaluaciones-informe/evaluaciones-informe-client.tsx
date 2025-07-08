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
import { 
  FileText, 
  GraduationCap, 
  Calendar, 
  Star, 
  AlertCircle,
  Eye,
  User,
  MessageSquare
} from 'lucide-react';
import { getMisPracticasConEvaluacionInformeAction } from '../practicas/actions';

interface PracticaConEvaluacionInforme {
  id: number;
  fechaInicio: string;
  fechaTermino: string;
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
  evaluacionInformeDocente: {
    id: number;
    nota: number;
    fecha: string;
    comentarios: string | null;
  };
}

function NotaDisplay({ nota }: { nota: number }) {
  const getNotaInfo = (nota: number) => {
    if (nota >= 7) return 'bg-green-100 text-green-800 border-green-200';
    if (nota >= 6) return 'bg-blue-100 text-blue-800 border-blue-200'; 
    if (nota >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (nota >= 4) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };
  
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getNotaInfo(nota)}`}>
      <Star className="w-4 h-4 mr-1 fill-current" />
      {nota.toFixed(1)}
    </div>
  );
}

export function EvaluacionesInformeClient() {
  const [practicas, setPracticas] = useState<PracticaConEvaluacionInforme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarEvaluaciones() {
      try {
        const result = await getMisPracticasConEvaluacionInformeAction();
        
        if (result.success && result.data) {
          setPracticas(result.data as PracticaConEvaluacionInforme[]);
        } else {
          setError(result.error || 'Error al cargar las evaluaciones');
        }
      } catch (err) {
        setError('Error inesperado al cargar las evaluaciones');
        console.error('Error cargando evaluaciones:', err);
      } finally {
        setLoading(false);
      }
    }

    cargarEvaluaciones();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-9 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (practicas.length === 0) {
    return (
      <Card className="text-center py-16 border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-blue-50">
        <CardContent>
          <div className="max-w-md mx-auto">
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center border-2 border-white">
                <Star className="w-4 h-4 text-yellow-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              No hay evaluaciones de informe disponibles
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Aún no tienes evaluaciones de informe disponibles para consultar.
              Las evaluaciones aparecerán aquí una vez que los docentes tutores completen 
              la evaluación de tus informes de práctica.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/alumno/mis-practicas">
                <Button variant="outline" className="bg-white hover:bg-gray-50">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Ver mis prácticas
                </Button>
              </Link>
              <Link href="/alumno/subir-informe">
                <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Subir informe
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Se encontraron {practicas.length} evaluación{practicas.length !== 1 ? 'es' : ''} de informe
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {practicas.map((practica) => (
          <Card key={practica.id} className="hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-blue-200 group">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900">
                      {practica.carrera.nombre}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm text-gray-600 flex items-center gap-1">
                    <GraduationCap className="w-4 h-4" />
                    {practica.carrera.sede.nombre}
                  </CardDescription>
                </div>
                <NotaDisplay nota={practica.evaluacionInformeDocente.nota} />
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600 p-2 bg-gray-50 rounded-lg">
                  <GraduationCap className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium text-gray-700">Centro:</span>
                  <span className="ml-1 truncate">
                    {practica.centroPractica?.nombreEmpresa || 'No especificado'}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 p-2 bg-gray-50 rounded-lg">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium text-gray-700">Período:</span>
                  <span className="ml-1">
                    {format(new Date(practica.fechaInicio), 'dd MMM', { locale: es })} - {' '}
                    {format(new Date(practica.fechaTermino), 'dd MMM yyyy', { locale: es })}
                  </span>
                </div>
                
                <div className="flex items-start text-sm text-gray-600 p-2 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-700 block">Docente tutor:</span>
                    <span>
                      {practica.docente.usuario.nombre} {practica.docente.usuario.apellido}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="font-medium text-blue-700">Evaluado:</span>
                  <span className="ml-1 text-blue-700">
                    {format(new Date(practica.evaluacionInformeDocente.fecha), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}
                  </span>
                </div>
              </div>

              {practica.evaluacionInformeDocente.comentarios && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Comentarios del docente:
                  </p>
                  <p className="text-sm text-blue-700 line-clamp-3 leading-relaxed">
                    {practica.evaluacionInformeDocente.comentarios}
                  </p>
                </div>
              )}

              <Link href={`/alumno/evaluaciones-informe/${practica.id}`}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 transition-colors" variant="default">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Evaluación Detallada
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
