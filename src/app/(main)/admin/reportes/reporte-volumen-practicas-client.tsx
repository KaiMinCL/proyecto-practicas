'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Download, BarChart3, PieChart, FileText, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type {
  ResumenVolumenPracticas,
  OpcionesFiltrosVolumen,
  FiltrosVolumenPracticas,
} from '@/lib/services/reporteVolumenPracticasService';

// Colores para los gráficos
const COLORES_GRAFICOS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
];

export function ReporteVolumenPracticasClient() {
  // Estados
  const [datos, setDatos] = useState<ResumenVolumenPracticas | null>(null);
  const [opciones, setOpciones] = useState<OpcionesFiltrosVolumen | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  // Filtros
  const [filtros, setFiltros] = useState<FiltrosVolumenPracticas>({
    fechaDesde: undefined,
    fechaHasta: undefined,
    sedeId: undefined,
    carreraId: undefined,
  });

  // Cargar opciones de filtros al montar el componente
  useEffect(() => {
    cargarOpciones();
  }, []);

  // Cargar datos cuando cambien los filtros
  useEffect(() => {
    if (opciones) {
      cargarDatos();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros, opciones]);

  const cargarOpciones = async () => {
    try {
      setCargando(true);
      const response = await fetch('/api/reportes/volumen-practicas/opciones');
      const result = await response.json();

      if (result.success) {
        setOpciones(result.data);
        // Establecer fechas por defecto si hay datos disponibles
        if (result.data.periodoDisponible.fechaMasAntigua && result.data.periodoDisponible.fechaMasReciente) {
          const ahora = new Date();
          const inicioAno = new Date(ahora.getFullYear(), 0, 1);
          setFiltros(prev => ({
            ...prev,
            fechaDesde: inicioAno,
            fechaHasta: ahora,
          }));
        }
      } else {
        setError(result.error || 'Error al cargar opciones');
      }
    } catch (err) {
      console.error('Error al cargar opciones:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);

      const params = new URLSearchParams();
      if (filtros.fechaDesde) {
        params.append('fechaDesde', filtros.fechaDesde.toISOString());
      }
      if (filtros.fechaHasta) {
        params.append('fechaHasta', filtros.fechaHasta.toISOString());
      }
      if (filtros.sedeId) {
        params.append('sedeId', filtros.sedeId.toString());
      }
      if (filtros.carreraId) {
        params.append('carreraId', filtros.carreraId.toString());
      }

      const response = await fetch(`/api/reportes/volumen-practicas?${params}`);
      const result = await response.json();

      if (result.success) {
        setDatos(result.data);
      } else {
        setError(result.error || 'Error al cargar datos del reporte');
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const exportarCSV = async () => {
    try {
      setExportando(true);

      const params = new URLSearchParams();
      if (filtros.fechaDesde) {
        params.append('fechaDesde', filtros.fechaDesde.toISOString());
      }
      if (filtros.fechaHasta) {
        params.append('fechaHasta', filtros.fechaHasta.toISOString());
      }
      if (filtros.sedeId) {
        params.append('sedeId', filtros.sedeId.toString());
      }
      if (filtros.carreraId) {
        params.append('carreraId', filtros.carreraId.toString());
      }

      const response = await fetch(`/api/reportes/volumen-practicas/export?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-volumen-practicas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Error al descargar el archivo');
      }
    } catch (err) {
      console.error('Error al exportar:', err);
      setError('Error al exportar el reporte');
    } finally {
      setExportando(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaDesde: undefined,
      fechaHasta: undefined,
      sedeId: undefined,
      carreraId: undefined,
    });
  };

  const formatearFecha = (fecha: Date) => {
    return format(fecha, 'dd/MM/yyyy', { locale: es });
  };

  // Filtrar carreras por sede seleccionada
  const carrerasFiltradas = opciones?.carreras.filter(carrera => 
    !filtros.sedeId || carrera.sedeId === filtros.sedeId
  ) || [];

  if (cargando && !datos) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando reporte...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Panel de Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5" />
            <span>Filtros de Búsqueda</span>
          </CardTitle>
          <CardDescription>
            Seleccione el periodo y filtros para generar el reporte de volumen de prácticas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Fecha Desde */}
            <div className="space-y-2">
              <Label htmlFor="fechaDesde">Fecha Desde</Label>
              <Input
                id="fechaDesde"
                type="date"
                value={filtros.fechaDesde ? format(filtros.fechaDesde, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const fecha = e.target.value ? new Date(e.target.value) : undefined;
                  setFiltros(prev => ({ ...prev, fechaDesde: fecha }));
                }}
                max={filtros.fechaHasta ? format(filtros.fechaHasta, 'yyyy-MM-dd') : undefined}
              />
            </div>

            {/* Fecha Hasta */}
            <div className="space-y-2">
              <Label htmlFor="fechaHasta">Fecha Hasta</Label>
              <Input
                id="fechaHasta"
                type="date"
                value={filtros.fechaHasta ? format(filtros.fechaHasta, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const fecha = e.target.value ? new Date(e.target.value) : undefined;
                  setFiltros(prev => ({ ...prev, fechaHasta: fecha }));
                }}
                min={filtros.fechaDesde ? format(filtros.fechaDesde, 'yyyy-MM-dd') : undefined}
              />
            </div>

            {/* Sede */}
            <div className="space-y-2">
              <Label>Sede</Label>
              <Select
                value={filtros.sedeId?.toString() || ''}
                onValueChange={(value) => {
                  const sedeId = value ? parseInt(value) : undefined;
                  setFiltros(prev => ({ 
                    ...prev, 
                    sedeId,
                    carreraId: undefined // Limpiar carrera cuando cambie sede
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las sedes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las sedes</SelectItem>
                  {opciones?.sedes.map((sede) => (
                    <SelectItem key={sede.id} value={sede.id.toString()}>
                      {sede.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Carrera */}
            <div className="space-y-2">
              <Label>Carrera</Label>
              <Select
                value={filtros.carreraId?.toString() || ''}
                onValueChange={(value) => {
                  const carreraId = value ? parseInt(value) : undefined;
                  setFiltros(prev => ({ ...prev, carreraId }));
                }}
                disabled={carrerasFiltradas.length === 0}
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

          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={limpiarFiltros}
              >
                Limpiar Filtros
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={exportarCSV}
                disabled={!datos || exportando}
                className="flex items-center space-x-2"
              >
                {exportando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>Exportar CSV</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mostrar errores */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Resultados */}
      {datos && (
        <div className="space-y-6">
          {/* Resumen General */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen General</CardTitle>
              <CardDescription>
                Periodo: {formatearFecha(datos.periodoConsultado.fechaDesde)} - {formatearFecha(datos.periodoConsultado.fechaHasta)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {datos.totalPracticas.toLocaleString()}
                  </div>
                  <div className="text-muted-foreground">
                    Total de Prácticas Iniciadas
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráficos y Tablas */}
          <Tabs defaultValue="sedes" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sedes" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Por Sede</span>
              </TabsTrigger>
              <TabsTrigger value="carreras" className="flex items-center space-x-2">
                <PieChart className="h-4 w-4" />
                <span>Por Carrera</span>
              </TabsTrigger>
              <TabsTrigger value="tipos" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Por Tipo</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Por Sede */}
            <TabsContent value="sedes" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Barras */}
                <Card>
                  <CardHeader>
                    <CardTitle>Gráfico de Barras - Por Sede</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={datos.porSede}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="nombre" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          fontSize={12}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [value, 'Prácticas']}
                          labelFormatter={(label) => `Sede: ${label}`}
                        />
                        <Bar dataKey="cantidad" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Tabla */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tabla de Datos - Por Sede</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sede</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Porcentaje</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {datos.porSede.map((sede) => (
                          <TableRow key={sede.id}>
                            <TableCell className="font-medium">{sede.nombre}</TableCell>
                            <TableCell className="text-right">{sede.cantidad}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">{sede.porcentaje}%</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Por Carrera */}
            <TabsContent value="carreras" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Pie */}
                <Card>
                  <CardHeader>
                    <CardTitle>Gráfico Circular - Por Carrera</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={datos.porCarrera}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ payload }) => payload ? `${payload.porcentaje}%` : ''}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="cantidad"
                        >
                          {datos.porCarrera.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORES_GRAFICOS[index % COLORES_GRAFICOS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Prácticas']} />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Tabla */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tabla de Datos - Por Carrera</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[300px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Carrera</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                            <TableHead className="text-right">Porcentaje</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {datos.porCarrera.map((carrera) => (
                            <TableRow key={carrera.id}>
                              <TableCell className="font-medium text-sm">{carrera.nombre}</TableCell>
                              <TableCell className="text-right">{carrera.cantidad}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary">{carrera.porcentaje}%</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Por Tipo */}
            <TabsContent value="tipos" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Barras */}
                <Card>
                  <CardHeader>
                    <CardTitle>Gráfico de Barras - Por Tipo de Práctica</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={datos.porTipoPractica}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nombre" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [value, 'Prácticas']}
                          labelFormatter={(label) => `Tipo: ${label}`}
                        />
                        <Bar dataKey="cantidad" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Tabla */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tabla de Datos - Por Tipo de Práctica</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo de Práctica</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Porcentaje</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {datos.porTipoPractica.map((tipo) => (
                          <TableRow key={tipo.id}>
                            <TableCell className="font-medium">{tipo.nombre}</TableCell>
                            <TableCell className="text-right">{tipo.cantidad}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">{tipo.porcentaje}%</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Estado de carga */}
      {cargando && datos && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Actualizando datos...</span>
          </div>
        </div>
      )}
    </div>
  );
}
