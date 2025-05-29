// src/app/(main)/docente/practicas-pendientes/[practicaId]/revisar-acta/revisar-acta-docente-client.tsx
"use client";

import React from 'react';
import { useRouter } from 'next/navigation'; // <--- CAMBIO AQUÍ
import { Button } from '@/components/ui/button';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ExternalLink, Building, User, Settings, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PracticaConDetalles, DecisionDocenteActaData } from '@/lib/validators/practica';
import { TipoPractica as PrismaTipoPracticaEnum, EstadoPractica as PrismaEstadoPracticaEnum } from '@prisma/client';
import { toast } from 'sonner';

// Asegúrate que la ruta de importación sea correcta
import { submitDecisionDocenteActaAction, type ActionResponse } from '../../../practicas/actions'; 
import { RejectionReasonModal } from './rejection-reason-modal';

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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Detalles de la Práctica</CardTitle>
            <CardDescription>Información registrada por el Coordinador y el Alumno.</CardDescription>
          </div>
          <Badge 
            variant={
                practica.estado === 'PENDIENTE_ACEPTACION_DOCENTE' ? 'outline' : 
                practica.estado === 'EN_CURSO' ? 'default' : 
                practica.estado === 'RECHAZADA_DOCENTE' ? 'destructive' : 
                'outline'
            } 
            className="text-sm capitalize"
          >
            {practica.estado.replace(/_/g, ' ').toLowerCase()}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="mb-6 pb-4 border-b">
            <h3 className="text-md font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center"><Settings className="mr-2 h-5 w-5"/>Datos Registrados por Coordinación</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6">
              <InfoItem label="Tipo de Práctica" value={practica.tipo === PrismaTipoPracticaEnum.LABORAL ? "Laboral" : "Profesional"} />
              <InfoItem label="Fecha de Inicio" value={practica.fechaInicio} isDate />
              <InfoItem label="Fecha de Término" value={practica.fechaTermino} isDate />
            </dl>
          </div>

          <div className="mb-6 pb-4 border-b">
            <h3 className="text-md font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center"><User className="mr-2 h-5 w-5"/>Datos del Alumno</h3>
             <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6">
              <InfoItem label="Nombre Completo" value={`${practica.alumno?.usuario.nombre} ${practica.alumno?.usuario.apellido}`} />
              <InfoItem label="RUT" value={practica.alumno?.usuario.rut} />
              <InfoItem label="Carrera" value={practica.carrera?.nombre} />
              <InfoItem label="Sede de Carrera" value={practica.carrera?.sede?.nombre} />
            </dl>
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

           <div>
            <h3 className="text-md font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center"><ClipboardList className="mr-2 h-5 w-5"/>Tareas Principales a Desempeñar</h3>
            <div className="p-3 border rounded-md bg-slate-50 dark:bg-slate-800/50 text-sm">
                <InfoItem label="" value={practica.tareasPrincipales} isList />
            </div>
          </div>
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
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white dark:text-gray-900"
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