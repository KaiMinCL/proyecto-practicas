'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks';
import { useRouter } from 'next/navigation';
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

export default function RepositorioInformesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Proteger la ruta - solo DC/Coordinador pueden acceder
  useEffect(() => {
    if (mounted && user && !['DIRECTOR_CARRERA', 'COORDINADOR', 'SUPER_ADMIN'].includes(user.rol)) {
      toast.error('No tienes permisos para acceder a esta página');
      router.push('/dashboard');
    }
  }, [mounted, user, router]);

  // Cargar opciones de filtros y buscar informes inicial
  useEffect(() => {
    if (mounted && user && ['DIRECTOR_CARRERA', 'COORDINADOR', 'SUPER_ADMIN'].includes(user.rol)) {
      cargarOpciones();
      buscarInformes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, user]);

  const cargarOpciones = async () => {
    try {
      const response = await fetch('/api/repositorio-informes/opciones');
      
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
    if (!user) return;
    
    try {
      setBuscando(true);
      
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      params.append('pagina', nuevaPagina.toString());
      params.append('limite', limite.toString());
      
      Object.entries(filtros).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params.append(key, value.trim());
        }
      });
      
      const response = await fetch(`/api/repositorio-informes?${params.toString()}`);
      
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

  const limpiarFiltros = () => {
    setFiltros({
      sedeId: '',
      carreraId: '',
      anioAcademico: '',
      semestre: '',
      fechaDesde: '',
      fechaHasta: '',
      nombreAlumno: '',
      rutAlumno: '',
    });
    setPaginaActual(1);
  };

  const aplicarFiltros = () => {
    setPaginaActual(1);
    buscarInformes(1);
  };

  const descargarInforme = (informe: InformeHistorico) => {
    window.open(informe.informeUrl, '_blank');
  };

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return 'No disponible';
    return format(new Date(fecha), 'PPP', { locale: es });
  };

  const getTipoPracticaBadge = (tipo: string) => {
    return tipo === 'LABORAL' ? (
      <Badge variant="secondary">Práctica Laboral</Badge>
    ) : (
      <Badge variant="default">Práctica Profesional</Badge>
    );
  };

  const getNotaBadge = (nota?: number) => {
    if (!nota) return <Badge variant="outline">Sin evaluar</Badge>;
    
    const color = nota >= 4.0 ? 'default' : nota >= 3.0 ? 'secondary' : 'destructive';
    return <Badge variant={color}>{nota.toFixed(1)}</Badge>;
  };

  // Filtrar carreras por sede seleccionada
  const carrerasFiltradas = filtros.sedeId 
    ? opciones.carreras.filter(c => c.sedeId === parseInt(filtros.sedeId))
    : opciones.carreras;

  if (!mounted) {
    return <div>Cargando...</div>;
  }

  if (!user || !['DIRECTOR_CARRERA', 'COORDINADOR', 'SUPER_ADMIN'].includes(user.rol)) {
    return <div>Acceso denegado</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Repositorio de Informes Históricos</h1>
          <p className="text-muted-foreground">
            Consulta y descarga informes de práctica con capacidad de búsqueda avanzada
          </p>
        </div>
        <Button
          onClick={() => buscarInformes(paginaActual)}
          disabled={buscando}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${buscando ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Filtros de Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primera fila: Ubicación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sede">Sede</Label>
              <Select
                value={filtros.sedeId}
                onValueChange={(value) => handleFiltroChange('sedeId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las sedes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las sedes</SelectItem>
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
                  <SelectValue placeholder="Todas las carreras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las carreras</SelectItem>
                  {carrerasFiltradas.map((carrera) => (
                    <SelectItem key={carrera.id} value={carrera.id.toString()}>
                      {carrera.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Segunda fila: Tiempo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="anio">Año Académico</Label>
              <Select
                value={filtros.anioAcademico}
                onValueChange={(value) => handleFiltroChange('anioAcademico', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los años" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los años</SelectItem>
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
                  <SelectValue placeholder="Ambos semestres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ambos semestres</SelectItem>
                  <SelectItem value="1">Primer Semestre</SelectItem>
                  <SelectItem value="2">Segundo Semestre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaDesde">Fecha Desde</Label>
              <Input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
              />
            </div>
          </div>

          {/* Tercera fila: Búsqueda de alumno */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaHasta">Fecha Hasta</Label>
              <Input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombreAlumno">Nombre Alumno</Label>
              <Input
                placeholder="Buscar por nombre o apellido"
                value={filtros.nombreAlumno}
                onChange={(e) => handleFiltroChange('nombreAlumno', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rutAlumno">RUT Alumno</Label>
              <Input
                placeholder="Buscar por RUT"
                value={filtros.rutAlumno}
                onChange={(e) => handleFiltroChange('rutAlumno', e.target.value)}
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 pt-4">
            <Button onClick={aplicarFiltros} disabled={buscando}>
              <Search className="h-4 w-4 mr-2" />
              {buscando ? 'Buscando...' : 'Buscar'}
            </Button>
            <Button variant="outline" onClick={limpiarFiltros}>
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Informes Encontrados
            </CardTitle>
            {total > 0 && (
              <Badge variant="outline">
                {total} informe{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Cargando informes...
            </div>
          ) : informes.length === 0 ? (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                No se encontraron informes con los criterios de búsqueda especificados.
                Intenta ajustar los filtros o limpiarlos para ver más resultados.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {informes.map((informe) => (
                <Card key={informe.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        {/* Info del alumno */}
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {informe.alumno.usuario.nombre} {informe.alumno.usuario.apellido}
                          </span>
                          <Badge variant="outline">{informe.alumno.usuario.rut}</Badge>
                          {getTipoPracticaBadge(informe.tipo)}
                        </div>

                        {/* Info de carrera y sede */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <GraduationCap className="h-4 w-4" />
                            <span>{informe.carrera.nombre}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{informe.carrera.sede.nombre}</span>
                          </div>
                        </div>

                        {/* Info del docente y fechas */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>
                              Docente: {informe.docente.usuario.nombre} {informe.docente.usuario.apellido}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Término: {formatearFecha(informe.fechaTermino)}</span>
                          </div>
                        </div>

                        {/* Evaluación */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Evaluación:</span>
                          {getNotaBadge(informe.evaluacionDocente?.nota)}
                          {informe.evaluacionDocente?.fecha && (
                            <span className="text-xs text-muted-foreground">
                              ({formatearFecha(informe.evaluacionDocente.fecha)})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botón de descarga */}
                      <Button
                        onClick={() => descargarInforme(informe)}
                        size="sm"
                        className="ml-4"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPaginas > 1 && (
            <>
              <Separator className="my-6" />
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Página {paginaActual} de {totalPaginas} 
                  ({((paginaActual - 1) * limite) + 1}-{Math.min(paginaActual * limite, total)} de {total})
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => buscarInformes(paginaActual - 1)}
                    disabled={paginaActual <= 1 || buscando}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => buscarInformes(paginaActual + 1)}
                    disabled={paginaActual >= totalPaginas || buscando}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
