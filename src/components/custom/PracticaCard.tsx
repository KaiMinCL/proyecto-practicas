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
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Edit3, 
  FileText, 
  Calendar, 
  MapPin, 
  User, 
  Building, 
  Clock, 
  GraduationCap, 
  Star, 
  Info 
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import type { PracticaConDetalles } from '@/lib/validators/practica';

interface PracticaCardProps {
  practica: PracticaConDetalles;
  showAllButtons?: boolean;
}

const getEstadoBadge = (estado: string) => {
  const variants = {
    'PENDIENTE': { variant: 'outline' as const, label: 'Pendiente' },
    'PENDIENTE_ACEPTACION_DOCENTE': { variant: 'default' as const, label: 'Pendiente Aprobación' },
    'RECHAZADA_DOCENTE': { variant: 'destructive' as const, label: 'Rechazada' },
    'EN_CURSO': { variant: 'default' as const, label: 'En Curso' },
    'FINALIZADA_PENDIENTE_EVAL': { variant: 'default' as const, label: 'Finalizada' },
    'EVALUACION_COMPLETA': { variant: 'success' as const, label: 'Evaluada' },
    'CERRADA': { variant: 'outline' as const, label: 'Cerrada' },
    'ANULADA': { variant: 'destructive' as const, label: 'Anulada' },
  };
  
  return variants[estado as keyof typeof variants] || variants['PENDIENTE'];
};

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) {
  return (
    <div className="flex items-center space-x-3 p-2 rounded-md bg-muted/30 border border-border">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function PracticaCard({ practica, showAllButtons = true }: PracticaCardProps) {
  const estadoBadge = getEstadoBadge(practica.estado);
  
  const puedeVerEvaluacionInforme = (estado: string): boolean => {
    return [
      'EVALUACION_COMPLETA',
      'CERRADA'
    ].includes(estado);
  };

  const puedeSubirInforme = (estado: string): boolean => {
    return [
      'EN_CURSO',
      'FINALIZADA_PENDIENTE_EVAL',
      'EVALUACION_COMPLETA',
    ].includes(estado);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="bg-card border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary text-primary-foreground shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2 text-foreground">
                Práctica {practica.tipo === 'LABORAL' ? 'Laboral' : 'Profesional'}
              </CardTitle>
              <CardDescription className="text-base font-medium text-muted-foreground">
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
        <div className="pt-6 border-t border-border">
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Progreso de la Práctica</span>
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
      
      <CardFooter className="border-t border-border bg-card p-4">
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
          {showAllButtons && puedeSubirInforme(practica.estado) && (
            <Button asChild size="sm" variant="outline" className="flex-1">
              <Link href={`/alumno/mis-practicas/${practica.id}?action=subir-informe`}>
                <FileText className="mr-2 h-4 w-4" />
                {practica.informeUrl ? 'Ver/Actualizar Informe' : 'Subir Informe Final'}
              </Link>
            </Button>
          )}
          
          {/* Botón Ver Evaluaciones */}
          {showAllButtons && puedeVerEvaluacionInforme(practica.estado) && (
            <Button asChild size="sm" variant="default" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg">
              <Link href={`/alumno/mis-practicas/${practica.id}?action=evaluaciones`}>
                <Star className="mr-2 h-4 w-4 fill-current" />
                Ver Evaluaciones
              </Link>
            </Button>
          )}
          
          {/* Botón de información adicional */}
          {practica.estado !== 'PENDIENTE' && (
            <Button asChild size="sm" variant="outline" className="flex-1">
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
}
