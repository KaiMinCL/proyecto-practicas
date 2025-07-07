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
    Building
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import type { PracticaConDetalles } from '@/lib/validators/practica';
import type { ActionResponse } from '../practicas/actions';

interface PracticasPendientesDocenteClienteProps {
  initialActionResponse: ActionResponse<PracticaConDetalles[]>;
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
        <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <UserCheck className="w-12 h-12 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          No tienes alumnos pendientes
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-md mx-auto leading-relaxed mb-6">
          Cuando un alumno complete su Acta 1 y seas el tutor asignado, la práctica aparecerá aquí para tu revisión y aceptación.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          <Button asChild variant="outline" className="hover:bg-purple-50 dark:hover:bg-purple-900/20">
            <Link href="/dashboard">
              <Info className="mr-2 h-4 w-4" />
              Ir al Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost" className="text-gray-600 dark:text-gray-400">
            <Link href="/docente/practicas">
              <BookOpen className="mr-2 h-4 w-4" />
              Ver Todas las Prácticas
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {practicas.map((practica) => (
        <Card key={practica.id} className="group hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple/20 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    {practica.alumno?.usuario.nombre} {practica.alumno?.usuario.apellido}
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {practica.alumno?.usuario.rut}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-1 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3 text-purple-600 dark:text-purple-400 animate-pulse" />
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Pendiente</span>
              </div>
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
            <Button asChild size="default" className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <Link href={`/docente/practicas-pendientes/${practica.id}/revisar-acta`}>
                <UserCheck className="mr-2 h-4 w-4" />
                Revisar y Decidir Acta 1
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}