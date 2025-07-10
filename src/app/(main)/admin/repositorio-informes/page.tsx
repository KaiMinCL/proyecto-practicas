'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
  Building,
  AlertCircle,
  Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// --- INTERFACES ---
interface InformeHistorico {
  id: number;
  alumno: { usuario: { nombre: string; apellido: string; rut: string; } };
  carrera: { id: number; nombre: string; sede: { id: number; nombre: string; }; };
  docente: { usuario: { nombre: string; apellido: string; } };
  informeUrl: string;
  fechaTermino: string;
  tipo: string;
  evaluacionDocente?: { nota: number; fecha: string; } | null;
}

interface OpcionesFiltros {
  sedes: Array<{ id: number; nombre: string }>;
  carreras: Array<{ id: number; nombre: string; sedeId: number }>;
  aniosDisponibles: number[];
}

interface RepositorioApiResponse {
  informes: InformeHistorico[];
  total: number;
  totalPaginas: number;
  paginaActual: number;
}

// --- COMPONENTE ---
export default function AdminRepositorioInformesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [informes, setInformes] = useState<InformeHistorico[]>([]);
  const [opciones, setOpciones] = useState<OpcionesFiltros | null>(null);
  const [filters, setFilters] = useState({ sedeId: '', carreraId: '', anioAcademico: '', nombreAlumno: '', rutAlumno: '' });
  
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limite = 10;

  // --- EFECTOS Y MANEJADORES ---

  useEffect(() => {
    if (user && !['SUPER_ADMIN', 'DIRECTOR_CARRERA'].includes(user.rol)) {
      toast.error('No tienes permisos para acceder a esta página');
      router.push('/dashboard');
    }
  }, [user, router]);

  const cargarOpciones = useCallback(async () => {
    try {
      const response = await fetch('/api/repositorio-informes/opciones');
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Error al cargar opciones de filtro');
      setOpciones(result.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error desconocido');
    }
  }, []);

  const buscarInformes = useCallback(async (page = 1) => {
    setLoading(true);
    try {
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v != null && v !== '' && v !== '_ALL_')
        );
        const params = new URLSearchParams({ page: page.toString(), limite: limite.toString(), ...cleanFilters });
        const response = await fetch(`/api/repositorio-informes?${params.toString()}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Error al buscar informes');
        const data: RepositorioApiResponse = result.data;
        setInformes(data.informes);
        setTotalPaginas(data.totalPaginas);
        setPaginaActual(data.paginaActual);
    } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Error desconocido al buscar informes.');
    } finally {
        setLoading(false);
    }
  }, [filters]); // La dependencia de los filtros es correcta aquí

  // Este useEffect ahora solo se ejecuta UNA VEZ al montar el componente
  useEffect(() => {
    if (user) {
        cargarOpciones();
        buscarInformes(1); // Carga los datos iniciales
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Solo depende del usuario para la carga inicial
  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    const finalValue = value === '_ALL_' ? '' : value;
    setFilters(prev => ({ ...prev, [field]: finalValue, ...(field === 'sedeId' && { carreraId: '' }) }));
  };
  
  const handleApplyFilters = () => {
    setPaginaActual(1);
    buscarInformes(1);
  }

  const carrerasFiltradas = filters.sedeId && opciones
    ? opciones.carreras.filter(c => c.sedeId === parseInt(filters.sedeId))
    : opciones?.carreras;

  // --- FUNCIONES DE RENDERIZADO ---

  const getNotaBadge = (nota?: number) => {
    if (nota === undefined || nota === null) return <Badge variant="outline">Sin evaluar</Badge>;
    const color = nota >= 4.0 ? 'default' : 'destructive';
    return <Badge variant={color}>{nota.toFixed(1)}</Badge>;
  };
  
  const getTipoPracticaBadge = (tipo: string) => {
    return tipo === 'LABORAL' ? (
      <Badge variant="secondary">P. Laboral</Badge>
    ) : (
      <Badge variant="default">P. Profesional</Badge>
    );
  };
  
  if (!user) return <div className="text-center p-8">Cargando...</div>;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
          <Archive className="h-8 w-8" />
          Repositorio de Informes Históricos
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Consulta y descarga informes de prácticas finalizadas y evaluadas en el sistema.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5"/> Filtros</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex flex-wrap items-end gap-4">
                <div className="flex-grow min-w-[200px] space-y-2">
                    <label className="text-sm font-medium">Sede</label>
                    <Select value={filters.sedeId} onValueChange={(v) => handleFilterChange('sedeId', v)}>
                        <SelectTrigger><SelectValue placeholder="Todas las sedes" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_ALL_">Todas las sedes</SelectItem>
                            {opciones?.sedes.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.nombre}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex-grow min-w-[200px] space-y-2">
                    <label className="text-sm font-medium">Carrera</label>
                    <Select value={filters.carreraId} onValueChange={(v) => handleFilterChange('carreraId', v)} disabled={!filters.sedeId}>
                        <SelectTrigger><SelectValue placeholder="Todas las carreras" /></SelectTrigger>
                        <SelectContent>
                             <SelectItem value="_ALL_">Todas las carreras</SelectItem>
                            {carrerasFiltradas?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex-grow min-w-[150px] space-y-2">
                    <label className="text-sm font-medium">Año Término</label>
                    <Select value={filters.anioAcademico} onValueChange={(v) => handleFilterChange('anioAcademico', v)}>
                        <SelectTrigger><SelectValue placeholder="Todos los años" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_ALL_">Todos los años</SelectItem>
                            {opciones?.aniosDisponibles.map(a => <SelectItem key={a} value={a.toString()}>{a}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-grow min-w-[200px] space-y-2">
                    <label className="text-sm font-medium">Alumno o RUT</label>
                    <Input placeholder="Buscar..." value={filters.nombreAlumno} onChange={(e) => handleFilterChange('nombreAlumno', e.target.value)} />
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleApplyFilters} disabled={loading}>
                        <Search className="mr-2 h-4 w-4" />
                        {loading ? 'Buscando...' : 'Buscar'}
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Cargando informes...</div>
            ) : informes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 opacity-50 mb-4" />
                    No se encontraron informes con los filtros aplicados.
                </div>
            ) : (
                <div className="space-y-4">
                    {informes.map((informe) => (
                        <Card key={informe.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4 flex items-start justify-between gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{informe.alumno.usuario.nombre} {informe.alumno.usuario.apellido}</span>
                                        <Badge variant="outline">{informe.alumno.usuario.rut}</Badge>
                                        {getTipoPracticaBadge(informe.tipo)}
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-1 pl-6">
                                        <p className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /> {informe.carrera.nombre}</p>
                                        <p className="flex items-center gap-2"><Building className="h-4 w-4" /> {informe.carrera.sede.nombre}</p>
                                        <p className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Término: {format(new Date(informe.fechaTermino), 'dd/MM/yyyy')}</p>
                                    </div>
                                    <div className="flex items-center gap-2 pl-6">
                                        <span className="text-sm text-muted-foreground">Evaluación:</span>
                                        {getNotaBadge(informe.evaluacionDocente?.nota)}
                                    </div>
                                </div>
                                <Button onClick={() => window.open(informe.informeUrl, '_blank')} size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Descargar
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </CardContent>
        {totalPaginas > 1 && (
            <CardFooter className="flex items-center justify-end space-x-2 pt-4">
                 <span className="text-sm text-muted-foreground">Página {paginaActual} de {totalPaginas}</span>
                 <Button variant="outline" size="sm" onClick={() => buscarInformes(paginaActual - 1)} disabled={paginaActual <= 1 || loading}>
                     <ChevronLeft className="h-4 w-4" />
                 </Button>
                 <Button variant="outline" size="sm" onClick={() => buscarInformes(paginaActual + 1)} disabled={paginaActual >= totalPaginas || loading}>
                     <ChevronRight className="h-4 w-4" />
                 </Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}