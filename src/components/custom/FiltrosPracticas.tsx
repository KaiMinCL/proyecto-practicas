import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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

interface FiltrosPracticasProps {
  filtros: FiltrosPracticas;
  onFiltrosChange: (filtros: FiltrosPracticas) => void;
  opciones: OpcionesFiltros;
  onExportar: () => void;
  onLimpiar: () => void;
  loading?: boolean;
  esSuperAdmin?: boolean;
}

const ESTADOS_PRACTICA = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'PENDIENTE_ACEPTACION_DOCENTE', label: 'Pendiente Aceptación' },
  { value: 'RECHAZADA_DOCENTE', label: 'Rechazada' },
  { value: 'EN_CURSO', label: 'En Curso' },
  { value: 'FINALIZADA_PENDIENTE_EVAL', label: 'Finalizada (Pend. Eval.)' },
  { value: 'EVALUACION_COMPLETA', label: 'Evaluación Completa' },
  { value: 'CERRADA', label: 'Cerrada' },
  { value: 'ANULADA', label: 'Anulada' }
];

const TIPOS_PRACTICA = [
  { value: 'LABORAL', label: 'Práctica Laboral' },
  { value: 'PROFESIONAL', label: 'Práctica Profesional' }
];

export const FiltrosPracticasComponent: React.FC<FiltrosPracticasProps> = ({
  filtros,
  onFiltrosChange,
  opciones,
  onExportar,
  onLimpiar,
  loading = false,
  esSuperAdmin = false
}) => {
  const [mostrarFiltros, setMostrarFiltros] = React.useState(false);
  const [fechaInicioOpen, setFechaInicioOpen] = React.useState(false);
  const [fechaFinOpen, setFechaFinOpen] = React.useState(false);

  const handleEstadoChange = (estado: EstadoPractica) => {
    const estadosActuales = filtros.estados || [];
    const nuevosEstados = estadosActuales.includes(estado)
      ? estadosActuales.filter(e => e !== estado)
      : [...estadosActuales, estado];
    
    onFiltrosChange({
      ...filtros,
      estados: nuevosEstados.length > 0 ? nuevosEstados : undefined
    });
  };

  const removerEstado = (estado: EstadoPractica) => {
    const estadosActuales = filtros.estados || [];
    const nuevosEstados = estadosActuales.filter(e => e !== estado);
    
    onFiltrosChange({
      ...filtros,
      estados: nuevosEstados.length > 0 ? nuevosEstados : undefined
    });
  };

  const contarFiltrosActivos = () => {
    let count = 0;
    if (filtros.estados && filtros.estados.length > 0) count++;
    if (filtros.fechaInicio) count++;
    if (filtros.fechaFin) count++;
    if (filtros.carreraId) count++;
    if (filtros.sedeId) count++;
    if (filtros.tipo) count++;
    if (filtros.alumnoRut) count++;
    if (filtros.nombreAlumno) count++;
    return count;
  };

  const filtrosActivos = contarFiltrosActivos();

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
            {filtrosActivos > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filtrosActivos} filtro{filtrosActivos > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
            >
              {mostrarFiltros ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportar}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            {filtrosActivos > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onLimpiar}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {mostrarFiltros && (
        <CardContent className="space-y-4">
          {/* Filtros básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Búsqueda por RUT */}
            <div className="space-y-2">
              <Label htmlFor="alumnoRut">RUT Alumno</Label>
              <Input
                id="alumnoRut"
                placeholder="Ej: 12345678-9"
                value={filtros.alumnoRut || ''}
                onChange={(e) => onFiltrosChange({
                  ...filtros,
                  alumnoRut: e.target.value || undefined
                })}
              />
            </div>

            {/* Búsqueda por nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombreAlumno">Nombre Alumno</Label>
              <Input
                id="nombreAlumno"
                placeholder="Buscar por nombre..."
                value={filtros.nombreAlumno || ''}
                onChange={(e) => onFiltrosChange({
                  ...filtros,
                  nombreAlumno: e.target.value || undefined
                })}
              />
            </div>

            {/* Tipo de práctica */}
            <div className="space-y-2">
              <Label>Tipo de Práctica</Label>
              <Select
                value={filtros.tipo || ''}
                onValueChange={(value) => onFiltrosChange({
                  ...filtros,
                  tipo: value as TipoPractica || undefined
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los tipos</SelectItem>
                  {TIPOS_PRACTICA.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtros de carrera y sede */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Carrera */}
            <div className="space-y-2">
              <Label>Carrera</Label>
              <Select
                value={filtros.carreraId?.toString() || ''}
                onValueChange={(value) => onFiltrosChange({
                  ...filtros,
                  carreraId: value ? parseInt(value) : undefined
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar carrera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las carreras</SelectItem>
                  {opciones.carreras.map(carrera => (
                    <SelectItem key={carrera.id} value={carrera.id.toString()}>
                      {carrera.nombre} - {carrera.sede.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sede (solo para super admin) */}
            {esSuperAdmin && (
              <div className="space-y-2">
                <Label>Sede</Label>
                <Select
                  value={filtros.sedeId?.toString() || ''}
                  onValueChange={(value) => onFiltrosChange({
                    ...filtros,
                    sedeId: value ? parseInt(value) : undefined
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sede" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las sedes</SelectItem>
                    {opciones.sedes.map(sede => (
                      <SelectItem key={sede.id} value={sede.id.toString()}>
                        {sede.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Filtros de fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha Inicio (Desde)</Label>
              <Popover open={fechaInicioOpen} onOpenChange={setFechaInicioOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filtros.fechaInicio ? 
                      format(filtros.fechaInicio, 'PPP', { locale: es }) : 
                      'Seleccionar fecha'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filtros.fechaInicio}
                    onSelect={(date) => {
                      onFiltrosChange({
                        ...filtros,
                        fechaInicio: date
                      });
                      setFechaInicioOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Fecha Inicio (Hasta)</Label>
              <Popover open={fechaFinOpen} onOpenChange={setFechaFinOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filtros.fechaFin ? 
                      format(filtros.fechaFin, 'PPP', { locale: es }) : 
                      'Seleccionar fecha'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filtros.fechaFin}
                    onSelect={(date) => {
                      onFiltrosChange({
                        ...filtros,
                        fechaFin: date
                      });
                      setFechaFinOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Estados */}
          <div className="space-y-2">
            <Label>Estados</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ESTADOS_PRACTICA.map(estado => (
                <div key={estado.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`estado-${estado.value}`}
                    checked={filtros.estados?.includes(estado.value as EstadoPractica) || false}
                    onChange={() => handleEstadoChange(estado.value as EstadoPractica)}
                    className="rounded border-gray-300"
                  />
                  <Label 
                    htmlFor={`estado-${estado.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {estado.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Estados seleccionados */}
          {filtros.estados && filtros.estados.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filtros.estados.map(estado => (
                <Badge key={estado} variant="secondary" className="flex items-center gap-1">
                  {ESTADOS_PRACTICA.find(e => e.value === estado)?.label || estado}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => removerEstado(estado)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
