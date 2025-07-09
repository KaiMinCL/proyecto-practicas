'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const alertaManualSchema = z.object({
  asunto: z.string().min(1, 'El asunto es requerido').max(200, 'El asunto no puede exceder 200 caracteres'),
  mensaje: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres').max(1000, 'El mensaje no puede exceder 1000 caracteres'),
});

type AlertaManualFormData = z.infer<typeof alertaManualSchema>;

interface EnviarAlertaManualDialogProps {
  practicaId: number;
  alumnoNombre: string;
  alumnoEmail: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function EnviarAlertaManualDialog({
  practicaId,
  alumnoNombre,
  alumnoEmail,
  children,
  onSuccess
}: EnviarAlertaManualDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AlertaManualFormData>({
    resolver: zodResolver(alertaManualSchema),
    defaultValues: {
      asunto: '',
      mensaje: ''
    }
  });

  const onSubmit = async (data: AlertaManualFormData) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/alertas/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          practicaId,
          asunto: data.asunto,
          mensaje: data.mensaje
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar la alerta');
      }

      toast.success('Alerta enviada exitosamente', {
        description: `Se ha enviado una alerta a ${alumnoNombre} (${alumnoEmail})`
      });

      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error al enviar alerta manual:', error);
      toast.error('Error al enviar alerta', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Enviar Alerta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Enviar Alerta Manual
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del destinatario */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Destinatario:</strong> {alumnoNombre} ({alumnoEmail})
            </AlertDescription>
          </Alert>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="asunto">Asunto</Label>
              <Input
                id="asunto"
                placeholder="Ej: Problemas con documentación de práctica"
                {...form.register('asunto')}
                disabled={isSubmitting}
              />
              {form.formState.errors.asunto && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.asunto.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mensaje">Mensaje</Label>
              <Textarea
                id="mensaje"
                placeholder="Describe el problema específico o la acción que debe realizar el alumno..."
                className="min-h-[120px]"
                {...form.register('mensaje')}
                disabled={isSubmitting}
              />
              {form.formState.errors.mensaje && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.mensaje.message}
                </p>
              )}
              <p className="text-sm text-gray-500">
                Caracteres: {form.watch('mensaje')?.length || 0}/1000
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">📋 Información importante:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• La alerta se enviará inmediatamente por correo electrónico</li>
                <li>• El alumno recibirá un enlace para acceder al sistema</li>
                <li>• Esta alerta quedará registrada en el historial de la práctica</li>
                <li>• Se recomienda ser específico sobre las acciones requeridas</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Alerta
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
