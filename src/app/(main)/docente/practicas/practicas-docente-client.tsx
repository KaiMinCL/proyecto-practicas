"use client";

import React from 'react';
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
import { 
    Terminal, 
    Info, 
    UserCheck, 
    Calendar, 
    User, 
    MapPin, 
    BookOpen, 
    Clock,
    CheckCircle2,
    GraduationCap,
    FileText,
    ClipboardCheck,
    AlertCircle,
    Star,
    Download
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import type { PracticaConDetalles } from '@/lib/validators/practica';
import type { ActionResponse } from '../practicas/actions';

interface PracticasDocenteClienteProps {
  initialActionResponse: ActionResponse<PracticaConDetalles[]>;
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
        href: `/docente/practicas/${practica.id}/detalles`,
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
      return {
        texto: 'Ver Evaluación',
        href: `/docente/practicas/${practica.id}/evaluacion`,
        icon: Star,
        variant: 'outline' as const,
        priority: 'low'
      };
    default:
      return {
        texto: 'Ver Detalles',
        href: `/docente/practicas/${practica.id}/detalles`,
        icon: Info,
        variant: 'outline' as const,
        priority: 'low'
      };
  }
};

export function PracticasDocenteCliente({ initialActionResponse }: PracticasDocenteClienteProps) {
  const [practicas] = React.useState<PracticaConDetalles[]>(initialActionResponse.data || []);
  const [error] = React.useState<string | null>(initialActionResponse.error || null);

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error al Cargar Prácticas</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (practicas.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <BookOpen className="w-12 h-12" style={{color: '#007F7C'}} />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          No tienes prácticas asignadas
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-md mx-auto leading-relaxed mb-6">
          Cuando tengas prácticas asignadas como tutor, aparecerán aquí para su gestión y supervisión.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          <Button asChild variant="outline" className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
            <Link href="/dashboard">
              <Info className="mr-2 h-4 w-4" />
              Ir al Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Separar prácticas por prioridad
  const practicasPrioridad = practicas.filter(p => getAccionPrincipal(p).priority === 'high');
  const practicasOtras = practicas.filter(p => getAccionPrincipal(p).priority === 'low');

  return (
    <div className="space-y-8">
      {/* Prácticas que requieren acción */}
      {practicasPrioridad.length > 0 && (
        <div>
          <div className="flex items-center mb-6">
            <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Requieren tu Acción ({practicasPrioridad.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {practicasPrioridad.map((practica) => (
              <PracticaCard key={practica.id} practica={practica} />
            ))}
          </div>
        </div>
      )}

      {/* Otras prácticas */}
      {practicasOtras.length > 0 && (
        <div>
          <div className="flex items-center mb-6">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Otras Prácticas ({practicasOtras.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {practicasOtras.map((practica) => (
              <PracticaCard key={practica.id} practica={practica} />
            ))}
          </div>
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
    <Card className="group hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-teal-200 dark:hover:border-teal-800 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform" style={{background: 'linear-gradient(135deg, #007F7C, #005F5C)'}}>
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900 dark:text-white">
                {practica.alumno?.usuario.nombre} {practica.alumno?.usuario.apellido}
              </CardTitle>
              <CardDescription className="text-sm font-medium" style={{color: '#007F7C'}}>
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
      
      <CardContent className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Carrera</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {practica.carrera?.nombre || 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tipo</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {practica.tipo === 'LABORAL' ? 'Laboral' : 'Profesional'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Inicio</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {format(new Date(practica.fechaInicio), "dd/MM", { locale: es })}
                </p>
              </div>
            </div>
          </div>

          {/* Información adicional según el estado */}
          {practica.informeUrl && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                    Informe subido
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-blue-600 hover:text-blue-700"
                  asChild
                >
                  <a href={practica.informeUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-3 h-3" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          {practica.fechaCompletadoAlumno && practica.estado === 'PENDIENTE_ACEPTACION_DOCENTE' && (
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <p className="text-xs font-medium text-orange-800 dark:text-orange-300">
                  Acta completada el {format(new Date(practica.fechaCompletadoAlumno), "dd/MM/yyyy", { locale: es })}
                </p>
              </div>
            </div>
          )}

          {practica.evaluacionDocente && (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <p className="text-xs font-medium text-green-800 dark:text-green-300">
                    Evaluado
                  </p>
                </div>
                <span className="text-sm font-bold text-green-800 dark:text-green-300">
                  {practica.evaluacionDocente.nota}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-t border-gray-200 dark:border-gray-600 p-6">
        <Button 
          asChild 
          size="default" 
          variant={accionPrincipal.variant}
          className={`w-full text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${
            accionPrincipal.variant === 'default' 
              ? 'bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800' 
              : ''
          }`}
          style={accionPrincipal.variant === 'default' ? {
            background: 'linear-gradient(135deg, #007F7C, #005F5C)', 
            borderColor: '#007F7C'
          } : {}}
        >
          <Link href={accionPrincipal.href}>
            <ActionIcon className="mr-2 h-4 w-4" />
            {accionPrincipal.texto}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
