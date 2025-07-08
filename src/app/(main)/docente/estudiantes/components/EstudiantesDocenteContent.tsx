'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Eye,
  Search,
  Filter,
  BookOpen,
  Building,
  Calendar,
  GraduationCap,
  TrendingUp,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface EstudianteSupervision {
  id: number;
  usuario: {
    nombre: string;
    apellido: string;
    rut: string;
    email: string;
  };
  carrera: {
    id: number;
    nombre: string;
    sede: {
      id: number;
      nombre: string;
    };
  };
  practicas: {
    id: number;
    tipo: string;
    estado: string;
    fechaInicio: string;
    fechaTermino: string;
    centroPractica: {
      nombreEmpresa: string;
    } | null;
  }[];
  estadoActual: string;
  fechaUltimaPractica: string;
  totalPracticas: number;
}

interface EstadisticasSupervision {
  totalEstudiantes: number;
  estudiantesActivos: number;
  estudiantesFinalizados: number;
  totalPracticas: number;
  practicasEnCurso: number;
  practicasPendientes: number;
}

interface DocenteData {
  estudiantes: EstudianteSupervision[];
  estadisticas: EstadisticasSupervision;
  docente: {
    id: number;
    nombre: string;
    apellido: string;
  };
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

const TIPO_PRACTICA_LABELS: Record<string, string> = {
  'PRACTICA_I': 'Práctica I',
  'PRACTICA_II': 'Práctica II',
  'PRACTICA_PROFESIONAL': 'Práctica Profesional'
};

export function EstudiantesDocenteContent() {
  const [data, setData] = useState<DocenteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  const [carreraFilter, setCarreraFilter] = useState<string>('todas');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/docente/estudiantes');
        
        if (!response.ok) {
          throw new Error('Error al cargar los datos');
        }

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter students
  const filteredStudents = data?.estudiantes.filter(estudiante => {
    const matchesSearch = 
      estudiante.usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estudiante.usuario.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estudiante.usuario.rut.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = estadoFilter === 'todos' || estudiante.estadoActual === estadoFilter;
    const matchesCarrera = carreraFilter === 'todas' || estudiante.carrera.nombre === carreraFilter;
    
    return matchesSearch && matchesEstado && matchesCarrera;
  }) || [];

  // Get unique careers for filter
  const carreras = [...new Set(data?.estudiantes.map(e => e.carrera.nombre) || [])];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando estudiantes supervisados...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="font-medium">Error al cargar los datos</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-600">
            <p>No se encontraron datos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Estudiantes</p>
                <p className="text-2xl font-bold text-gray-900">{data.estadisticas.totalEstudiantes}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estudiantes Activos</p>
                <p className="text-2xl font-bold text-gray-900">{data.estadisticas.estudiantesActivos}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Prácticas en Curso</p>
                <p className="text-2xl font-bold text-gray-900">{data.estadisticas.practicasEnCurso}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Prácticas</p>
                <p className="text-2xl font-bold text-gray-900">{data.estadisticas.totalPracticas}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, apellido o RUT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {Object.entries(ESTADO_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={carreraFilter} onValueChange={setCarreraFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por carrera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las carreras</SelectItem>
                {carreras.map((carrera) => (
                  <SelectItem key={carrera} value={carrera}>{carrera}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Estudiantes Supervisados ({filteredStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No se encontraron estudiantes</p>
              <p className="text-sm text-gray-500">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((estudiante) => (
                <div key={estudiante.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Student Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {estudiante.usuario.nombre.charAt(0)}{estudiante.usuario.apellido.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {estudiante.usuario.nombre} {estudiante.usuario.apellido}
                          </h3>
                          <p className="text-sm text-gray-600">RUT: {estudiante.usuario.rut}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <GraduationCap className="w-4 h-4" />
                              {estudiante.carrera.nombre}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Building className="w-4 h-4" />
                              {estudiante.carrera.sede.nombre}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status and Stats */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Estado Actual</p>
                        <Badge className={`${ESTADO_COLORS[estudiante.estadoActual]} border`}>
                          {ESTADO_LABELS[estudiante.estadoActual]}
                        </Badge>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Total Prácticas</p>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-blue-600">{estudiante.totalPracticas}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Practices History */}
                  {estudiante.practicas.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-3">Historial de Prácticas</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {estudiante.practicas.slice(0, 3).map((practica) => (
                          <div key={practica.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">
                                {TIPO_PRACTICA_LABELS[practica.tipo] || practica.tipo}
                              </span>
                              <Badge className={`${ESTADO_COLORS[practica.estado]} border text-xs`}>
                                {ESTADO_LABELS[practica.estado]}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(practica.fechaInicio)} - {formatDate(practica.fechaTermino)}
                              </div>
                              {practica.centroPractica && (
                                <div className="flex items-center gap-1">
                                  <Building className="w-3 h-3" />
                                  {practica.centroPractica.nombreEmpresa}
                                </div>
                              )}
                            </div>
                            <div className="mt-2">
                              <Link href={`/docente/practicas/${practica.id}`}>
                                <Button variant="outline" size="sm" className="w-full">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Ver Detalle
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                      {estudiante.practicas.length > 3 && (
                        <p className="text-center text-sm text-gray-500 mt-3">
                          Y {estudiante.practicas.length - 3} práctica(s) más...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
