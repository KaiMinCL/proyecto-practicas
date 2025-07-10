"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardFooter, 
    CardTitle 
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Terminal, 
    Info, 
    UserCheck, 
    Calendar, 
    User, 
    BookOpen, 
    Clock,
    CheckCircle2,
    GraduationCap,
    FileText,
    ClipboardCheck,
    AlertCircle,
    Star,
    Download,
    Building
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import type { PracticaConDetalles } from '@/lib/validators/practica';
import type { ActionResponse } from '../practicas/actions';

interface PracticasDocenteClienteProps {
  initialActionResponse: ActionResponse<PracticaConDetalles[]>;
  user: any;
}

// Función helper para obtener el color del estado
const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'PENDIENTE_ACEPTACION_DOCENTE':
      return {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-800 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-800',
        dot: '#FF6B35'
      };
    case 'EN_CURSO':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-800 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
        dot: '#007F7C'
      };
    case 'FINALIZADA_PENDIENTE_EVAL':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-800 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-800',
        dot: '#FFA726'
      };
    case 'EVALUACION_COMPLETA':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800',
        dot: '#00C853'
      };
    case 'CERRADA':
      return {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-800 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        dot: '#10B981'
      };
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-900/30',
        text: 'text-gray-800 dark:text-gray-300',
        border: 'border-gray-200 dark:border-gray-800',
        dot: '#9E9E9E'
      };
  }
};

// Función helper para obtener el texto legible del estado
const getEstadoTexto = (estado: string) => {
  switch (estado) {
    case 'PENDIENTE_ACEPTACION_DOCENTE':
      return 'Pendiente Aceptación';
    case 'EN_CURSO':
      return 'En Curso';
    case 'FINALIZADA_PENDIENTE_EVAL':
      return 'Pendiente Evaluación';
    case 'EVALUACION_COMPLETA':
      return 'Evaluación Completa';
    case 'CERRADA':
      return 'Finalizada';
    default:
      return estado;
  }
};

// Función helper para determinar la acción principal
const getAccionPrincipal = (practica: PracticaConDetalles) => {
  switch (practica.estado) {
    case 'PENDIENTE_ACEPTACION_DOCENTE':
      return {
        texto: 'Revisar y Decidir Acta 1',
        href: `/docente/practicas-pendientes/${practica.id}/revisar-acta`,
        icon: UserCheck,
        variant: 'default' as const,
        priority: 'high'
      };
    case 'EN_CURSO':
      if (practica.informeUrl) {
        return {
          texto: 'Evaluar Informe',
          href: `/docente/practicas/${practica.id}/evaluar-informe`,
          icon: ClipboardCheck,
          variant: 'default' as const,
          priority: 'high'
        };
      }
      return {
        texto: 'Ver Detalles',
        href: `/docente/practicas/${practica.id}`,
        icon: Info,
        variant: 'outline' as const,
        priority: 'low'
      };
    case 'FINALIZADA_PENDIENTE_EVAL':
      return {
        texto: 'Evaluar Informe',
        href: `/docente/practicas/${practica.id}/evaluar-informe`,
        icon: ClipboardCheck,
        variant: 'default' as const,
        priority: 'high'
      };
    case 'EVALUACION_COMPLETA':
      // Si ambas evaluaciones están completadas, mostrar opción de Acta Final
      if (practica.evaluacionDocente && practica.evaluacionEmpleador) {
        return {
          texto: 'Generar Acta Final',
          href: `/docente/practicas/${practica.id}/acta-final`,
          icon: FileText,
          variant: 'default' as const,
          priority: 'high'
        };
      }
      return {
        texto: 'Ver Evaluación',
        href: `/docente/practicas/${practica.id}/evaluacion`,
        icon: Star,
        variant: 'outline' as const,
        priority: 'low'
      };
    case 'CERRADA':
      // Si la práctica está cerrada, mostrar acta final
      return {
        texto: 'Ver Acta Final',
        href: `/docente/practicas/${practica.id}/acta-final`,
        icon: FileText,
        variant: 'outline' as const,
        priority: 'low'
      };
    default:
      return {
        texto: 'Ver Detalles',
        href: `/docente/practicas/${practica.id}`,
        icon: Info,
        variant: 'outline' as const,
        priority: 'low'
      };
  }
};

export function PracticasDocenteCliente({ initialActionResponse }: PracticasDocenteClienteProps) {
  const [practicas] = useState<PracticaConDetalles[]>(initialActionResponse.data || []);
  const [error] = useState<string | null>(initialActionResponse.error || null);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('__all__');

  // Filtro por búsqueda y estado
  const practicasFiltradas = practicas.filter((p) => {
    const alumno = `${p.alumno?.usuario.nombre ?? ''} ${p.alumno?.usuario.apellido ?? ''} ${p.alumno?.usuario.rut ?? ''}`.toLowerCase();
    const matchSearch = alumno.includes(search.toLowerCase());
    const matchEstado = estado === '__all__' ? true : p.estado === estado;
    return matchSearch && matchEstado;
  });

  // Agrupaciones
  const practicasPendientes = practicasFiltradas.filter(p => p.estado === 'PENDIENTE_ACEPTACION_DOCENTE');
  const practicasEnCurso = practicasFiltradas.filter(p => p.estado === 'EN_CURSO' || p.estado === 'FINALIZADA_PENDIENTE_EVAL' || p.estado === 'EVALUACION_COMPLETA');
  const practicasCerradas = practicasFiltradas.filter(p => p.estado === 'CERRADA');

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error al Cargar Prácticas</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nombre, apellido o RUT del alumno..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-56">
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los estados</SelectItem>
              <SelectItem value="PENDIENTE_ACEPTACION_DOCENTE">Pendiente Aceptación</SelectItem>
              <SelectItem value="EN_CURSO">En Curso</SelectItem>
              <SelectItem value="FINALIZADA_PENDIENTE_EVAL">Pendiente Evaluación</SelectItem>
              <SelectItem value="EVALUACION_COMPLETA">Evaluación Completa</SelectItem>
              <SelectItem value="CERRADA">Finalizada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Alerta de prácticas pendientes de aceptación */}
      {practicasPendientes.length > 0 && (
        <Alert variant="default" className="mb-8">
          <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
          <AlertTitle>¡Tienes prácticas nuevas que requieren tu aceptación!</AlertTitle>
          <AlertDescription>
            Debes revisar y aceptar/rechazar {practicasPendientes.length} práctica(s) asignada(s) recientemente.
          </AlertDescription>
        </Alert>
      )}

      {/* Prácticas pendientes de aceptación */}
      {practicasPendientes.length > 0 && (
        <div>
          <div className="flex items-center mb-4">
            <UserCheck className="h-5 w-5 text-orange-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Prácticas Pendientes de Aceptación ({practicasPendientes.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {practicasPendientes.map((practica) => (
              <PracticaCard key={practica.id} practica={practica} />
            ))}
          </div>
        </div>
      )}

      {/* Prácticas en curso/finalizadas */}
      {practicasEnCurso.length > 0 && (
        <div>
          <div className="flex items-center mb-4">
            <BookOpen className="h-5 w-5 text-blue-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Prácticas en Curso y Finalizadas ({practicasEnCurso.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {practicasEnCurso.map((practica) => (
              <PracticaCard key={practica.id} practica={practica} />
            ))}
          </div>
        </div>
      )}

      {/* Prácticas cerradas (histórico) */}
      {practicasCerradas.length > 0 && (
        <div>
          <div className="flex items-center mb-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Prácticas Cerradas ({practicasCerradas.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {practicasCerradas.map((practica) => (
              <PracticaCard key={practica.id} practica={practica} />
            ))}
          </div>
        </div>
      )}

      {/* Si no hay ninguna práctica */}
      {practicasFiltradas.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-b from-muted/50 to-background rounded-2xl border-2 border-dashed border-border">
          <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <BookOpen className="w-12 h-12 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">
            No se encontraron prácticas
          </h3>
          <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed mb-6">
            Ajusta los filtros o la búsqueda para ver otras prácticas o alumnos.
          </p>
        </div>
      )}
    </div>
  );
}

function PracticaCard({ practica }: { practica: PracticaConDetalles }) {
  const estadoConfig = getEstadoColor(practica.estado);
  const accionPrincipal = getAccionPrincipal(practica);
  const ActionIcon = accionPrincipal.icon;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border border-border hover:border-primary/20 overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">
                {practica.alumno?.usuario.nombre} {practica.alumno?.usuario.apellido}
              </CardTitle>
              <CardDescription className="text-sm font-medium text-primary">
                {practica.alumno?.usuario.rut}
              </CardDescription>
            </div>
          </div>
          <Badge 
            className={`${estadoConfig.bg} ${estadoConfig.text} ${estadoConfig.border} border`}
          >
            <div 
              className="w-2 h-2 rounded-full mr-1" 
              style={{backgroundColor: estadoConfig.dot}}
            />
            {getEstadoTexto(practica.estado)}
          </Badge>
        </div>
      </div>
      <CardContent className="p-6 space-y-2">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="w-4 h-4" />
            {practica.carrera?.nombre || 'N/A'}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            {practica.tipo === 'LABORAL' ? 'Laboral' : 'Profesional'}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {format(new Date(practica.fechaInicio), "dd/MM/yyyy", { locale: es })}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-t border-gray-200 dark:border-gray-600 p-6">
        <div className="flex gap-2 w-full">
          <Button asChild size="sm" variant={accionPrincipal.variant} className="flex-1">
            <Link href={accionPrincipal.href}>
              <ActionIcon className="mr-2 h-4 w-4" />
              {accionPrincipal.texto}
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link href={`/docente/practicas/${practica.id}`}>
              <Info className="mr-2 h-4 w-4" />
              Ver Detalle
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
