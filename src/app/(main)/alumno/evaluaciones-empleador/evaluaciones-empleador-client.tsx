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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Building2, 
  Calendar, 
  Star, 
  AlertCircle,
  Eye
} from 'lucide-react';
import { getMisPracticasConEvaluacionEmpleadorAction } from '../practicas/actions';

interface PracticaConEvaluacion {
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
  evaluacionEmpleador: {
    id: number;
    nota: number;
    fecha: string;
    comentarios: string | null;
  };
}

function NotaDisplay({ nota }: { nota: number }) {
  const color = nota >= 7 ? 'bg-green-100 text-green-800' : 
               nota >= 5 ? 'bg-yellow-100 text-yellow-800' : 
               'bg-red-100 text-red-800';
  
  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${color}`}>
      <Star className="w-4 h-4 mr-1" />
      {nota.toFixed(1)}
    </div>
  );
}

export function EvaluacionesEmpleadorClient() {
  const [practicas, setPracticas] = useState<PracticaConEvaluacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarEvaluaciones() {
      try {
        const result = await getMisPracticasConEvaluacionEmpleadorAction();
        
        if (result.success && result.data) {
          setPracticas(result.data);
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
      <Card className="text-center py-12">
        <CardContent>
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay evaluaciones disponibles
          </h3>
          <p className="text-gray-600 mb-6">
            Aún no tienes evaluaciones de empleador disponibles para consultar.
            Las evaluaciones aparecerán aquí una vez que los empleadores las completen.
          </p>
          <Link href="/alumno/mis-practicas">
            <Button variant="outline">
              Ver mis prácticas
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Se encontraron {practicas.length} evaluación{practicas.length !== 1 ? 'es' : ''} de empleador
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {practicas.map((practica) => (
          <Card key={practica.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                    {practica.carrera.nombre}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    {practica.carrera.sede.nombre}
                  </CardDescription>
                </div>
                <NotaDisplay nota={practica.evaluacionEmpleador.nota} />
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Building2 className="w-4 h-4 mr-2" />
                  <span>
                    {practica.centroPractica?.nombreEmpresa || 'Empresa no especificada'}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    {format(new Date(practica.fechaInicio), 'dd MMM yyyy', { locale: es })} - {' '}
                    {format(new Date(practica.fechaTermino), 'dd MMM yyyy', { locale: es })}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Docente tutor:</span>{' '}
                  {practica.docente.usuario.nombre} {practica.docente.usuario.apellido}
                </div>
                
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Evaluado el:</span>{' '}
                  {format(new Date(practica.evaluacionEmpleador.fecha), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}
                </div>
              </div>

              {practica.evaluacionEmpleador.comentarios && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-1">Comentarios:</p>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {practica.evaluacionEmpleador.comentarios}
                  </p>
                </div>
              )}

              <Link href={`/alumno/evaluaciones-empleador/${practica.id}`}>
                <Button className="w-full" variant="default">
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
