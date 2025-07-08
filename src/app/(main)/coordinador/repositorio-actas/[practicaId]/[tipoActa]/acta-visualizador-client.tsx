"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  User, 
  GraduationCap, 
  Building,
  Star,
  CheckCircle,
  PrinterIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Función mock para obtener detalle de práctica (TODO: implementar desde el servicio)
const obtenerDetallePracticaMock = async (): Promise<PracticaDetalle | null> => {
  // Esta función debe implementarse cuando se tengan los datos disponibles
  return null;
};

interface ActaVisualizadorClientProps {
  practicaId: number;
  tipoActa: 'ACTA1' | 'EVALUACION_INFORME' | 'EVALUACION_EMPLEADOR' | 'ACTA_FINAL';
}

interface PracticaDetalle {
  id: number;
  tipo: string;
  fechaInicio: Date;
  fechaTermino: Date;
  estado: string;
  direccionCentro?: string;
  departamento?: string;
  nombreJefeDirecto?: string;
  cargoJefeDirecto?: string;
  contactoCorreoJefe?: string;
  contactoTelefonoJefe?: string;
  practicaDistancia?: boolean;
  tareasPrincipales?: string;
  fechaCompletadoAlumno?: Date;
  motivoRechazoDocente?: string;
  informeUrl?: string;
  alumno: {
    usuario: {
      nombre: string;
      apellido: string;
      rut: string;
    };
    carrera: {
      nombre: string;
      sede: {
        nombre: string;
      };
    };
  };
  docente?: {
    usuario: {
      nombre: string;
      apellido: string;
    };
  };
  carrera: {
    nombre: string;
    sede: {
      nombre: string;
    };
  };
  centroPractica?: {
    nombreEmpresa: string;
    giro?: string;
  };
  evaluacionDocente?: {
    id: number;
    nota: number;
    fecha: Date;
    comentarios?: string;
    // Otros campos de evaluación
  };
  evaluacionEmpleador?: {
    id: number;
    nota: number;
    fecha: Date;
    comentarios?: string;
    // Otros campos de evaluación
  };
  actaFinal?: {
    id: number;
    notaFinal: number;
    notaFinalPonderada: number;
    estado: string;
    fechaValidacion: Date;
    fechaCierre?: Date;
    comentariosFinales?: string;
  };
}

const TITULOS_ACTA = {
  'ACTA1': 'Acta 1 - Supervisión de Práctica',
  'EVALUACION_INFORME': 'Evaluación de Informe de Práctica',
  'EVALUACION_EMPLEADOR': 'Acta 2 - Evaluación por Empleador',
  'ACTA_FINAL': 'Acta Final de Evaluación'
};

const InfoItem: React.FC<{ 
  label: string; 
  value?: string | number | boolean | null | Date; 
  isDate?: boolean; 
  isBoolean?: boolean;
  isList?: boolean;
}> = ({ label, value, isDate, isBoolean, isList }) => {
  let displayValue: React.ReactNode;
  
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    displayValue = <span className="text-muted-foreground italic">No provisto</span>;
  } else if (isDate && value instanceof Date) {
    displayValue = format(new Date(value), "PPP", { locale: es });
  } else if (isBoolean) {
    displayValue = value ? 'Sí' : 'No';
  } else if (isList && typeof value === 'string') {
    displayValue = <div className="whitespace-pre-wrap">{value}</div>;
  } else {
    displayValue = value.toString();
  }

  return (
    <div className="space-y-1">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{displayValue}</dd>
    </div>
  );
};

export function ActaVisualizadorClient({ practicaId, tipoActa }: ActaVisualizadorClientProps) {
  const router = useRouter();
  const [practica, setPractica] = useState<PracticaDetalle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarDatosPractica = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await obtenerDetallePracticaMock();
        
        if (result) {
          setPractica(result);
        } else {
          setError('No se pudieron cargar los datos del acta');
        }
      } catch (error) {
        console.error('Error cargando datos del acta:', error);
        setError('Error inesperado al cargar los datos del acta');
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatosPractica();
  }, [practicaId]);

  const handleVolver = () => {
    router.back();
  };

  const handleDescargar = () => {
    // TODO: Implementar descarga de PDF
    toast.info('Función de descarga en desarrollo');
  };

  const handleImprimir = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleVolver}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <Card>
          <CardHeader>
            <div className="animate-pulse space-y-2">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !practica) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleVolver}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <Alert>
          <AlertDescription>
            {error || 'No se pudieron cargar los datos del acta'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Validar que el tipo de acta corresponda con los datos disponibles
  const puedeVerActa = () => {
    switch (tipoActa) {
      case 'ACTA1':
        return practica.fechaCompletadoAlumno !== null;
      case 'EVALUACION_INFORME':
        return practica.evaluacionDocente !== null;
      case 'EVALUACION_EMPLEADOR':
        return practica.evaluacionEmpleador !== null;
      case 'ACTA_FINAL':
        return practica.actaFinal !== null;
      default:
        return false;
    }
  };

  if (!puedeVerActa()) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleVolver}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <Alert>
          <AlertDescription>
            El acta solicitada no está disponible para esta práctica.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado con navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleVolver}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Repositorio
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleImprimir}>
            <PrinterIcon className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={handleDescargar}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* Contenido del Acta */}
      <Card className="print:shadow-none">
        <CardHeader className="pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <CardTitle className="text-2xl">
                {TITULOS_ACTA[tipoActa]}
              </CardTitle>
              <CardDescription className="mt-2">
                Práctica ID: {practica.id} • Generada el{' '}
                {tipoActa === 'ACTA1' && practica.fechaCompletadoAlumno && 
                  format(new Date(practica.fechaCompletadoAlumno), 'PPP', { locale: es })}
                {tipoActa === 'EVALUACION_INFORME' && practica.evaluacionDocente && 
                  format(new Date(practica.evaluacionDocente.fecha), 'PPP', { locale: es })}
                {tipoActa === 'EVALUACION_EMPLEADOR' && practica.evaluacionEmpleador && 
                  format(new Date(practica.evaluacionEmpleador.fecha), 'PPP', { locale: es })}
                {tipoActa === 'ACTA_FINAL' && practica.actaFinal && 
                  format(new Date(practica.actaFinal.fechaValidacion), 'PPP', { locale: es })}
              </CardDescription>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-2">
                {practica.tipo === 'LABORAL' ? 'Práctica Laboral' : 'Práctica Profesional'}
              </Badge>
              <div className="text-sm text-muted-foreground">
                Estado: {practica.estado.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Información del Estudiante */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Información del Estudiante</span>
              </h3>
              <div className="grid grid-cols-1 gap-4 p-4 bg-muted/30 rounded-lg">
                <InfoItem 
                  label="Nombre Completo" 
                  value={`${practica.alumno.usuario.nombre} ${practica.alumno.usuario.apellido}`} 
                />
                <InfoItem label="RUT" value={practica.alumno.usuario.rut} />
                <InfoItem label="Carrera" value={practica.carrera.nombre} />
                <InfoItem label="Sede" value={practica.carrera.sede.nombre} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <GraduationCap className="h-5 w-5" />
                <span>Información de la Práctica</span>
              </h3>
              <div className="grid grid-cols-1 gap-4 p-4 bg-muted/30 rounded-lg">
                <InfoItem label="Tipo" value={practica.tipo === 'LABORAL' ? 'Práctica Laboral' : 'Práctica Profesional'} />
                <InfoItem label="Fecha de Inicio" value={practica.fechaInicio} isDate />
                <InfoItem label="Fecha de Término" value={practica.fechaTermino} isDate />
                {practica.docente && (
                  <InfoItem 
                    label="Docente Tutor" 
                    value={`${practica.docente.usuario.nombre} ${practica.docente.usuario.apellido}`} 
                  />
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contenido específico según el tipo de acta */}
          {tipoActa === 'ACTA1' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Información del Centro de Práctica</span>
              </h3>
              
              {practica.centroPractica && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <InfoItem label="Empresa" value={practica.centroPractica.nombreEmpresa} />
                  <InfoItem label="Giro" value={practica.centroPractica.giro} />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Ubicación y Departamento</h4>
                  <div className="space-y-3">
                    <InfoItem label="Dirección" value={practica.direccionCentro} />
                    <InfoItem label="Departamento" value={practica.departamento} />
                    <InfoItem label="Práctica a Distancia" value={practica.practicaDistancia} isBoolean />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Información del Jefe Directo</h4>
                  <div className="space-y-3">
                    <InfoItem label="Nombre" value={practica.nombreJefeDirecto} />
                    <InfoItem label="Cargo" value={practica.cargoJefeDirecto} />
                    <InfoItem label="Email" value={practica.contactoCorreoJefe} />
                    <InfoItem label="Teléfono" value={practica.contactoTelefonoJefe} />
                  </div>
                </div>
              </div>

              {practica.tareasPrincipales && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Tareas Principales a Desempeñar</h4>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <InfoItem label="" value={practica.tareasPrincipales} isList />
                  </div>
                </div>
              )}

              {practica.fechaCompletadoAlumno && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">
                    Acta completada por el alumno el {format(new Date(practica.fechaCompletadoAlumno), 'PPP', { locale: es })}
                  </span>
                </div>
              )}
            </div>
          )}

          {tipoActa === 'EVALUACION_INFORME' && practica.evaluacionDocente && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <span>Evaluación de Informe de Práctica</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {practica.evaluacionDocente.nota.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Nota Final</div>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-center">
                  <div className="text-lg font-semibold">
                    {format(new Date(practica.evaluacionDocente.fecha), 'PPP', { locale: es })}
                  </div>
                  <div className="text-sm text-muted-foreground">Fecha de Evaluación</div>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg text-center">
                  <div className="text-lg font-semibold">
                    {practica.docente ? `${practica.docente.usuario.nombre} ${practica.docente.usuario.apellido}` : 'No asignado'}
                  </div>
                  <div className="text-sm text-muted-foreground">Docente Evaluador</div>
                </div>
              </div>

              {practica.evaluacionDocente.comentarios && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Comentarios del Docente</h4>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm">{practica.evaluacionDocente.comentarios}</p>
                  </div>
                </div>
              )}

              {practica.informeUrl && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Informe disponible para descarga</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(practica.informeUrl!, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              )}
            </div>
          )}

          {tipoActa === 'EVALUACION_EMPLEADOR' && practica.evaluacionEmpleador && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <span>Evaluación por Empleador</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {practica.evaluacionEmpleador.nota.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Nota del Empleador</div>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-center">
                  <div className="text-lg font-semibold">
                    {format(new Date(practica.evaluacionEmpleador.fecha), 'PPP', { locale: es })}
                  </div>
                  <div className="text-sm text-muted-foreground">Fecha de Evaluación</div>
                </div>
              </div>

              {practica.evaluacionEmpleador.comentarios && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Comentarios del Empleador</h4>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm">{practica.evaluacionEmpleador.comentarios}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {tipoActa === 'ACTA_FINAL' && practica.actaFinal && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Acta Final de Evaluación</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {practica.actaFinal.notaFinalPonderada.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Nota Final Ponderada</div>
                </div>
                
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-center">
                  <div className="text-lg font-semibold">
                    {practica.actaFinal.notaFinal.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Nota Base</div>
                </div>
                
                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg text-center">
                  <div className="text-lg font-semibold">
                    {practica.actaFinal.estado}
                  </div>
                  <div className="text-sm text-muted-foreground">Estado</div>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-900/10 rounded-lg text-center">
                  <div className="text-sm font-semibold">
                    {practica.actaFinal.fechaCierre 
                      ? format(new Date(practica.actaFinal.fechaCierre), 'PP', { locale: es })
                      : format(new Date(practica.actaFinal.fechaValidacion), 'PP', { locale: es })
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {practica.actaFinal.fechaCierre ? 'Fecha de Cierre' : 'Fecha de Validación'}
                  </div>
                </div>
              </div>

              {/* Mostrar evaluaciones componentes */}
              {(practica.evaluacionDocente || practica.evaluacionEmpleador) && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Evaluaciones Componentes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {practica.evaluacionDocente && (
                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Evaluación de Informe</span>
                          <span className="font-bold">{practica.evaluacionDocente.nota.toFixed(1)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Evaluada por: {practica.docente ? `${practica.docente.usuario.nombre} ${practica.docente.usuario.apellido}` : 'No asignado'}
                        </div>
                      </div>
                    )}
                    
                    {practica.evaluacionEmpleador && (
                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Evaluación Empleador</span>
                          <span className="font-bold">{practica.evaluacionEmpleador.nota.toFixed(1)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Evaluada por el empleador
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {practica.actaFinal.comentariosFinales && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Comentarios Finales</h4>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm">{practica.actaFinal.comentariosFinales}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">
                  Acta final {practica.actaFinal.fechaCierre ? 'cerrada' : 'validada'} el{' '}
                  {format(
                    new Date(practica.actaFinal.fechaCierre || practica.actaFinal.fechaValidacion), 
                    'PPP', 
                    { locale: es }
                  )}
                </span>
              </div>

              {practica.actaFinal.notaFinalPonderada >= 4.0 && (
                <div className="text-center p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <div className="text-lg font-bold text-green-800 dark:text-green-300">
                    ✅ PRÁCTICA APROBADA
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                    El estudiante ha completado satisfactoriamente su práctica profesional
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pie del documento */}
          <Separator />
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Documento generado el {format(new Date(), 'PPP', { locale: es })} desde el Sistema de Gestión de Prácticas
            </p>
            <p className="mt-1">
              Este documento es una representación digital del acta original registrada en el sistema
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

