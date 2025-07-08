"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Download, 
  Eye, 
  FileText, 
  GraduationCap, 
  User, 
  Calendar,
  Filter,
  RefreshCw,
  Archive,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { 
  obtenerActasHistoricasAction,
  obtenerSedesDisponiblesAction,
  obtenerCarrerasDisponiblesAction
} from './actions';

// Tipos
interface ActaHistorica {
  id: number;
  practicaId: number;
  tipo: 'ACTA1' | 'EVALUACION_INFORME' | 'EVALUACION_EMPLEADOR' | 'ACTA_FINAL';
  titulo: string;
  fechaCreacion: Date;
  estado: string;
  alumno: {
    nombre: string;
    apellido: string;
    rut: string;
  };
  carrera: {
    nombre: string;
    sede: {
      nombre: string;
    };
  };
  docente?: {
    nombre: string;
    apellido: string;
  };
  nota?: number;
  notaFinal?: number;
}

interface FiltrosRepositorio {
  alumnoQuery: string;
  sedeId: string;
  carreraId: string;
  anioAcademico: string;
  semestre: string;
  tipoActa: string;
}

const TIPOS_ACTA_OPTIONS = [
  { value: 'ACTA1', label: 'Acta 1 - Supervisión', icon: FileText },
  { value: 'EVALUACION_INFORME', label: 'Evaluación de Informe', icon: GraduationCap },
  { value: 'EVALUACION_EMPLEADOR', label: 'Acta 2 - Evaluación Empleador', icon: Star },
  { value: 'ACTA_FINAL', label: 'Acta Final de Evaluación', icon: Archive }
];

const ESTADO_COLORS = {
  'PENDIENTE': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  'EN_CURSO': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  'FINALIZADA_PENDIENTE_EVAL': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  'EVALUACION_COMPLETA': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  'CERRADA': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  'COMPLETADA': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  'VALIDADA': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
};

const TIPO_ACTA_COLORS = {
  'ACTA1': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  'EVALUACION_INFORME': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  'EVALUACION_EMPLEADOR': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  'ACTA_FINAL': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
};

export function RepositorioActasClient() {
  // Estados principales
  const [, setActas] = useState<ActaHistorica[]>([]);
  const [filteredActas, setFilteredActas] = useState<ActaHistorica[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Estados para opciones de filtros
  const [sedes, setSedes] = useState<{ id: number; nombre: string }[]>([]);
  const [carreras, setCarreras] = useState<{ id: number; nombre: string; sede: { nombre: string } }[]>([]);
  const [carrerasFiltradas, setCarrerasFiltradas] = useState<{ id: number; nombre: string; sede: { nombre: string } }[]>([]);
  
  // Estados de filtros
  const [filtros, setFiltros] = useState<FiltrosRepositorio>({
    alumnoQuery: '',
    sedeId: '',
    carreraId: '',
    anioAcademico: '',
    semestre: '',
    tipoActa: ''
  });

  // Estado de error
  const [error, setError] = useState<string | null>(null);

  // Función para buscar actas
  const buscarActas = useCallback(async (filtrosCustom?: Partial<FiltrosRepositorio>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const filtrosParaBusqueda = filtrosCustom || filtros;
      
      // Convertir filtros a formato del servicio
      const filtrosServicio = {
        alumnoQuery: filtrosParaBusqueda.alumnoQuery?.trim() || undefined,
        sedeId: filtrosParaBusqueda.sedeId ? parseInt(filtrosParaBusqueda.sedeId) : undefined,
        carreraId: filtrosParaBusqueda.carreraId ? parseInt(filtrosParaBusqueda.carreraId) : undefined,
        anioAcademico: filtrosParaBusqueda.anioAcademico ? parseInt(filtrosParaBusqueda.anioAcademico) : undefined,
        semestre: filtrosParaBusqueda.semestre ? parseInt(filtrosParaBusqueda.semestre) : undefined,
        tipoActa: filtrosParaBusqueda.tipoActa && filtrosParaBusqueda.tipoActa !== '' 
          ? filtrosParaBusqueda.tipoActa as 'ACTA1' | 'EVALUACION_INFORME' | 'EVALUACION_EMPLEADOR' | 'ACTA_FINAL' 
          : undefined
      };

      const result = await obtenerActasHistoricasAction(filtrosServicio);
      
      if (result.success && result.data) {
        setActas(result.data);
        setFilteredActas(result.data);
        if (result.message) {
          toast.success(result.message);
        }
      } else {
        setError(result.error || 'Error al buscar actas');
        setActas([]);
        setFilteredActas([]);
      }
    } catch (error) {
      console.error('Error buscando actas:', error);
      setError('Error inesperado al buscar actas');
      setActas([]);
      setFilteredActas([]);
    } finally {
      setIsLoading(false);
    }
  }, [filtros]);

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setIsLoading(true);
      try {
        // Cargar sedes
        const sedesResult = await obtenerSedesDisponiblesAction();
        if (sedesResult.success && sedesResult.data) {
          setSedes(sedesResult.data);
        }

        // Cargar carreras
        const carrerasResult = await obtenerCarrerasDisponiblesAction();
        if (carrerasResult.success && carrerasResult.data) {
          setCarreras(carrerasResult.data);
          setCarrerasFiltradas(carrerasResult.data);
        }

        // Cargar actas iniciales (sin filtros)
        await buscarActas({});

      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        setError('Error al cargar los datos iniciales');
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    };

    cargarDatosIniciales();
  }, [buscarActas]);

  // Filtrar carreras cuando cambie la sede seleccionada
  useEffect(() => {
    if (filtros.sedeId) {
      const carrerasFiltradas = carreras.filter(
        carrera => carrera.id.toString() === filtros.sedeId || 
        (sedes.find(sede => sede.id.toString() === filtros.sedeId)?.nombre === carrera.sede.nombre)
      );
      setCarrerasFiltradas(carrerasFiltradas);
      
      // Limpiar carrera seleccionada si no está en la sede
      if (filtros.carreraId && !carrerasFiltradas.find(c => c.id.toString() === filtros.carreraId)) {
        setFiltros(prev => ({ ...prev, carreraId: '' }));
      }
    } else {
      setCarrerasFiltradas(carreras);
    }
  }, [filtros.sedeId, carreras, sedes, filtros.carreraId]);

  // Manejar cambios en filtros
  const handleFiltroChange = (key: keyof FiltrosRepositorio, value: string) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Manejar búsqueda
  const handleBuscar = async () => {
    await buscarActas();
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    const filtrosVacios = {
      alumnoQuery: '',
      sedeId: '',
      carreraId: '',
      anioAcademico: '',
      semestre: '',
      tipoActa: ''
    };
    setFiltros(filtrosVacios);
    buscarActas(filtrosVacios);
  };

  // Función para ver/descargar acta
  const handleVerActa = (acta: ActaHistorica) => {
    // Navegar a la vista detallada del acta
    window.open(`/coordinador/repositorio-actas/${acta.practicaId}/${acta.tipo.toLowerCase()}`, '_blank');
  };

  // Función para descargar acta
  const handleDescargarActa = () => {
    // TODO: Implementar descarga de PDF
    toast.info('Función de descarga en desarrollo');
  };

  // Obtener años disponibles para el filtro
  const obtenerAniosDisponibles = () => {
    const anioActual = new Date().getFullYear();
    const anios = [];
    for (let i = anioActual; i >= 2020; i--) {
      anios.push(i);
    }
    return anios;
  };

  if (isInitialLoad) {
    return <RepositorioActasLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Filtros de Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros de Búsqueda</span>
          </CardTitle>
          <CardDescription>
            Utiliza los filtros para encontrar actas específicas en el repositorio histórico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Búsqueda por Alumno */}
            <div>
              <Label htmlFor="alumnoQuery">Buscar Alumno (Nombre o RUT)</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="alumnoQuery"
                  placeholder="Ej: Juan Pérez o 12345678-9"
                  value={filtros.alumnoQuery}
                  onChange={(e) => handleFiltroChange('alumnoQuery', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por Sede */}
            <div>
              <Label htmlFor="sede">Sede</Label>
              <Select
                value={filtros.sedeId}
                onValueChange={(value) => handleFiltroChange('sedeId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sede" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las sedes</SelectItem>
                  {sedes.map(sede => (
                    <SelectItem key={sede.id} value={sede.id.toString()}>
                      {sede.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Carrera */}
            <div>
              <Label htmlFor="carrera">Carrera</Label>
              <Select
                value={filtros.carreraId}
                onValueChange={(value) => handleFiltroChange('carreraId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar carrera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las carreras</SelectItem>
                  {carrerasFiltradas.map(carrera => (
                    <SelectItem key={carrera.id} value={carrera.id.toString()}>
                      {carrera.nombre} ({carrera.sede.nombre})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Año Académico */}
            <div>
              <Label htmlFor="anioAcademico">Año Académico</Label>
              <Select
                value={filtros.anioAcademico}
                onValueChange={(value) => handleFiltroChange('anioAcademico', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar año" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los años</SelectItem>
                  {obtenerAniosDisponibles().map(anio => (
                    <SelectItem key={anio} value={anio.toString()}>
                      {anio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Semestre */}
            <div>
              <Label htmlFor="semestre">Semestre</Label>
              <Select
                value={filtros.semestre}
                onValueChange={(value) => handleFiltroChange('semestre', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar semestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ambos semestres</SelectItem>
                  <SelectItem value="1">Primer Semestre (Mar-Jul)</SelectItem>
                  <SelectItem value="2">Segundo Semestre (Ago-Dic)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Tipo de Acta */}
            <div>
              <Label htmlFor="tipoActa">Tipo de Acta</Label>
              <Select
                value={filtros.tipoActa}
                onValueChange={(value) => handleFiltroChange('tipoActa', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los tipos</SelectItem>
                  {TIPOS_ACTA_OPTIONS.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button 
              onClick={handleBuscar} 
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span>Buscar Actas</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={limpiarFiltros}
              disabled={isLoading}
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados de Búsqueda</CardTitle>
          <CardDescription>
            {filteredActas.length > 0 
              ? `${filteredActas.length} acta(s) encontrada(s) en el repositorio`
              : 'No se encontraron actas que coincidan con los criterios de búsqueda'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredActas.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Carrera / Sede</TableHead>
                    <TableHead>Tipo de Acta</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead>Docente</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActas.map((acta) => (
                    <TableRow key={acta.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {acta.alumno.nombre} {acta.alumno.apellido}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {acta.alumno.rut}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{acta.carrera.nombre}</div>
                          <div className="text-xs text-muted-foreground">{acta.carrera.sede.nombre}</div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={TIPO_ACTA_COLORS[acta.tipo]}
                        >
                          {TIPOS_ACTA_OPTIONS.find(t => t.value === acta.tipo)?.label || acta.tipo}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(acta.fechaCreacion), 'PPP', { locale: es })}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={ESTADO_COLORS[acta.estado as keyof typeof ESTADO_COLORS] || ESTADO_COLORS.PENDIENTE}
                        >
                          {acta.estado.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {acta.nota && (
                          <span className="font-medium">
                            {acta.nota.toFixed(1)}
                          </span>
                        )}
                        {acta.notaFinal && (
                          <span className="font-medium">
                            {acta.notaFinal.toFixed(1)}
                          </span>
                        )}
                        {!acta.nota && !acta.notaFinal && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {acta.docente ? (
                          <span className="text-sm">
                            {acta.docente.nombre} {acta.docente.apellido}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">No asignado</span>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerActa(acta)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDescargarActa()}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : !isLoading && (
            <div className="text-center py-8">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No hay actas disponibles
              </h3>
              <p className="text-sm text-muted-foreground">
                Ajusta los filtros de búsqueda para encontrar actas en el repositorio
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de loading
function RepositorioActasLoading() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
