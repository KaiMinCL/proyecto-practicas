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
import { Separator } from '@/components/ui/separator';
import { 
  Terminal, 
  Info, 
  FileText, 
  Calendar, 
  User, 
  Building, 
  GraduationCap,
  Award,
  Eye,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import type { PracticaConDetalles } from '@/lib/validators/practica';
import { ActionResponse } from '../../practicas/actions';

interface DetallePracticaAlumnoClientProps {
  initialActionResponse: ActionResponse<PracticaConDetalles>;
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

export function DetallePracticaAlumnoClient({ initialActionResponse }: DetallePracticaAlumnoClientProps) {
  const [practica] = React.useState<PracticaConDetalles | null>(initialActionResponse.data || null);
  const [error] = React.useState<string | null>(initialActionResponse.error || null);

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error al Cargar Detalles</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!practica) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Práctica no encontrada</AlertTitle>
          <AlertDescription>No se pudo cargar la información de esta práctica.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const estadoBadge = getEstadoBadge(practica.estado);
  const puedeVerActaFinal = practica.estado === 'CERRADA' && practica.actaFinal;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/alumno/mis-practicas">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Mis Prácticas
            </Link>
          </Button>
        </div>
      </div>

      {/* Información general de la práctica */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary text-primary-foreground">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  Práctica {practica.tipo === 'LABORAL' ? 'Laboral' : 'Profesional'}
                </CardTitle>
                <CardDescription className="text-lg font-medium">
                  {practica.carrera?.nombre || 'Carrera no especificada'}
                </CardDescription>
              </div>
            </div>
            <Badge variant={estadoBadge.variant} className="shadow-sm text-sm px-3 py-1">
              {estadoBadge.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Información básica */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center">
                <User className="w-5 h-5 mr-2" />
                Información del Estudiante
              </h3>
              <div className="space-y-2 pl-7">
                <InfoItem label="Nombre" value={`${practica.alumno?.usuario.nombre} ${practica.alumno?.usuario.apellido}`} />
                <InfoItem label="RUT" value={practica.alumno?.usuario.rut || 'N/A'} />
                <InfoItem label="Sede" value={practica.carrera?.sede?.nombre || 'N/A'} />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Fechas de la Práctica
              </h3>
              <div className="space-y-2 pl-7">
                <InfoItem label="Fecha de Inicio" value={format(new Date(practica.fechaInicio), "PPP", { locale: es })} />
                <InfoItem label="Fecha de Término" value={format(new Date(practica.fechaTermino), "PPP", { locale: es })} />
                {practica.fechaCompletadoAlumno && (
                  <InfoItem label="Acta 1 Completada" value={format(new Date(practica.fechaCompletadoAlumno), "PPP", { locale: es })} />
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Información del centro de práctica */}
          {practica.direccionCentro && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Centro de Práctica
              </h3>
              <div className="grid md:grid-cols-2 gap-4 pl-7">
                <InfoItem label="Dirección" value={practica.direccionCentro} />
                {practica.departamento && <InfoItem label="Departamento" value={practica.departamento} />}
                {practica.nombreJefeDirecto && <InfoItem label="Jefe Directo" value={practica.nombreJefeDirecto} />}
                {practica.cargoJefeDirecto && <InfoItem label="Cargo del Jefe" value={practica.cargoJefeDirecto} />}
                {practica.contactoCorreoJefe && <InfoItem label="Correo del Jefe" value={practica.contactoCorreoJefe} />}
                {practica.contactoTelefonoJefe && <InfoItem label="Teléfono del Jefe" value={practica.contactoTelefonoJefe} />}
                {practica.practicaDistancia !== null && (
                  <InfoItem label="Modalidad" value={practica.practicaDistancia ? 'A distancia' : 'Presencial'} />
                )}
              </div>
            </div>
          )}

          {/* Tareas principales */}
          {practica.tareasPrincipales && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Tareas Principales
              </h3>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm leading-relaxed">{practica.tareasPrincipales}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Información del docente tutor */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center">
              <User className="w-5 h-5 mr-2" />
              Docente Tutor
            </h3>
            <div className="pl-7">
              <InfoItem 
                label="Nombre" 
                value={`${practica.docente?.usuario?.nombre || ''} ${practica.docente?.usuario?.apellido || 'No asignado'}`} 
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t p-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {/* Ver informe si existe */}
            {practica.informeUrl && (
              <Button asChild variant="outline" className="flex-1">
                <Link href={practica.informeUrl} target="_blank">
                  <FileText className="mr-2 h-4 w-4" />
                  Ver Informe Final
                </Link>
              </Button>
            )}

            {/* Ver acta final si está disponible */}
            {puedeVerActaFinal && (
              <Button asChild className="flex-1">
                <Link href={`/alumno/mis-practicas/${practica.id}/acta-final`}>
                  <Award className="mr-2 h-4 w-4" />
                  Ver Acta Final
                </Link>
              </Button>
            )}

            {/* Otras acciones según el estado */}
            {practica.estado === 'PENDIENTE' && (
              <Button asChild className="flex-1">
                <Link href={`/alumno/mis-practicas/${practica.id}/completar-acta`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Completar Acta 1
                </Link>
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Sección de evaluaciones y resultados */}
      {(practica.evaluacionDocente || practica.evaluacionEmpleador || practica.actaFinal) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Evaluaciones y Resultados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Evaluación del docente */}
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Evaluación del Informe</h4>
                  {practica.evaluacionDocente ? (
                    <Badge variant="success" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completada
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Pendiente</Badge>
                  )}
                </div>
                {practica.evaluacionDocente ? (
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-green-600">{practica.evaluacionDocente.nota}</p>
                    <p className="text-xs text-muted-foreground">
                      Evaluada el {format(new Date(practica.evaluacionDocente.fecha), "PPP", { locale: es })}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Esperando evaluación del docente</p>
                )}
              </div>

              {/* Evaluación del empleador */}
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Evaluación del Empleador</h4>
                  {practica.evaluacionEmpleador ? (
                    <Badge variant="success" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completada
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Pendiente</Badge>
                  )}
                </div>
                {practica.evaluacionEmpleador ? (
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-green-600">{practica.evaluacionEmpleador.nota}</p>
                    <p className="text-xs text-muted-foreground">
                      Evaluada el {format(new Date(practica.evaluacionEmpleador.fecha), "PPP", { locale: es })}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Esperando evaluación del empleador</p>
                )}
              </div>
            </div>

            {/* Nota final */}
            {practica.actaFinal && (
              <div className="mt-6 p-6 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Nota Final de la Práctica</h3>
                  <div className="text-4xl font-bold text-green-600 mb-2">{practica.actaFinal.notaFinal}</div>
                  <p className="text-sm text-green-700">
                    Acta cerrada el {format(new Date(practica.actaFinal.fechaCierre), "PPP", { locale: es })}
                  </p>
                  {puedeVerActaFinal && (
                    <Button asChild className="mt-4" size="sm">
                      <Link href={`/alumno/mis-practicas/${practica.id}/acta-final`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Acta Final Completa
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
