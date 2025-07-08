'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, History, TrendingUp, RefreshCw } from 'lucide-react';
import { 
  FiltrosPracticasComponent, 
  TablaPracticas, 
  Paginacion, 
  EstadisticasRapidas,
  DetallePracticaDialog 
} from '@/components/custom';
import { useHistorialPracticas, usePracticaDetalle } from '@/hooks';
import { EstadoPractica, TipoPractica } from '@prisma/client';

export default function HistoricoPracticasPage() {
  const { user, isLoading: authLoading } = useAuth();
  const {
    filtros,
    practicas,
    paginacion,
    estadisticas,
    opciones,
    loading,
    loadingOpciones,
    loadingEstadisticas,
    error,
    cargarOpciones,
    cargarHistorico,
    cargarEstadisticas,
    exportarHistorico,
    limpiarFiltros,
    actualizarFiltros,
    setError
  } = useHistorialPracticas();
  
  const {
    practica: practicaDetalle,
    loading: loadingDetalle,
    error: errorDetalle,
    obtenerPractica,
    limpiarPractica
  } = usePracticaDetalle();
  
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  const esSuperAdmin = user?.rol === 'SUPER_ADMIN';

  // Cargar opciones de filtros
  const cargarOpcionesWrapper = useCallback(async () => {
    try {
      await cargarOpciones();
    } catch (error) {
      console.error('Error al cargar opciones:', error);
      setError('Error al cargar opciones de filtros');
    }
  }, [cargarOpciones, setError]);

  // Cargar estadísticas
  const cargarEstadisticasWrapper = useCallback(async () => {
    try {
      await cargarEstadisticas();
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }, [cargarEstadisticas]);

  // Manejar ver detalle
  const handleVerDetalle = useCallback(async (id: number) => {
    try {
      await obtenerPractica(id);
      setMostrarDetalle(true);
    } catch (error) {
      console.error('Error al obtener detalle:', error);
      setError('Error al cargar el detalle de la práctica');
    }
  }, [obtenerPractica, setError]);

  // Cerrar modal de detalle
  const handleCerrarDetalle = useCallback(() => {
    setMostrarDetalle(false);
    limpiarPractica();
  }, [limpiarPractica]);

  // Cambiar página
  const cambiarPagina = useCallback((page: number) => {
    cargarHistorico(page, itemsPerPage);
  }, [cargarHistorico, itemsPerPage]);

  // Cambiar items por página
  const cambiarItemsPorPagina = useCallback((items: number) => {
    setItemsPerPage(items);
    cargarHistorico(1, items);
  }, [cargarHistorico]);

  // Efectos
  useEffect(() => {
    cargarOpcionesWrapper();
  }, [cargarOpcionesWrapper]);

  useEffect(() => {
    cargarHistorico(1, itemsPerPage);
  }, [cargarHistorico, itemsPerPage]);

  useEffect(() => {
    cargarEstadisticasWrapper();
  }, [cargarEstadisticasWrapper]);

  // Verificar permisos
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const rolesPermitidos = ['COORDINADOR', 'DIRECTOR_CARRERA', 'SUPER_ADMIN'];
  if (!rolesPermitidos.includes(user.rol)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para acceder a esta sección.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <History className="h-8 w-8" />
            Histórico de Prácticas
          </h1>
          <p className="text-gray-600 mt-2">
            Consulta y gestiona el histórico de prácticas con filtros avanzados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              cargarHistorico(paginacion.currentPage, itemsPerPage);
              cargarEstadisticasWrapper();
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Badge variant="secondary">
            {user.rol === 'SUPER_ADMIN' ? 'Super Admin' : 
             user.rol === 'DIRECTOR_CARRERA' ? 'Director de Carrera' : 
             'Coordinador'}
          </Badge>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Estadísticas Rápidas */}
      <EstadisticasRapidas
        estadisticas={estadisticas}
        loading={loadingEstadisticas}
      />

      {/* Filtros */}
      <FiltrosPracticasComponent
        filtros={filtros}
        onFiltrosChange={actualizarFiltros}
        opciones={opciones}
        onExportar={exportarHistorico}
        onLimpiar={limpiarFiltros}
        loading={loading || loadingOpciones}
        esSuperAdmin={esSuperAdmin}
      />

      {/* Tabla de Prácticas */}
      <TablaPracticas
        practicas={practicas}
        loading={loading}
        onVerDetalle={handleVerDetalle}
        onVerActa={(id) => {
          // TODO: Implementar vista de acta
          console.log('Ver acta:', id);
        }}
      />

      {/* Paginación */}
      <div className="mt-6">
        <Paginacion
          currentPage={paginacion.currentPage}
          totalPages={paginacion.totalPages}
          totalItems={paginacion.totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={cambiarPagina}
          onItemsPerPageChange={cambiarItemsPorPagina}
          loading={loading}
        />
      </div>

      {/* Modal de Detalle */}
      <DetallePracticaDialog
        practica={practicaDetalle}
        open={mostrarDetalle}
        onOpenChange={handleCerrarDetalle}
      />
    </div>
  );
}