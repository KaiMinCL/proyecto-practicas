'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
    Search, 
    ChevronLeft, 
    ChevronRight, 
    FileJson, 
    Filter,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// --- INTERFACES Y CONSTANTES ---

interface Log {
  id: number;
  fecha: string;
  accion: string;
  entidad: string;
  entidadId: string;
  descripcion: string | null;
  detallesPrevios: any | null;
  detallesNuevos: any | null;
  usuario: {
    nombre: string;
    apellido: string;
    rut: string;
  };
}

// Opciones para los filtros de selección basadas en tu esquema
const ACCION_OPTIONS = [
    { value: "CREAR_USUARIO", label: "Crear Usuario" },
    { value: "MODIFICAR_USUARIO", label: "Modificar Usuario" },
    { value: "LOGIN_EXITOSO", label: "Inicio de Sesión" },
    { value: "CREAR_PRACTICA", label: "Crear Práctica" },
    { value: "MODIFICAR_PRACTICA", label: "Modificar Práctica" },
    { value: "COMPLETAR_ACTA1_ALUMNO", label: "Completar Acta 1" },
    { value: "RECHAZAR_ACTA1_DOCENTE", label: "Rechazar Acta 1" },
    { value: "CERRAR_ACTA_FINAL", label: "Cerrar Acta Final" },
    { value: "CREAR_SEDE", label: "Crear Sede" },
    { value: "MODIFICAR_SEDE", label: "Modificar Sede" },
    { value: "CREAR_CARRERA", label: "Crear Carrera" },
    { value: "MODIFICAR_CARRERA", label: "Modificar Carrera" },
];

const ENTIDAD_OPTIONS = [
    { value: "Usuario", label: "Usuario" },
    { value: "Practica", label: "Práctica" },
    { value: "Sede", label: "Sede" },
    { value: "Carrera", label: "Carrera" },
    { value: "CentroPractica", label: "Centro de Práctica" },
    { value: "ActaFinal", label: "Acta Final" },
];


export function AuditoriaClient() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filters, setFilters] = useState({
    usuario: '',
    accion: '',
    entidad: '',
    fechaDesde: '',
    fechaHasta: '',
  });

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v != null && v !== '')
      );
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...cleanFilters,
      });
      const response = await fetch(`/api/admin/auditoria?${params.toString()}`);
      if (!response.ok) throw new Error('Error al cargar los logs');
      
      const { data } = await response.json();
      setLogs(data.logs);
      setPaginaActual(data.paginaActual);
      setTotalPaginas(data.totalPaginas);
    } catch (error) {
      toast.error('No se pudieron cargar los registros de auditoría.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
const handleSelectChange = (name: 'accion' | 'entidad', value: string) => {
    const finalValue = value === '_ALL_' ? '' : value;
    setFilters(prev => ({ ...prev, [name]: finalValue }));
  };


  const handleApplyFilters = () => {
    setPaginaActual(1);
    fetchLogs(1);
  };
  
  const handleClearFilters = () => {
    setFilters({ usuario: '', accion: '', entidad: '', fechaDesde: '', fechaHasta: '' });
  };

  // Efecto para buscar automáticamente cuando se limpian los filtros
  useEffect(() => {
    if (Object.values(filters).every(v => v === '')) {
      fetchLogs(1);
    }
  }, [filters, fetchLogs]);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5"/>
                Filtros de Búsqueda
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex flex-wrap items-end gap-4">
                <div className="flex-grow min-w-[200px] space-y-2">
                    <label className="text-sm font-medium">Usuario o RUT</label>
                    <Input name="usuario" placeholder="Buscar por usuario..." value={filters.usuario} onChange={handleFilterChange} />
                </div>
                <div className="flex-grow min-w-[200px] space-y-2">
                    <label className="text-sm font-medium">Acción</label>
                    <Select value={filters.accion} onValueChange={(value) => handleSelectChange('accion', value)}>
                        <SelectTrigger><SelectValue placeholder="Todas las acciones" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_ALL_">Todas las acciones</SelectItem>
                            {ACCION_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-grow min-w-[200px] space-y-2">
                    <label className="text-sm font-medium">Entidad</label>
                    <Select value={filters.entidad} onValueChange={(value) => handleSelectChange('entidad', value)}>
                        <SelectTrigger><SelectValue placeholder="Todas las entidades" /></SelectTrigger>
                        <SelectContent>
                             <SelectItem value="_ALL_">Todas las entidades</SelectItem>
                            {ENTIDAD_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex-grow min-w-[150px] space-y-2">
                    <label className="text-sm font-medium">Fecha Desde</label>
                    <Input name="fechaDesde" type="date" value={filters.fechaDesde} onChange={handleFilterChange} />
                </div>
                 <div className="flex-grow min-w-[150px] space-y-2">
                    <label className="text-sm font-medium">Fecha Hasta</label>
                    <Input name="fechaHasta" type="date" value={filters.fechaHasta} onChange={handleFilterChange} />
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleApplyFilters} disabled={loading}>
                        <Search className="mr-2 h-4 w-4" />
                        {loading ? 'Buscando...' : 'Buscar'}
                    </Button>
                    <Button variant="outline" onClick={handleClearFilters}>
                        Limpiar
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Resultados de Auditoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad (ID)</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell></TableRow>
                ) : logs.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">No se encontraron registros con los filtros actuales.</TableCell></TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(log.fecha), 'dd/MM/yy HH:mm', { locale: es })}</TableCell>
                      <TableCell>{log.usuario.nombre} {log.usuario.apellido}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-xs">{log.accion}</Badge></TableCell>
                      <TableCell>{log.entidad} <span className="text-muted-foreground">({log.entidadId})</span></TableCell>
                      <TableCell className="max-w-xs truncate">{log.descripcion || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        {(log.detallesPrevios || log.detallesNuevos) && (
                          <LogDetailsDialog log={log} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {totalPaginas > 1 && (
            <CardFooter className="flex items-center justify-end space-x-2 pt-4">
                <span className="text-sm text-muted-foreground">Página {paginaActual} de {totalPaginas}</span>
                <Button variant="outline" size="sm" onClick={() => fetchLogs(paginaActual - 1)} disabled={paginaActual <= 1 || loading}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => fetchLogs(paginaActual + 1)} disabled={paginaActual >= totalPaginas || loading}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}

// Componente interno para mostrar detalles en un diálogo
function LogDetailsDialog({ log }: { log: Log }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm"><FileJson className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalles del Log #{log.id}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
          <div>
            <h3 className="font-semibold mb-2">Datos Anteriores</h3>
            <pre className="bg-muted p-3 rounded-md text-xs whitespace-pre-wrap">
              {log.detallesPrevios ? JSON.stringify(log.detallesPrevios, null, 2) : 'N/A'}
            </pre>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Datos Nuevos</h3>
            <pre className="bg-muted p-3 rounded-md text-xs whitespace-pre-wrap">
              {log.detallesNuevos ? JSON.stringify(log.detallesNuevos, null, 2) : 'N/A'}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}