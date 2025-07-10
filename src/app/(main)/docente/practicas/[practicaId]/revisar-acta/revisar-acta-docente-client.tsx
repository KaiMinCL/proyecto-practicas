// src/app/(main)/docente/practicas-pendientes/[practicaId]/revisar-acta/revisar-acta-docente-client.tsx
"use client";

import React from 'react';
import { useRouter } from 'next/navigation'; 
import { Button } from '@/components/ui/button';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    CheckCircle, 
    XCircle, 
    ExternalLink, 
    Building, 
    User, 
    Settings, 
    ClipboardList, 
    Download, 
    FileText,
    Calendar,
    MapPin,
    CheckCircle2,
    AlertTriangle,
    Share
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PracticaConDetalles, DecisionDocenteActaData } from '@/lib/validators/practica';
import { TipoPractica as PrismaTipoPracticaEnum, EstadoPractica as PrismaEstadoPracticaEnum } from '@prisma/client';
import { toast } from 'sonner';

// Asegúrate que la ruta de importación sea correcta
import { submitDecisionDocenteActaAction, type ActionResponse } from '../../actions'; 
import { RejectionReasonModal } from './rejection-reason-modal';
import { MapComponent } from '@/components/custom';

interface RevisarActaDocenteClienteProps {
  practica: PracticaConDetalles;
}

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
  } else if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
    displayValue = <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{value} <ExternalLink className="inline h-3 w-3 ml-1"/></a>;
  } else if (isList && typeof value === 'string') {
    displayValue = <div className="whitespace-pre-wrap">{value}</div>;
  }
  else {
    displayValue = value.toString();
  }

  return (
    <div className="py-2">
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{displayValue}</dd>
    </div>
  );
};

export function RevisarActaDocenteCliente({ practica: initialPractica }: RevisarActaDocenteClienteProps) {
  const router = useRouter();
  const [practica, setPractica] = React.useState<PracticaConDetalles>(initialPractica);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = React.useState(false);

  // Función para generar enlace de Google Maps
  const generateGoogleMapsUrl = (address: string): string => {
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  };

  // Función para compartir ubicación por correo
  const shareLocationByEmail = (practica: PracticaConDetalles) => {
    if (!practica.direccionCentro) {
      toast.error('No hay dirección disponible para compartir');
      return;
    }

    const googleMapsUrl = generateGoogleMapsUrl(practica.direccionCentro);
    const centroPractica = practica.centroPractica?.nombreEmpresa || 'Centro de Práctica';
    const alumnoNombre = practica.alumno 
      ? `${practica.alumno.usuario.nombre} ${practica.alumno.usuario.apellido}`
      : 'Alumno no especificado';
    
    const subject = encodeURIComponent(`Ubicación del Centro de Práctica - ${alumnoNombre}`);
    const body = encodeURIComponent(
      `Hola,\n\n` +
      `Te comparto la ubicación del Centro de Práctica para la supervisión:\n\n` +
      `Alumno: ${alumnoNombre}\n` +
      `Centro: ${centroPractica}\n` +
      `Dirección: ${practica.direccionCentro}\n` +
      `Teléfono: ${practica.contactoTelefonoJefe || 'No especificado'}\n` +
      `Jefe Directo: ${practica.nombreJefeDirecto || 'No especificado'}\n` +
      `Email Jefe: ${practica.contactoCorreoJefe || 'No especificado'}\n\n` +
      `Ver en Google Maps: ${googleMapsUrl}\n\n` +
      `Saludos cordiales`
    );

    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    
    try {
      window.location.href = mailtoUrl;
      toast.success('Cliente de correo abierto para compartir ubicación');
    } catch (error) {
      toast.error('Error al abrir el cliente de correo');
      console.error('Error al abrir mailto:', error);
    }
  };

  const handleDecision = async (decision: 'ACEPTADA' | 'RECHAZADA', motivoRechazo?: string) => {
    setIsProcessing(true);
    
    const decisionData: DecisionDocenteActaData = { decision };
    if (decision === 'RECHAZADA' && motivoRechazo) {
      decisionData.motivoRechazo = motivoRechazo;
    }

    try {
      const result: ActionResponse<PracticaConDetalles> = await submitDecisionDocenteActaAction(practica.id, decisionData);

      if (result.success && result.data) {
        toast.success(result.message || (decision === 'ACEPTADA' ? "Supervisión aceptada exitosamente." : "Práctica rechazada."));
        // Actualiza el estado local para reflejar el cambio inmediatamente en la UI de esta página
        setPractica(prev => ({ 
            ...prev, 
            estado: result.data?.estado || prev.estado, 
            motivoRechazoDocente: result.data?.motivoRechazoDocente || prev.motivoRechazoDocente 
        }));
        setIsRejectModalOpen(false); // Cierra el modal de rechazo si estaba abierto y fue exitoso
        
        // Redirigir a la lista de pendientes. 
        router.push('/docente/practicas-pendientes'); 

      } else {
        toast.error(result.error || "No se pudo procesar la decisión.");
        if (result.errors) {
            result.errors.forEach(err => {
                // Asumimos que el path del error es un string simple para campos del modal de rechazo
                const fieldPath = Array.isArray(err.field) ? err.field.join('.') : err.field.toString();
                toast.error(`Error en campo ${fieldPath}: ${err.message}`);
            });
        }
      }
    } catch (error) {
      console.error(`Error al ${decision.toLowerCase()} la práctica:`, error);
      toast.error("Ocurrió un error inesperado al procesar su decisión.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAccept = () => {
    handleDecision('ACEPTADA');
  };

  const handleOpenRejectModal = () => {
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (reason: string) => {
    await handleDecision('RECHAZADA', reason);
  };

  // El docente solo puede decidir si la práctica está pendiente de su aceptación
  const canDecide = practica.estado === PrismaEstadoPracticaEnum.PENDIENTE_ACEPTACION_DOCENTE;

  return (
    <div className="space-y-8">
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-t-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">Revisión de Acta 1</CardTitle>
              <CardDescription className="text-lg mt-1">
                Información registrada por el Coordinador y completada por el Alumno
              </CardDescription>
            </div>
            <Badge 
              variant={
                  practica.estado === 'PENDIENTE_ACEPTACION_DOCENTE' ? 'outline' : 
                  practica.estado === 'EN_CURSO' ? 'default' : 
                  practica.estado === 'RECHAZADA_DOCENTE' ? 'destructive' : 
                  'outline'
              } 
              className="text-sm font-semibold px-4 py-2"
              style={{
                backgroundColor: practica.estado === 'PENDIENTE_ACEPTACION_DOCENTE' ? '#FEF3C7' : 
                                practica.estado === 'EN_CURSO' ? '#00C853' : undefined,
                color: practica.estado === 'PENDIENTE_ACEPTACION_DOCENTE' ? '#92400E' :
                       practica.estado === 'EN_CURSO' ? 'white' : undefined,
                borderColor: practica.estado === 'PENDIENTE_ACEPTACION_DOCENTE' ? '#F59E0B' : undefined
              }}
            >
              {practica.estado === 'PENDIENTE_ACEPTACION_DOCENTE' && <AlertTriangle className="w-4 h-4 mr-1" />}
              {practica.estado === 'EN_CURSO' && <CheckCircle2 className="w-4 h-4 mr-1" />}
              {practica.estado.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          
          {/* Datos Registrados por Coordinación */}
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-4 flex items-center">
              <Settings className="mr-2 h-5 w-5"/>
              Datos Registrados por Coordinación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tipo de Práctica</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {practica.tipo === PrismaTipoPracticaEnum.LABORAL ? "Práctica Laboral" : "Práctica Profesional"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fecha de Inicio</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {format(new Date(practica.fechaInicio), "PPP", { locale: es })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fecha de Término</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {format(new Date(practica.fechaTermino), "PPP", { locale: es })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Datos del Alumno */}
          <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-4 flex items-center">
              <User className="mr-2 h-5 w-5"/>
              Información del Alumno
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nombre</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {practica.alumno?.usuario.nombre} {practica.alumno?.usuario.apellido}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">RUT</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {practica.alumno?.usuario.rut}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Carrera</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {practica.carrera?.nombre}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sede</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {practica.carrera?.sede?.nombre}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6 pb-4 border-b">
            <h3 className="text-md font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center"><Building className="mr-2 h-5 w-5"/>Información del Centro de Práctica</h3>
             <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6">
              <InfoItem label="Dirección Centro" value={practica.direccionCentro} />
              <InfoItem label="Departamento" value={practica.departamento} />
              <InfoItem label="Nombre Jefe Directo" value={practica.nombreJefeDirecto} />
              <InfoItem label="Cargo Jefe Directo" value={practica.cargoJefeDirecto} />
              <InfoItem label="Email Jefe Directo" value={practica.contactoCorreoJefe} />
              <InfoItem label="Teléfono Jefe Directo" value={practica.contactoTelefonoJefe} />
              <InfoItem label="Práctica a Distancia" value={practica.practicaDistancia} isBoolean />
            </dl>
          </div>

          {/* Mapa del centro de práctica */}
          {practica.direccionCentro && (
            <div className="mb-6 pb-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-md font-semibold text-gray-500 dark:text-gray-400 flex items-center">
                    <MapPin className="mr-2 h-5 w-5"/>
                    Ubicación del Centro de Práctica
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {practica.direccionCentro}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const googleMapsUrl = generateGoogleMapsUrl(practica.direccionCentro!);
                      window.open(googleMapsUrl, '_blank');
                      toast.success('Abriendo ubicación en Google Maps');
                    }}
                    className="flex items-center space-x-2"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Ver en Maps</span>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => shareLocationByEmail(practica)}
                    className="flex items-center space-x-2"
                  >
                    <Share className="w-4 h-4" />
                    <span>Compartir</span>
                  </Button>
                </div>
              </div>
              <MapComponent 
                address={practica.direccionCentro}
                title="Ubicación del Centro de Práctica"
                height="350px"
              />
            </div>
          )}

           <div>
            <h3 className="text-md font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center"><ClipboardList className="mr-2 h-5 w-5"/>Tareas Principales a Desempeñar</h3>
            <div className="p-3 border rounded-md bg-slate-50 dark:bg-slate-800/50 text-sm">
                <InfoItem label="" value={practica.tareasPrincipales} isList />
            </div>
          </div>

          {/* Sección Informe de Práctica */}
          {practica.informeUrl && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-md font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center">
                <FileText className="mr-2 h-5 w-5"/>Informe Final de Práctica
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6">
                <div> {/* Envuelve el botón en un div o usa InfoItem si prefieres consistencia */}
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Archivo Subido</dt>
                  <dd className="mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(practica.informeUrl!, '_blank')}
                      className="w-full sm:w-auto"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar Informe
                    </Button>
                  </dd>
                </div>
                {practica.fechaSubidaInforme && (
                   <InfoItem label="Fecha de Subida" value={practica.fechaSubidaInforme} isDate />
                )}
              </dl>
            </div>
          )}
          {/* Sección Informe de Práctica */}
        </CardContent>
      </Card>

      {canDecide && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end sm:space-x-3">
          <Button variant="destructive" onClick={handleOpenRejectModal} disabled={isProcessing} className="w-full sm:w-auto">
            <XCircle className="mr-2 h-4 w-4" />
            Rechazar Supervisión
          </Button>
          <Button 
            variant="default" 
            onClick={handleAccept} 
            disabled={isProcessing} 
            className="w-full sm:w-auto text-white"
            style={{backgroundColor: '#00C853', borderColor: '#00C853'}}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {isProcessing ? "Procesando..." : "Aceptar Supervisión"}
          </Button>
        </div>
      )}

      <RejectionReasonModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onSubmit={handleConfirmReject}
        isSubmittingReason={isProcessing}
      />
    </div>
  );
}