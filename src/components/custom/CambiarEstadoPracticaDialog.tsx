'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, AlertCircle, CheckCircle2 } from 'lucide-react';
import { EstadoPractica } from '@prisma/client';
import { toast } from 'sonner';
import { cambiarEstadoPracticaAction } from '@/app/(main)/coordinador/practicas/actions';

interface CambiarEstadoPracticaDialogProps {
  practicaId: number;
  estadoActual: EstadoPractica;
  alumnoNombre?: string;
  onSuccess?: () => void;
}

// Mapeo de estados para mostrar en la UI
const estadosDisplayMap: Record<EstadoPractica, string> = {
  'PENDIENTE': 'Pendiente',
  'PENDIENTE_ACEPTACION_DOCENTE': 'Pendiente Aceptación Docente',
  'RECHAZADA_DOCENTE': 'Rechazada por Docente',
  'EN_CURSO': 'En Curso',
  'FINALIZADA_PENDIENTE_EVAL': 'Finalizada - Pendiente Evaluación',
  'EVALUACION_COMPLETA': 'Evaluación Completa',
  'CERRADA': 'Cerrada',
  'ANULADA': 'Anulada'
};

// Definir transiciones permitidas según el estado actual
const getTransicionesPermitidas = (estadoActual: EstadoPractica): EstadoPractica[] => {
  const transiciones: Record<EstadoPractica, EstadoPractica[]> = {
    'PENDIENTE': [
      'PENDIENTE_ACEPTACION_DOCENTE',
      'ANULADA'
    ],
    'PENDIENTE_ACEPTACION_DOCENTE': [
      'RECHAZADA_DOCENTE',
      'EN_CURSO',
      'ANULADA'
    ],
    'RECHAZADA_DOCENTE': [
      'PENDIENTE_ACEPTACION_DOCENTE',
      'ANULADA'
    ],
    'EN_CURSO': [
      'FINALIZADA_PENDIENTE_EVAL',
      'ANULADA'
    ],
    'FINALIZADA_PENDIENTE_EVAL': [
      'EVALUACION_COMPLETA',
      'EN_CURSO',
      'ANULADA'
    ],
    'EVALUACION_COMPLETA': [
      'CERRADA',
      'FINALIZADA_PENDIENTE_EVAL'
    ],
    'CERRADA': [],
    'ANULADA': ['PENDIENTE']
  };

  return transiciones[estadoActual] || [];
};

// Función para obtener el color del badge según el estado
const getEstadoBadgeVariant = (estado: EstadoPractica): "default" | "secondary" | "destructive" | "outline" => {
  switch (estado) {
    case 'PENDIENTE':
    case 'PENDIENTE_ACEPTACION_DOCENTE':
      return 'default';
    case 'EN_CURSO':
      return 'secondary';
    case 'ANULADA':
    case 'RECHAZADA_DOCENTE':
      return 'destructive';
    case 'CERRADA':
    case 'EVALUACION_COMPLETA':
      return 'outline';
    default:
      return 'default';
  }
};

export function CambiarEstadoPracticaDialog({
  practicaId,
  estadoActual,
  alumnoNombre,
  onSuccess
}: CambiarEstadoPracticaDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState<EstadoPractica | ''>('');
  const [motivo, setMotivo] = useState('');

  const transicionesPermitidas = getTransicionesPermitidas(estadoActual);
  const puedesCambiarEstado = transicionesPermitidas.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevoEstado) {
      toast.error('Selecciona un nuevo estado');
      return;
    }

    if (nuevoEstado === 'ANULADA' && !motivo.trim()) {
      toast.error('Debe proporcionar un motivo para anular la práctica');
      return;
    }

    setIsLoading(true);

    try {
      const result = await cambiarEstadoPracticaAction(
        practicaId,
        nuevoEstado,
        motivo.trim() || undefined
      );

      if (!result.success) {
        throw new Error(result.error || 'Error al cambiar estado');
      }

      toast.success('Estado de práctica actualizado exitosamente');
      setIsOpen(false);
      setNuevoEstado('');
      setMotivo('');
      onSuccess?.();

    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cambiar estado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setNuevoEstado('');
      setMotivo('');
    }
  };

  if (!puedesCambiarEstado) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Cambiar Estado
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Cambiar Estado de Práctica
          </DialogTitle>
          <DialogDescription>
            {alumnoNombre && (
              <span className="block mb-2">
                Práctica de: <strong>{alumnoNombre}</strong>
              </span>
            )}
            Cambia el estado de la práctica según su progreso real.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Estado Actual</Label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <Badge variant={getEstadoBadgeVariant(estadoActual)}>
                {estadosDisplayMap[estadoActual]}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nuevoEstado">Nuevo Estado *</Label>
            <Select value={nuevoEstado} onValueChange={(value) => setNuevoEstado(value as EstadoPractica)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el nuevo estado" />
              </SelectTrigger>
              <SelectContent>
                {transicionesPermitidas.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    <div className="flex items-center gap-2">
                      <Badge variant={getEstadoBadgeVariant(estado)} className="text-xs">
                        {estadosDisplayMap[estado]}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {nuevoEstado === 'ANULADA' && (
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo de Anulación *</Label>
              <Textarea
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Describe el motivo por el cual se anula la práctica..."
                className="min-h-[80px]"
                required
              />
            </div>
          )}

          {nuevoEstado && nuevoEstado !== 'ANULADA' && (
            <div className="space-y-2">
              <Label htmlFor="motivo">Observaciones (opcional)</Label>
              <Textarea
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Agrega observaciones sobre el cambio de estado..."
                className="min-h-[60px]"
              />
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Información importante:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• El cambio de estado se registrará en el log de auditoría</li>
                  <li>• Algunos cambios pueden ser irreversibles</li>
                  <li>• Los participantes serán notificados del cambio</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !nuevoEstado}
              className="gap-2"
              style={{ backgroundColor: '#007F7C' }}
            >
              {isLoading ? (
                'Cambiando...'
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Cambiar Estado
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
