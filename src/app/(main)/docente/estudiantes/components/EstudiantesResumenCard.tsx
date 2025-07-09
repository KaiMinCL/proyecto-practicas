'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Clock, 
  ExternalLink,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';

interface EstudianteResumen {
  id: number;
  usuario: {
    nombre: string;
    apellido: string;
    rut: string;
  };
  carrera: {
    nombre: string;
  };
  estadoActual: string;
  totalPracticas: number;
}

interface EstudiantesResumenProps {
  estudiantes: EstudianteResumen[];
  estadisticas: {
    totalEstudiantes: number;
    estudiantesActivos: number;
    practicasEnCurso: number;
  };
  loading?: boolean;
}

const ESTADO_LABELS: Record<string, string> = {
  'PENDIENTE': 'Pendiente',
  'PENDIENTE_ACEPTACION_DOCENTE': 'Pendiente Aceptación',
  'RECHAZADA_DOCENTE': 'Rechazada',
  'EN_CURSO': 'En Curso',
  'FINALIZADA_PENDIENTE_EVAL': 'Finalizada - Pendiente Evaluación',
  'EVALUACION_COMPLETA': 'Evaluación Completa',
  'CERRADA': 'Cerrada',
  'ANULADA': 'Anulada'
};

const ESTADO_COLORS: Record<string, string> = {
  'PENDIENTE': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'PENDIENTE_ACEPTACION_DOCENTE': 'bg-orange-100 text-orange-800 border-orange-200',
  'RECHAZADA_DOCENTE': 'bg-red-100 text-red-800 border-red-200',
  'EN_CURSO': 'bg-blue-100 text-blue-800 border-blue-200',
  'FINALIZADA_PENDIENTE_EVAL': 'bg-purple-100 text-purple-800 border-purple-200',
  'EVALUACION_COMPLETA': 'bg-green-100 text-green-800 border-green-200',
  'CERRADA': 'bg-gray-100 text-gray-800 border-gray-200',
  'ANULADA': 'bg-red-100 text-red-800 border-red-200'
};

export function EstudiantesResumenCard({ estudiantes, estadisticas, loading = false }: EstudiantesResumenProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Mis Alumnos Supervisados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-gray-500">Cargando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const estudiantesRecientes = estudiantes.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Mis Alumnos Supervisados
          </CardTitle>
          <Link href="/docente/estudiantes">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-1" />
              Ver Todo
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{estadisticas.totalEstudiantes}</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{estadisticas.estudiantesActivos}</p>
            <p className="text-xs text-gray-600">Activos</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{estadisticas.practicasEnCurso}</p>
            <p className="text-xs text-gray-600">En Curso</p>
          </div>
        </div>

        {/* Recent Students */}
        {estudiantesRecientes.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 mb-3">Estudiantes Recientes</h4>
            {estudiantesRecientes.map((estudiante) => (
              <div key={estudiante.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {estudiante.usuario.nombre.charAt(0)}{estudiante.usuario.apellido.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {estudiante.usuario.nombre} {estudiante.usuario.apellido}
                    </p>
                    <p className="text-xs text-gray-600">{estudiante.carrera.nombre}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">{estudiante.totalPracticas}</span>
                  </div>
                  <Badge className={`${ESTADO_COLORS[estudiante.estadoActual]} border text-xs`}>
                    {ESTADO_LABELS[estudiante.estadoActual]}
                  </Badge>
                </div>
              </div>
            ))}
            {estudiantes.length > 5 && (
              <div className="text-center pt-2">
                <Link href="/docente/estudiantes">
                  <Button variant="ghost" size="sm" className="text-sm">
                    Ver {estudiantes.length - 5} estudiante(s) más
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No tienes estudiantes asignados</p>
            <p className="text-sm text-gray-500">Los estudiantes aparecerán aquí cuando se te asignen prácticas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
