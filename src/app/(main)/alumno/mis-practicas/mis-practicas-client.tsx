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
    'PENDIENTE': { variant: 'secondary' as const, label: 'Pendiente' },
    'PENDIENTE_ACEPTACION_DOCENTE': { variant: 'default' as const, label: 'Pendiente Aprobación' },
    'RECHAZADA_DOCENTE': { variant: 'destructive' as const, label: 'Rechazada' },
    'EN_CURSO': { variant: 'default' as const, label: 'En Curso' },
    'FINALIZADA_PENDIENTE_EVAL': { variant: 'default' as const, label: 'Finalizada' },
    'EVALUACION_COMPLETA': { variant: 'success' as const, label: 'Evaluada' },
    'CERRADA': { variant: 'outline' as const, label: 'Cerrada' },
    'ANULADA': { variant: 'destructive' as const, label: 'Anulada' },
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
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="w-12 h-12 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          No tienes prácticas asignadas
        </h3>
        <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed mb-6">
          Cuando tu coordinador inicie el registro de una práctica para ti, aparecerá aquí para que puedas completar la información requerida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          <Button asChild>
            <Link href="/dashboard">
              <Info className="mr-2 h-4 w-4" />
              Ir al Dashboard
            </Link>
          </Button>
          <Button asChild variant="secondary">
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
          <Card key={practica.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary text-primary-foreground">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      Práctica {practica.tipo === 'LABORAL' ? 'Laboral' : 'Profesional'}
                    </CardTitle>
                    <CardDescription className="text-base font-medium">
                      {practica.carrera?.nombre || 'Carrera no especificada'}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={estadoBadge.variant} className="shadow-sm">
                  {estadoBadge.label}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              {/* Información del estudiante */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <InfoItem icon={User} label="Estudiante" value={`${practica.alumno?.usuario.nombre} ${practica.alumno?.usuario.apellido}`} />
                  <InfoItem icon={MapPin} label="Sede" value={practica.carrera?.sede?.nombre || 'N/A'} />
                  <InfoItem icon={User} label="Docente Tutor" value={`${practica.docente?.usuario?.nombre || ''} ${practica.docente?.usuario?.apellido || 'No asignado'}`} />
                </div>
                
                <div className="space-y-2">
                  <InfoItem icon={Calendar} label="Fecha Inicio" value={format(new Date(practica.fechaInicio), "PPP", { locale: es })} />
                  <InfoItem icon={Calendar} label="Fecha Término" value={format(new Date(practica.fechaTermino), "PPP", { locale: es })} />
                  {practica.direccionCentro && (
                    <InfoItem icon={Building} label="Centro Práctica" value={practica.direccionCentro} />
                  )}
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className="pt-6 border-t">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">Progreso de la Práctica</span>
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
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="border-t p-4">
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                {/* Botón Completar Acta 1 */}
                {practica.estado === 'PENDIENTE' && (
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/alumno/mis-practicas/${practica.id}/completar-acta`}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Completar Acta 1
                    </Link>
                  </Button>
                )}
                
                {/* Botón Subir/Ver Informe */}
                {puedeSubirInforme(practica.estado) && (
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href={`/alumno/subir-informe?practicaId=${practica.id}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      {practica.informeUrl ? 'Ver/Actualizar Informe' : 'Subir Informe Final'}
                    </Link>
                  </Button>
                )}
                
                {/* Botón de información adicional */}
                {practica.estado !== 'PENDIENTE' && (
                  <Button asChild size="sm" variant="secondary" className="flex-1">
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

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) {
  return (
    <div className="flex items-center space-x-3 p-2 rounded-md">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}