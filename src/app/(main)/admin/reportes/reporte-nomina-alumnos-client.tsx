'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Download, Users, FileText, Loader2, Filter } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type {
  ResumenNominaAlumnos,
  OpcionesFiltrosNomina,
  FiltrosNominaAlumnos,
} from '@/lib/services/reporteNominaAlumnosService';

export function ReporteNominaAlumnosClient() {
  // Estados
  const [datos, setDatos] = useState<ResumenNominaAlumnos | null>(null);
  const [opciones, setOpciones] = useState<OpcionesFiltrosNomina | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  // Filtros
  const [filtros, setFiltros] = useState<FiltrosNominaAlumnos>({
    fechaDesde: undefined,
    fechaHasta: undefined,
    sedeId: undefined,
    carreraId: undefined,
    estado: 'EN_CURSO', // Por defecto mostrar alumnos en curso
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
      const response = await fetch('/api/reportes/nomina-alumnos/opciones');
      const result = await response.json();

      if (result.success) {
        setOpciones(result.data);
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
      if (filtros.estado) {
        params.append('estado', filtros.estado);
      }

      const response = await fetch(`/api/reportes/nomina-alumnos?${params}`);
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
      if (filtros.estado) {
        params.append('estado', filtros.estado);
      }

      const response = await fetch(`/api/reportes/nomina-alumnos/export?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nomina-alumnos-practica-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
      estado: 'EN_CURSO',
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
      <div className="flex items-center justify-center h-64">
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
            <Filter className="h-5 w-5" />
            <span>Filtros de Búsqueda</span>
          </CardTitle>
          <CardDescription>
            Configure los filtros para generar la nómina de alumnos en práctica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Fecha Desde */}
            <div className="space-y-2">
              <Label htmlFor="fechaDesde">Fecha Desde</Label>
              <div className="relative">
                <Input
                  id="fechaDesde"
                  type="date"
                  value={filtros.fechaDesde ? format(filtros.fechaDesde, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setFiltros(prev => ({
                    ...prev,
                    fechaDesde: e.target.value ? new Date(e.target.value) : undefined
                  }))}
                  className="pl-10"
                />
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Fecha Hasta */}
            <div className="space-y-2">
              <Label htmlFor="fechaHasta">Fecha Hasta</Label>
              <div className="relative">
                <Input
                  id="fechaHasta"
                  type="date"
                  value={filtros.fechaHasta ? format(filtros.fechaHasta, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setFiltros(prev => ({
                    ...prev,
                    fechaHasta: e.target.value ? new Date(e.target.value) : undefined
                  }))}
                  className="pl-10"
                />
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="estado">Estado de Práctica</Label>
              <Select
                value={filtros.estado || ''}
                onValueChange={(value) => setFiltros(prev => ({
                  ...prev,
                  estado: value || undefined
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  {opciones?.estados.map((estado) => (
                    <SelectItem key={estado.valor} value={estado.valor}>
                      {estado.descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sede */}
            {opciones && opciones.sedes.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="sede">Sede</Label>
                <Select
                  value={filtros.sedeId?.toString() || ''}
                  onValueChange={(value) => setFiltros(prev => ({
                    ...prev,
                    sedeId: value ? parseInt(value) : undefined,
                    carreraId: undefined // Reset carrera cuando cambia sede
                  }))}
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
            )}

            {/* Carrera */}
            <div className="space-y-2">
              <Label htmlFor="carrera">Carrera</Label>
              <Select
                value={filtros.carreraId?.toString() || ''}
                onValueChange={(value) => setFiltros(prev => ({
                  ...prev,
                  carreraId: value ? parseInt(value) : undefined
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las carreras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las carreras</SelectItem>
                  {carrerasFiltradas.map((carrera) => (
                    <SelectItem key={carrera.id} value={carrera.id.toString()}>
                      {carrera.nombre}
                      {opciones && opciones.sedes.length > 1 && (
                        <span className="text-muted-foreground"> - {carrera.sede.nombre}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={limpiarFiltros}>
              Limpiar Filtros
            </Button>
            <Button onClick={cargarDatos} disabled={cargando}>
              {cargando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                'Actualizar Reporte'
              )}
            </Button>
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
          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Alumnos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{datos.totalAlumnos}</div>
                <p className="text-xs text-muted-foreground">
                  En el periodo seleccionado
                </p>
              </CardContent>
            </Card>

            {datos.filtrosAplicados.estado && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estado Filtrado</CardTitle>
                  <Badge variant="secondary">{datos.filtrosAplicados.estado}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Mostrando solo alumnos con estado: {datos.filtrosAplicados.estado}
                  </div>
                </CardContent>
              </Card>
            )}

            {datos.filtrosAplicados.carrera && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Carrera</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">{datos.filtrosAplicados.carrera}</div>
                </CardContent>
              </Card>
            )}

            {datos.filtrosAplicados.sede && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sede</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">{datos.filtrosAplicados.sede}</div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tabla de Alumnos */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Nómina de Alumnos en Práctica</span>
                  </CardTitle>
                  <CardDescription>
                    Lista detallada de {datos.totalAlumnos} alumnos en práctica
                  </CardDescription>
                </div>
                <Button onClick={exportarCSV} disabled={exportando}>
                  {exportando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar CSV
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RUT Alumno</TableHead>
                      <TableHead>Nombre Alumno</TableHead>
                      <TableHead>Carrera</TableHead>
                      <TableHead>Centro Práctica</TableHead>
                      <TableHead>Jefe Directo</TableHead>
                      <TableHead>Docente Tutor</TableHead>
                      <TableHead>Fecha Inicio</TableHead>
                      <TableHead>Fecha Término</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datos.alumnos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-6">
                          No hay alumnos que coincidan con los filtros seleccionados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      datos.alumnos.map((alumno, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{alumno.rutAlumno}</TableCell>
                          <TableCell>{alumno.nombreAlumno} {alumno.apellidoAlumno}</TableCell>
                          <TableCell>{alumno.carrera}</TableCell>
                          <TableCell>{alumno.centroPractica}</TableCell>
                          <TableCell>{alumno.jefeDirecto}</TableCell>
                          <TableCell>{alumno.docenteTutor}</TableCell>
                          <TableCell>{formatearFecha(alumno.fechaInicio)}</TableCell>
                          <TableCell>
                            {alumno.fechaTermino ? formatearFecha(alumno.fechaTermino) : 'En curso'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              alumno.estado === 'EN_CURSO' ? 'default' :
                              alumno.estado === 'CERRADA' ? 'secondary' :
                              alumno.estado === 'ANULADA' ? 'destructive' : 'outline'
                            }>
                              {alumno.estado.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
