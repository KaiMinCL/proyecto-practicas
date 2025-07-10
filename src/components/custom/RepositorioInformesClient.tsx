'use client';

import { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  FileText, 
  Calendar,
  User,
  GraduationCap,
  MapPin,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InformeHistorico {
  id: number;
  alumno: {
    usuario: {
      nombre: string;
      apellido: string;
      rut: string;
    };
  };
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
      nombre: string;
      apellido: string;
    };
  };
  informeUrl: string;
  fechaSubidaInforme: string | null;
  fechaTermino: string;
  tipo: string;
  evaluacionDocente?: {
    nota: number;
    fecha: string;
  } | null;
}

interface OpcionesFiltros {
  sedes: Array<{ id: number; nombre: string }>;
  carreras: Array<{ id: number; nombre: string; sedeId: number }>;
  aniosDisponibles: number[];
}

interface RepositorioInformesResponse {
  informes: InformeHistorico[];
  total: number;
  totalPaginas: number;
  paginaActual: number;
}

interface RepositorioInformesClientProps {
  rol: 'SUPER_ADMIN' | 'DIRECTOR_CARRERA' | 'COORDINADOR';
  className?: string;
}

export function RepositorioInformesClient({ rol, className = '' }: RepositorioInformesClientProps) {
  // Estados de datos
  const [informes, setInformes] = useState<InformeHistorico[]>([]);
  const [opciones, setOpciones] = useState<OpcionesFiltros>({
    sedes: [],
    carreras: [],
    aniosDisponibles: [],
  });
  
  // Estados de filtros
  const [filtros, setFiltros] = useState({
    sedeId: '',
    carreraId: '',
    anioAcademico: '',
    semestre: '',
    fechaDesde: '',
    fechaHasta: '',
    nombreAlumno: '',
    rutAlumno: '',
  });
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [buscando, setBuscando] = useState(false);
  
  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const limite = 20;

  // Determinar endpoint según rol
  const getEndpoint = () => {
    switch (rol) {
      case 'SUPER_ADMIN':
        return '/api/admin/repositorio-informes';
      case 'DIRECTOR_CARRERA':
        return '/api/admin/repositorio-informes'; // Usa mismo endpoint pero con restricciones
      case 'COORDINADOR':
        return '/api/coordinador/repositorio-informes';
      default:
        return '/api/admin/repositorio-informes';
    }
  };

  // Cargar opciones de filtros y buscar informes inicial
  useEffect(() => {
    cargarOpciones();
    buscarInformes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarOpciones = async () => {
    try {
      const response = await fetch(`${getEndpoint()}/opciones`);
      
      if (!response.ok) {
        throw new Error('Error al cargar opciones');
      }
      
      const data = await response.json();
      setOpciones(data);
    } catch (error) {
      console.error('Error al cargar opciones:', error);
      toast.error('Error al cargar las opciones de filtro');
    }
  };

  const buscarInformes = async (nuevaPagina: number = 1) => {
    try {
      setBuscando(true);
      
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      params.append('pagina', nuevaPagina.toString());
      params.append('limite', limite.toString());
      
      Object.entries(filtros).forEach(([key, value]) => {
        if (value && value.trim() !== '' && !['todas', 'todos', 'ambos'].includes(value.trim())) {
          params.append(key, value.trim());
        }
      });
      
      const response = await fetch(`${getEndpoint()}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Error al buscar informes');
      }
      
      const data: RepositorioInformesResponse = await response.json();
      
      setInformes(data.informes);
      setTotal(data.total);
      setTotalPaginas(data.totalPaginas);
      setPaginaActual(data.paginaActual);
      
    } catch (error) {
      console.error('Error al buscar informes:', error);
      toast.error('Error al buscar los informes históricos');
    } finally {
      setBuscando(false);
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    
    // Si cambia la sede, limpiar carrera
    if (campo === 'sedeId') {
      setFiltros(prev => ({ ...prev, carreraId: '' }));
    }
  };

  const limpiarFiltros = async () => {
    const filtrosLimpios = {
      sedeId: '',
      carreraId: '',
      anioAcademico: '',
      semestre: '',
      fechaDesde: '',
      fechaHasta: '',
      nombreAlumno: '',
      rutAlumno: '',
    };
    setFiltros(filtrosLimpios);
    setPaginaActual(1);
    
    // Ejecutar búsqueda sin filtros
    try {
      setBuscando(true);
      const response = await fetch(`${getEndpoint()}?pagina=1&limite=${limite}`);
      
      if (!response.ok) {
        throw new Error('Error al limpiar filtros');
      }
      
      const data: RepositorioInformesResponse = await response.json();
      setInformes(data.informes);
      setTotal(data.total);
      setTotalPaginas(data.totalPaginas);
      setPaginaActual(1);
      
    } catch (error) {
      console.error('Error al limpiar filtros:', error);
      toast.error('Error al limpiar los filtros');
    } finally {
      setBuscando(false);
    }
  };

  const handleBuscar = () => {
    setPaginaActual(1);
    buscarInformes(1);
  };

  const handlePaginar = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina);
    buscarInformes(nuevaPagina);
  };

  const descargarInforme = async (informe: InformeHistorico) => {
    // Verificar permisos según rol
    if (rol === 'COORDINADOR') {
      toast.info('Como coordinador, puedes ver pero no descargar informes directamente');
      return;
    }

    try {
      const response = await fetch(informe.informeUrl);
      if (!response.ok) {
        throw new Error('Error al descargar el informe');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe_${informe.alumno.usuario.nombre}_${informe.alumno.usuario.apellido}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Informe descargado exitosamente');
    } catch (error) {
      console.error('Error al descargar informe:', error);
      toast.error('Error al descargar el informe');
    }
  };

  const carrerasFiltradas = opciones.carreras.filter(carrera => 
    !filtros.sedeId || carrera.sedeId.toString() === filtros.sedeId
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filtros de búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primera fila de filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sede">Sede</Label>
              <Select
                value={filtros.sedeId}
                onValueChange={(value) => handleFiltroChange('sedeId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sede" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las sedes</SelectItem>
                  {opciones.sedes.map((sede) => (
                    <SelectItem key={sede.id} value={sede.id.toString()}>
                      {sede.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrera">Carrera</Label>
              <Select
                value={filtros.carreraId}
                onValueChange={(value) => handleFiltroChange('carreraId', value)}
                disabled={!filtros.sedeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar carrera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las carreras</SelectItem>
                  {carrerasFiltradas.map((carrera) => (
                    <SelectItem key={carrera.id} value={carrera.id.toString()}>
                      {carrera.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="anio">Año Académico</Label>
              <Select
                value={filtros.anioAcademico}
                onValueChange={(value) => handleFiltroChange('anioAcademico', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los años</SelectItem>
                  {opciones.aniosDisponibles.map((anio) => (
                    <SelectItem key={anio} value={anio.toString()}>
                      {anio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semestre">Semestre</Label>
              <Select
                value={filtros.semestre}
                onValueChange={(value) => handleFiltroChange('semestre', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambos">Ambos semestres</SelectItem>
                  <SelectItem value="1">Primer Semestre</SelectItem>
                  <SelectItem value="2">Segundo Semestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Segunda fila de filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaDesde">Fecha Desde</Label>
              <Input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaHasta">Fecha Hasta</Label>
              <Input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombreAlumno">Nombre Alumno</Label>
              <Input
                placeholder="Nombre del alumno"
                value={filtros.nombreAlumno}
                onChange={(e) => handleFiltroChange('nombreAlumno', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rutAlumno">RUT Alumno</Label>
              <Input
                placeholder="RUT del alumno"
                value={filtros.rutAlumno}
                onChange={(e) => handleFiltroChange('rutAlumno', e.target.value)}
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleBuscar} disabled={buscando} className="flex-1 md:flex-none">
              <Search className="w-4 h-4 mr-2" />
              {buscando ? 'Buscando...' : 'Buscar'}
            </Button>
            <Button variant="outline" onClick={limpiarFiltros} disabled={buscando}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Informes Históricos
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {total > 0 ? `${total} informes encontrados` : 'No hay informes'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : informes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No se encontraron informes con los filtros aplicados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {informes.map((informe) => (
                <div
                  key={informe.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {informe.alumno.usuario.nombre} {informe.alumno.usuario.apellido}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {informe.alumno.usuario.rut}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="w-4 h-4" />
                        <span>{informe.carrera.nombre}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{informe.carrera.sede.nombre}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Término: {format(new Date(informe.fechaTermino), 'dd/MM/yyyy', { locale: es })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {informe.evaluacionDocente && (
                        <Badge variant="default">
                          Nota: {informe.evaluacionDocente.nota}
                        </Badge>
                      )}
                      
                      {rol !== 'COORDINADOR' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => descargarInforme(informe)}
                          disabled={!informe.informeUrl}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Descargar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Página {paginaActual} de {totalPaginas}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePaginar(paginaActual - 1)}
                  disabled={paginaActual <= 1 || buscando}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePaginar(paginaActual + 1)}
                  disabled={paginaActual >= totalPaginas || buscando}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
