"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardFooter, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Edit3, Terminal, Info, FileText, Calendar, MapPin, User, Building } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import type { PracticaConDetalles } from '@/lib/validators/practica';
import { ActionResponse } from '../practicas/actions';

interface MisPracticasClienteProps {
  initialActionResponse: ActionResponse<PracticaConDetalles[]>;
}

const getEstadoBadge = (estado: PracticaConDetalles['estado']) => {
  const variants = {
    'PENDIENTE': { variant: 'secondary' as const, label: 'Pendiente', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    'PENDIENTE_ACEPTACION_DOCENTE': { variant: 'default' as const, label: 'Pendiente Aprobación', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    'RECHAZADA_DOCENTE': { variant: 'destructive' as const, label: 'Rechazada', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    'EN_CURSO': { variant: 'default' as const, label: 'En Curso', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    'FINALIZADA_PENDIENTE_EVAL': { variant: 'default' as const, label: 'Finalizada', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    'EVALUACION_COMPLETA': { variant: 'default' as const, label: 'Evaluada', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    'CERRADA': { variant: 'default' as const, label: 'Cerrada', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
    'ANULADA': { variant: 'destructive' as const, label: 'Anulada', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  };
  
  return variants[estado] || variants['PENDIENTE'];
};

export function MisPracticasCliente({ initialActionResponse }: MisPracticasClienteProps) {
  const [practicas] = React.useState<PracticaConDetalles[]>(initialActionResponse.data || []);
  const [error] = React.useState<string | null>(initialActionResponse.error || null);

  const puedeSubirInforme = (estado: PracticaConDetalles['estado']): boolean => {
    return [
      'EN_CURSO',
      'FINALIZADA_PENDIENTE_EVAL',
      'EVALUACION_COMPLETA',
    ].includes(estado);
  };

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
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Info className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No tienes prácticas pendientes
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
            Cuando tu coordinador inicie el registro de una práctica para ti, aparecerá aquí.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {practicas.map((practica) => {
        const estadoBadge = getEstadoBadge(practica.estado);
        
        return (
          <Card key={practica.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-xl text-gray-900 dark:text-white">
                    Práctica {practica.tipo === 'LABORAL' ? 'Laboral' : 'Profesional'}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {practica.carrera?.nombre || 'Carrera no especificada'}
                  </CardDescription>
                </div>
                <Badge className={estadoBadge.color}>
                  {estadoBadge.label}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Información del estudiante */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Estudiante:</span>
                    <span>{practica.alumno?.usuario.nombre} {practica.alumno?.usuario.apellido}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Sede:</span>
                    <span>{practica.carrera?.sede?.nombre || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Docente Tutor:</span>
                    <span>
                      {practica.docente?.usuario?.nombre || ''} {practica.docente?.usuario?.apellido || 'No asignado'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Inicio:</span>
                    <span>{format(new Date(practica.fechaInicio), "PPP", { locale: es })}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Término:</span>
                    <span>{format(new Date(practica.fechaTermino), "PPP", { locale: es })}</span>
                  </div>
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span>Progreso</span>
                  <span>
                    {practica.estado === 'PENDIENTE' ? '20%' : 
                     practica.estado === 'PENDIENTE_ACEPTACION_DOCENTE' ? '40%' :
                     practica.estado === 'EN_CURSO' ? '60%' :
                     practica.estado === 'FINALIZADA_PENDIENTE_EVAL' ? '80%' : '100%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: practica.estado === 'PENDIENTE' ? '20%' : 
                             practica.estado === 'PENDIENTE_ACEPTACION_DOCENTE' ? '40%' :
                             practica.estado === 'EN_CURSO' ? '60%' :
                             practica.estado === 'FINALIZADA_PENDIENTE_EVAL' ? '80%' : '100%'
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-wrap gap-2">
              {/* Botón Completar Acta 1 */}
              {practica.estado === 'PENDIENTE' && (
                <Button asChild size="sm" className="flex-1 min-w-[140px]">
                  <Link href={`/alumno/mis-practicas/${practica.id}/completar-acta`}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Completar Acta 1
                  </Link>
                </Button>
              )}
              
              {/* Botón Subir/Ver Informe */}
              {puedeSubirInforme(practica.estado) && (
                <Button asChild size="sm" variant="outline" className="flex-1 min-w-[140px]">
                  <Link href={`/alumno/subir-informe?practicaId=${practica.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    {practica.informeUrl ? 'Ver/Actualizar Informe' : 'Subir Informe Final'}
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}