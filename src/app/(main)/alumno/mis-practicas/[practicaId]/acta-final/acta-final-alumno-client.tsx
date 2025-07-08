"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Terminal, 
  Info, 
  FileText, 
  Calendar, 
  User, 
  Building, 
  Award,
  ArrowLeft,
  CheckCircle,
  Star
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { ActionResponse } from '../../../practicas/actions';

interface ActaFinalData {
  practica: {
    id: number;
    tipo: string;
    fechaInicio: Date;
    fechaTermino: Date;
    estado: string;
    alumno: {
      nombre: string;
      apellido: string;
      rut: string;
      carrera: string;
    };
    centroPractica?: {
      nombre: string | null;
      giro: string | null;
    } | null;
    docente: {
      nombre: string;
      apellido: string;
    };
  };
  evaluaciones: {
    informe: {
      nota: number;
      fecha: Date;
      porcentaje: number;
    };
    empleador: {
      nota: number;
      fecha: Date;
      porcentaje: number;
    };
  };
  notaFinalPonderada: number;
  fechaCierre: Date;
}

interface ActaFinalAlumnoClientProps {
  initialActionResponse: ActionResponse<ActaFinalData>;
}

const getNotaColor = (nota: number) => {
  if (nota >= 6.0) return 'text-green-600';
  if (nota >= 5.0) return 'text-blue-600';
  if (nota >= 4.0) return 'text-yellow-600';
  return 'text-red-600';
};

const getNotaBadgeVariant = (nota: number) => {
  if (nota >= 6.0) return 'success' as const;
  if (nota >= 5.0) return 'default' as const;
  if (nota >= 4.0) return 'secondary' as const;
  return 'destructive' as const;
};

export function ActaFinalAlumnoClient({ initialActionResponse }: ActaFinalAlumnoClientProps) {
  const [actaFinal] = React.useState<ActaFinalData | null>(initialActionResponse.data || null);
  const [error] = React.useState<string | null>(initialActionResponse.error || null);

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error al Cargar Acta Final</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!actaFinal) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Acta Final no disponible</AlertTitle>
          <AlertDescription>
            El Acta Final aún no está disponible. Tu docente tutor debe completar todas las evaluaciones y cerrar el acta.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const notaColor = getNotaColor(actaFinal.notaFinalPonderada);
  const notaBadge = getNotaBadgeVariant(actaFinal.notaFinalPonderada);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/alumno/mis-practicas/${actaFinal.practica.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Detalle de Práctica
            </Link>
          </Button>
        </div>
      </div>

      {/* Encabezado del Acta Final */}
      <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-emerald-600 text-white">
              <Award className="w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-emerald-800">
            Acta Final de Práctica Profesional
          </CardTitle>
          <CardDescription className="text-lg text-emerald-700">
            Calificación Oficial - Documento Cerrado
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Información del estudiante */}
          <div className="text-center bg-white/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-emerald-800 mb-4">Información del Estudiante</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <InfoItem label="Nombre Completo" value={`${actaFinal.practica.alumno.nombre} ${actaFinal.practica.alumno.apellido}`} />
              <InfoItem label="RUT" value={actaFinal.practica.alumno.rut} />
              <InfoItem label="Carrera" value={actaFinal.practica.alumno.carrera} />
              <InfoItem label="Tipo de Práctica" value={actaFinal.practica.tipo === 'LABORAL' ? 'Práctica Laboral' : 'Práctica Profesional'} />
            </div>
          </div>

          {/* Periodo de práctica */}
          <div className="bg-white/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-emerald-800 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Periodo de la Práctica
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <InfoItem 
                label="Fecha de Inicio" 
                value={format(new Date(actaFinal.practica.fechaInicio), "PPP", { locale: es })} 
              />
              <InfoItem 
                label="Fecha de Término" 
                value={format(new Date(actaFinal.practica.fechaTermino), "PPP", { locale: es })} 
              />
            </div>
          </div>

          {/* Centro de práctica */}
          {actaFinal.practica.centroPractica && (
            <div className="bg-white/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-emerald-800 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Centro de Práctica
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <InfoItem label="Empresa/Institución" value={actaFinal.practica.centroPractica.nombre || 'N/A'} />
                {actaFinal.practica.centroPractica.giro && (
                  <InfoItem label="Giro" value={actaFinal.practica.centroPractica.giro} />
                )}
              </div>
            </div>
          )}

          {/* Docente tutor */}
          <div className="bg-white/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-emerald-800 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Docente Tutor
            </h3>
            <InfoItem 
              label="Nombre" 
              value={`${actaFinal.practica.docente.nombre} ${actaFinal.practica.docente.apellido}`} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Evaluaciones detalladas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Detalle de Evaluaciones
          </CardTitle>
          <CardDescription>
            Evaluaciones que componen la nota final ponderada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Evaluación del informe */}
            <div className="p-6 rounded-lg border-2 border-blue-200 bg-blue-50/50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-lg text-blue-800">Evaluación del Informe</h4>
                <Badge variant="default" className="bg-blue-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completada
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-1">
                    {actaFinal.evaluaciones.informe.nota}
                  </div>
                  <p className="text-sm text-blue-700 font-medium">
                    Ponderación: {actaFinal.evaluaciones.informe.porcentaje}%
                  </p>
                </div>
                <p className="text-xs text-blue-600 text-center">
                  Evaluada el {format(new Date(actaFinal.evaluaciones.informe.fecha), "PPP", { locale: es })}
                </p>
                <div className="bg-blue-100 rounded p-3 text-center">
                  <p className="text-sm font-semibold text-blue-800">
                    Contribución: {((actaFinal.evaluaciones.informe.nota * actaFinal.evaluaciones.informe.porcentaje) / 100).toFixed(1)} puntos
                  </p>
                </div>
              </div>
            </div>

            {/* Evaluación del empleador */}
            <div className="p-6 rounded-lg border-2 border-green-200 bg-green-50/50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-lg text-green-800">Evaluación del Empleador</h4>
                <Badge variant="success" className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completada
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-1">
                    {actaFinal.evaluaciones.empleador.nota}
                  </div>
                  <p className="text-sm text-green-700 font-medium">
                    Ponderación: {actaFinal.evaluaciones.empleador.porcentaje}%
                  </p>
                </div>
                <p className="text-xs text-green-600 text-center">
                  Evaluada el {format(new Date(actaFinal.evaluaciones.empleador.fecha), "PPP", { locale: es })}
                </p>
                <div className="bg-green-100 rounded p-3 text-center">
                  <p className="text-sm font-semibold text-green-800">
                    Contribución: {((actaFinal.evaluaciones.empleador.nota * actaFinal.evaluaciones.empleador.porcentaje) / 100).toFixed(1)} puntos
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Nota final ponderada */}
          <div className="text-center py-8">
            <div className="max-w-md mx-auto p-8 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200">
              <div className="flex justify-center mb-4">
                <Star className="w-12 h-12 text-yellow-500" />
              </div>
              <h3 className="text-2xl font-bold text-amber-800 mb-2">Nota Final Ponderada</h3>
              <div className={`text-6xl font-bold mb-4 ${notaColor}`}>
                {actaFinal.notaFinalPonderada}
              </div>
              <Badge variant={notaBadge} className="text-base px-4 py-2">
                {actaFinal.notaFinalPonderada >= 4.0 ? 'APROBADA' : 'REPROBADA'}
              </Badge>
              <p className="text-sm text-amber-700 mt-4">
                Acta cerrada el {format(new Date(actaFinal.fechaCierre), "PPP", { locale: es })}
              </p>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-muted/30 rounded-lg p-6">
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">INFORMACIÓN IMPORTANTE</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Este documento constituye la calificación oficial de tu práctica profesional.</li>
              <li>• La nota final es el resultado de la ponderación entre la evaluación del informe y la evaluación del empleador.</li>
              <li>• Este acta ha sido cerrada por tu docente tutor y no puede ser modificada.</li>
              <li>• Conserva una copia de este documento para tus registros académicos.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-left">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
