import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, User, Calendar, Award, Eye, FileText } from 'lucide-react';
import Link from 'next/link';
import type { UserJwtPayload } from '@/lib/auth-utils';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface PracticaAsignada {
  id: number;
  alumno: {
    usuario: { nombre: string; apellido: string; rut: string };
    carrera: { nombre: string };
  };
  centroPractica?: { nombreEmpresa?: string };
  fechaInicio: string;
  fechaTermino: string;
  tipo: string;
  estado: string;
  evaluacionEmpleador?: { nota: number; fecha: string };
}

interface DashboardEmpleadorProps {
  user: UserJwtPayload;
}

const EstadoColors: Record<string, string> = {
  'EN_CURSO': 'bg-blue-100 text-blue-800',
  'FINALIZADA_PENDIENTE_EVAL': 'bg-orange-100 text-orange-800',
  'EVALUACION_COMPLETA': 'bg-green-100 text-green-800',
  'CERRADA': 'bg-gray-100 text-gray-800',
};

const EstadoLabels: Record<string, string> = {
  'EN_CURSO': 'En Curso',
  'FINALIZADA_PENDIENTE_EVAL': 'Pendiente Evaluación',
  'EVALUACION_COMPLETA': 'Evaluación Completa',
  'CERRADA': 'Cerrada',
};

export function DashboardEmpleador({ user }: DashboardEmpleadorProps) {
  const [practicas, setPracticas] = useState<PracticaAsignada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPracticas = async () => {
      try {
        const empleadorResponse = await fetch(`/api/empleadores/by-user/${user.userId}`);
        if (!empleadorResponse.ok) throw new Error('No se pudo obtener la información del empleador');
        const empleadorData = await empleadorResponse.json();
        const empleadorId = empleadorData.id;
        if (!empleadorId) throw new Error('No se encontró el empleador asociado al usuario');
        const response = await fetch(`/api/empleadores/${empleadorId}/practicas`);
        const data = await response.json();
        if (data.success && data.practicas) setPracticas(data.practicas);
        else throw new Error(data.message || 'Error al cargar las prácticas');
      } catch (err: any) {
        setError(err.message || 'Error inesperado al cargar las prácticas');
      } finally {
        setLoading(false);
      }
    };
    fetchPracticas();
  }, [user.userId]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">¡Bienvenido, {user.nombre} {user.apellido}!</h1>
        <p className="text-white/90">Panel de Gestión de Prácticas como Empleador</p>
        <Badge variant="secondary" className="mt-3 bg-white/20 text-white border-white/30">Empleador</Badge>
      </div>
      {error && (
        <Card><CardContent className="p-4 text-destructive font-semibold">{error}</CardContent></Card>
      )}
      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Estudiantes</CardTitle>
            <User className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{practicas.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registrados en tu empresa</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Curso</CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{practicas.filter(p => p.estado === 'EN_CURSO').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Prácticas activas</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendiente Evaluación</CardTitle>
            <Award className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{practicas.filter(p => p.estado === 'FINALIZADA_PENDIENTE_EVAL').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Requieren tu evaluación</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Evaluadas</CardTitle>
            <Building className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{practicas.filter(p => p.evaluacionEmpleador).length}</div>
            <p className="text-xs text-muted-foreground mt-1">Evaluaciones completadas</p>
          </CardContent>
        </Card>
      </div>
      {/* Lista de prácticas */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : practicas.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No hay estudiantes asignados</h3>
            <p className="mt-2 text-muted-foreground">Actualmente no tienes estudiantes en práctica asignados para evaluar.</p>
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
                  <Badge className={EstadoColors[practica.estado] || 'bg-muted text-muted-foreground'}>
                    {EstadoLabels[practica.estado] || practica.estado}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">{practica.alumno.carrera.nombre}</div>
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
                </div>
                {practica.evaluacionEmpleador && (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-green-700">
                        <FileText className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Evaluación Completada</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold px-2 py-1 rounded bg-green-100 text-green-800">
                          {practica.evaluacionEmpleador.nota.toFixed(1)}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-green-700 mt-2 flex items-center">
                      Evaluado el {formatDate(practica.evaluacionEmpleador.fecha)}
                    </p>
                  </div>
                )}
                <div className="flex gap-2 pt-3">
                  {!practica.evaluacionEmpleador && (practica.estado === 'FINALIZADA_PENDIENTE_EVAL' || practica.estado === 'EN_CURSO') && (
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/empleador/evaluar/${practica.id}`}>
                        <FileText className="h-4 w-4 mr-2" />
                        {practica.estado === 'EN_CURSO' ? 'Evaluar' : 'Evaluar Ahora'}
                      </Link>
                    </Button>
                  )}
                  {practica.evaluacionEmpleador && (
                    <Button asChild variant="outline" size="sm" className="flex-1 border-green-600 text-green-700 hover:bg-green-50">
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
  );
}
