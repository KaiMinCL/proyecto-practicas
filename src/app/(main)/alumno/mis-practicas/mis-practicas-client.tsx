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
import { Progress } from '@/components/ui/progress';
import { Edit3, Terminal, Info, FileText, Calendar, MapPin, User, Building, Clock, CheckCircle2, AlertCircle, GraduationCap } from 'lucide-react';
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
      <div className="text-center py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <GraduationCap className="w-12 h-12 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          No tienes prácticas asignadas
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-md mx-auto leading-relaxed mb-6">
          Cuando tu coordinador inicie el registro de una práctica para ti, aparecerá aquí para que puedas completar la información requerida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          <Button asChild variant="outline" className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
            <Link href="/dashboard">
              <Info className="mr-2 h-4 w-4" />
              Ir al Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost" className="text-gray-600 dark:text-gray-400">
            <Link href="/perfil">
              <User className="mr-2 h-4 w-4" />
              Ver Mi Perfil
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {practicas.map((practica) => {
        const estadoBadge = getEstadoBadge(practica.estado);
        
        return (
          <Card key={practica.id} className="group hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-primary/20 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center gap-2">
                      Práctica {practica.tipo === 'LABORAL' ? 'Laboral' : 'Profesional'}
                      {practica.estado === 'PENDIENTE' && (
                        <AlertCircle className="w-5 h-5 text-orange-500 animate-pulse" />
                      )}
                      {practica.estado === 'EN_CURSO' && (
                        <Clock className="w-5 h-5 text-blue-500" />
                      )}
                      {practica.estado === 'EVALUACION_COMPLETA' && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-base font-medium text-gray-700 dark:text-gray-300">
                      {practica.carrera?.nombre || 'Carrera no especificada'}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={`${estadoBadge.color} shadow-sm`}>
                  {estadoBadge.label}
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-6 space-y-6">
              {/* Información del estudiante */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estudiante</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {practica.alumno?.usuario.nombre} {practica.alumno?.usuario.apellido}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sede</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {practica.carrera?.sede?.nombre || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Docente Tutor</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {practica.docente?.usuario?.nombre || ''} {practica.docente?.usuario?.apellido || 'No asignado'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fecha Inicio</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {format(new Date(practica.fechaInicio), "PPP", { locale: es })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fecha Término</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {format(new Date(practica.fechaTermino), "PPP", { locale: es })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Información adicional si existe */}
                  {practica.direccionCentro && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                        <Building className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Centro Práctica</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {practica.direccionCentro}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progreso de la Práctica</span>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {practica.estado === 'PENDIENTE' ? '20%' : 
                       practica.estado === 'PENDIENTE_ACEPTACION_DOCENTE' ? '40%' :
                       practica.estado === 'EN_CURSO' ? '60%' :
                       practica.estado === 'FINALIZADA_PENDIENTE_EVAL' ? '80%' : '100%'}
                    </span>
                  </div>
                  <Progress 
                    value={
                      practica.estado === 'PENDIENTE' ? 20 : 
                      practica.estado === 'PENDIENTE_ACEPTACION_DOCENTE' ? 40 :
                      practica.estado === 'EN_CURSO' ? 60 :
                      practica.estado === 'FINALIZADA_PENDIENTE_EVAL' ? 80 : 100
                    }
                    className="h-3 bg-white dark:bg-gray-700"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <span className={practica.estado === 'PENDIENTE' ? 'font-semibold text-orange-600' : ''}>
                      Pendiente
                    </span>
                    <span className={practica.estado === 'PENDIENTE_ACEPTACION_DOCENTE' ? 'font-semibold text-yellow-600' : ''}>
                      Aprobación
                    </span>
                    <span className={practica.estado === 'EN_CURSO' ? 'font-semibold text-blue-600' : ''}>
                      En Curso
                    </span>
                    <span className={practica.estado === 'FINALIZADA_PENDIENTE_EVAL' ? 'font-semibold text-purple-600' : ''}>
                      Finalizada
                    </span>
                    <span className={practica.estado === 'EVALUACION_COMPLETA' || practica.estado === 'CERRADA' ? 'font-semibold text-green-600' : ''}>
                      Completa
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-t border-gray-200 dark:border-gray-600 p-6">
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                {/* Botón Completar Acta 1 */}
                {practica.estado === 'PENDIENTE' && (
                  <Button asChild size="default" className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                    <Link href={`/alumno/mis-practicas/${practica.id}/completar-acta`}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Completar Acta 1
                    </Link>
                  </Button>
                )}
                
                {/* Botón Subir/Ver Informe */}
                {puedeSubirInforme(practica.estado) && (
                  <Button asChild size="default" variant="outline" className="flex-1 border-2 border-primary/20 hover:border-primary bg-white dark:bg-gray-800 hover:bg-primary/5 dark:hover:bg-primary/10 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                    <Link href={`/alumno/subir-informe?practicaId=${practica.id}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      {practica.informeUrl ? 'Ver/Actualizar Informe' : 'Subir Informe Final'}
                    </Link>
                  </Button>
                )}
                
                {/* Botón de información adicional */}
                {practica.estado !== 'PENDIENTE' && (
                  <Button asChild size="default" variant="ghost" className="flex-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    <Link href={`/alumno/mis-practicas/${practica.id}`}>
                      <Info className="mr-2 h-4 w-4" />
                      Ver Detalles
                    </Link>
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}