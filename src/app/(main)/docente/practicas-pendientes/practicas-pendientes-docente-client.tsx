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
    BookOpen, 
    CheckCircle2,
    GraduationCap,
    FileCheck,
    FileText,
    AlertCircle,
    StarIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import type { PracticaConDetalles } from '@/lib/validators/practica';
import type { ActionResponse } from '../practicas/actions';

interface PracticasPendientesDocenteClienteProps {
  initialActionResponse: ActionResponse<PracticaConDetalles[]>;
}

// Función para determinar las acciones disponibles según el estado de la práctica
function getAccionesDisponibles(practica: PracticaConDetalles) {
  const acciones = [];

  switch (practica.estado) {
    case 'PENDIENTE_ACEPTACION_DOCENTE':
      acciones.push({
        tipo: 'revisar_acta',
        url: `/docente/practicas-pendientes/${practica.id}/revisar-acta`,
        titulo: 'Revisar y Decidir Acta 1',
        icono: UserCheck,
        descripcion: 'Revisar la información completada por el alumno',
        prioridad: 'alta',
        variante: 'default' as const
      });
      break;

    case 'EN_CURSO':
      // Si la práctica está en curso y tiene informe subido, permitir evaluarlo
      if (practica.informeUrl) {
        acciones.push({
          tipo: 'evaluar_informe',
          url: `/docente/practicas/${practica.id}/evaluar-informe`,
          titulo: 'Evaluar Informe',
          icono: FileCheck,
          descripcion: 'Evaluar el informe de práctica subido por el alumno',
          prioridad: 'alta',
          variante: 'default' as const
        });
      }
      break;

    case 'FINALIZADA_PENDIENTE_EVAL':
      // Práctica finalizada, pendiente de evaluaciones
      if (practica.informeUrl) {
        acciones.push({
          tipo: 'evaluar_informe',
          url: `/docente/practicas/${practica.id}/evaluar-informe`,
          titulo: 'Evaluar Informe',
          icono: FileCheck,
          descripcion: 'Evaluar el informe de práctica',
          prioridad: 'alta',
          variante: 'default' as const
        });
      } else {
        acciones.push({
          tipo: 'esperando_informe',
          url: '#',
          titulo: 'Esperando Informe',
          icono: AlertCircle,
          descripcion: 'El alumno aún no ha subido el informe',
          prioridad: 'media',
          variante: 'outline' as const,
          disabled: true
        });
      }
      break;

    case 'EVALUACION_COMPLETA':
      // Ya se completaron las evaluaciones, mostrar como informativo
      acciones.push({
        tipo: 'ver_evaluacion',
        url: `/docente/practicas/${practica.id}/evaluar-informe`,
        titulo: 'Ver Evaluación',
        icono: StarIcon,
        descripcion: 'Ver la evaluación realizada',
        prioridad: 'baja',
        variante: 'outline' as const
      });
      break;
  }

  return acciones;
}

// Función para obtener el color del badge según el estado
function getEstadoBadge(estado: string) {
  switch (estado) {
    case 'PENDIENTE_ACEPTACION_DOCENTE':
      return { variant: 'destructive' as const, label: 'Pendiente Aceptación' };
    case 'EN_CURSO':
      return { variant: 'default' as const, label: 'En Curso' };
    case 'FINALIZADA_PENDIENTE_EVAL':
      return { variant: 'secondary' as const, label: 'Pendiente Evaluación' };
    case 'EVALUACION_COMPLETA':
      return { variant: 'outline' as const, label: 'Evaluación Completa' };
    case 'CERRADA':
      return { variant: 'outline' as const, label: 'Cerrada' };
    default:
      return { variant: 'outline' as const, label: estado };
  }
}

export function PracticasPendientesDocenteCliente({ initialActionResponse }: PracticasPendientesDocenteClienteProps) {
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
          <UserCheck className="w-12 h-12" style={{color: '#007F7C'}} />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          No tienes alumnos pendientes
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-md mx-auto leading-relaxed mb-6">
          Cuando un alumno complete su Acta 1 y seas el tutor asignado, la práctica aparecerá aquí para tu revisión y aceptación.
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {practicas.map((practica) => {
          const acciones = getAccionesDisponibles(practica);
          const estadoBadge = getEstadoBadge(practica.estado);

          return (
            <Card key={practica.id} className="group hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-teal-200 dark:hover:border-teal-800 overflow-hidden">
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
                  <Badge variant={estadoBadge.variant} className="text-xs">
                    {estadoBadge.label}
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
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <p className="text-xs font-medium text-green-800 dark:text-green-300">
                          Informe de práctica subido
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {practica.fechaCompletadoAlumno && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                          Acta completada el {format(new Date(practica.fechaCompletadoAlumno), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-t border-gray-200 dark:border-gray-600 p-6">
                <div className="w-full space-y-2">
                  {acciones.map((accion, index) => {
                    const IconoComponente = accion.icono;
                    return (
                      <Button 
                        key={index}
                        asChild={!accion.disabled} 
                        size="default" 
                        variant={accion.variante}
                        className={`w-full ${
                          accion.prioridad === 'alta' 
                            ? 'text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200' 
                            : ''
                        }`}
                        style={accion.prioridad === 'alta' ? {
                          background: 'linear-gradient(135deg, #007F7C, #005F5C)', 
                          borderColor: '#007F7C'
                        } : {}}
                        disabled={accion.disabled}
                      >
                        {accion.disabled ? (
                          <div className="flex items-center justify-center w-full">
                            <IconoComponente className="mr-2 h-4 w-4" />
                            {accion.titulo}
                          </div>
                        ) : (
                          <Link href={accion.url} className="flex items-center justify-center w-full">
                            <IconoComponente className="mr-2 h-4 w-4" />
                            {accion.titulo}
                          </Link>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}