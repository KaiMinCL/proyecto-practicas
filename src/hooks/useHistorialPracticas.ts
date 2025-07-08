import { useState, useCallback } from 'react';
import { EstadoPractica, TipoPractica } from '@prisma/client';

interface FiltrosPracticas {
  estados?: EstadoPractica[];
  fechaInicio?: Date;
  fechaFin?: Date;
  carreraId?: number;
  sedeId?: number;
  tipo?: TipoPractica;
  alumnoRut?: string;
  nombreAlumno?: string;
}

interface PracticaHistorial {
  id: number;
  alumno: {
    usuario: {
      rut: string;
      nombre: string;
      apellido: string;
    };
    carrera: {
      nombre: string;
      sede: {
        nombre: string;
      };
    };
  };
  docente: {
    usuario: {
      nombre: string;
      apellido: string;
    };
  };
  centroPractica?: {
    nombreEmpresa: string;
  };
  tipo: TipoPractica;
  fechaInicio: Date;
  fechaTermino: Date;
  estado: EstadoPractica;
  creadoEn: Date;
  actaFinal?: {
    notaFinal: number;
    fechaCierre: Date;
  };
}

interface PaginacionResultado {
  data: PracticaHistorial[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface EstadisticaPractica {
  porEstado: Array<{
    estado: string;
    count: number;
  }>;
  porTipo: Array<{
    tipo: string;
    count: number;
  }>;
  porCarrera: Array<{
    carrera: string;
    count: number;
  }>;
}

interface OpcionesFiltros {
  carreras: Array<{
    id: number;
    nombre: string;
    sede: {
      id: number;
      nombre: string;
    };
  }>;
  sedes: Array<{
    id: number;
    nombre: string;
  }>;
}

export function useHistorialPracticas() {
  const [filtros, setFiltros] = useState<FiltrosPracticas>({});
  const [practicas, setPracticas] = useState<PracticaHistorial[]>([]);
  const [paginacion, setPaginacion] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrevious: false
  });
  const [estadisticas, setEstadisticas] = useState<EstadisticaPractica>({
    porEstado: [],
    porTipo: [],
    porCarrera: []
  });
  const [opciones, setOpciones] = useState<OpcionesFiltros>({
    carreras: [],
    sedes: []
  });
  const [loading, setLoading] = useState(false);
  const [loadingOpciones, setLoadingOpciones] = useState(false);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const construirParametros = useCallback((filtros: FiltrosPracticas, page: number, limit: number) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (filtros.estados && filtros.estados.length > 0) {
      params.append('estados', filtros.estados.join(','));
    }
    if (filtros.fechaInicio) {
      params.append('fechaInicio', filtros.fechaInicio.toISOString());
    }
    if (filtros.fechaFin) {
      params.append('fechaFin', filtros.fechaFin.toISOString());
    }
    if (filtros.carreraId) {
      params.append('carreraId', filtros.carreraId.toString());
    }
    if (filtros.sedeId) {
      params.append('sedeId', filtros.sedeId.toString());
    }
    if (filtros.tipo) {
      params.append('tipo', filtros.tipo);
    }
    if (filtros.alumnoRut) {
      params.append('alumnoRut', filtros.alumnoRut);
    }
    if (filtros.nombreAlumno) {
      params.append('nombreAlumno', filtros.nombreAlumno);
    }
    
    return params;
  }, []);

  const cargarOpciones = useCallback(async () => {
    try {
      setLoadingOpciones(true);
      const response = await fetch('/api/reportes/opciones');
      
      if (!response.ok) {
        throw new Error('Error al cargar opciones');
      }
      
      const data = await response.json();
      setOpciones(data);
    } catch (error) {
      console.error('Error al cargar opciones:', error);
      setError('Error al cargar opciones de filtros');
    } finally {
      setLoadingOpciones(false);
    }
  }, []);

  const cargarHistorico = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = construirParametros(filtros, page, limit);
      const response = await fetch(`/api/reportes/historico?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar el histórico');
      }
      
      const data: PaginacionResultado = await response.json();
      
      setPracticas(data.data);
      setPaginacion({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalItems: data.totalItems,
        hasNext: data.hasNext,
        hasPrevious: data.hasPrevious
      });
    } catch (error) {
      console.error('Error al cargar histórico:', error);
      setError('Error al cargar el histórico de prácticas');
    } finally {
      setLoading(false);
    }
  }, [filtros, construirParametros]);

  const cargarEstadisticas = useCallback(async () => {
    try {
      setLoadingEstadisticas(true);
      const response = await fetch('/api/reportes/historico', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'estadisticas',
          filtros
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
      }
      
      const data = await response.json();
      setEstadisticas(data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoadingEstadisticas(false);
    }
  }, [filtros]);

  const exportarHistorico = useCallback(async () => {
    try {
      const response = await fetch('/api/reportes/historico', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'export',
          filtros
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al exportar');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historial-practicas-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al exportar:', error);
      throw new Error('Error al exportar el histórico');
    }
  }, [filtros]);

  const limpiarFiltros = useCallback(() => {
    setFiltros({});
  }, []);

  const actualizarFiltros = useCallback((nuevosFiltros: FiltrosPracticas) => {
    setFiltros(nuevosFiltros);
    setPaginacion(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  return {
    // Estado
    filtros,
    practicas,
    paginacion,
    estadisticas,
    opciones,
    loading,
    loadingOpciones,
    loadingEstadisticas,
    error,
    
    // Acciones
    cargarOpciones,
    cargarHistorico,
    cargarEstadisticas,
    exportarHistorico,
    limpiarFiltros,
    actualizarFiltros,
    setError
  };
}
