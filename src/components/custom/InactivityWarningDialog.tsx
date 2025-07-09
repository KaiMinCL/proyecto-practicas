'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle, RotateCcw } from 'lucide-react';

interface InactivityWarningDialogProps {
  isOpen: boolean;
  onExtend: () => void;
  onClose: () => void;
  remainingSeconds?: number;
}

export function InactivityWarningDialog({ 
  isOpen, 
  onExtend, 
  onClose,
  remainingSeconds = 30 
}: InactivityWarningDialogProps) {
  const [countdown, setCountdown] = useState(remainingSeconds);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(remainingSeconds);
      return;
    }

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, remainingSeconds, onClose]);

  const handleExtend = () => {
    onExtend();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="w-5 h-5" />
            Sesión por Expirar
          </DialogTitle>
          <DialogDescription>
            Tu sesión se cerrará automáticamente por inactividad
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>Tiempo restante:</span>
                <span className="font-bold text-lg text-orange-600">
                  {countdown} segundo{countdown !== 1 ? 's' : ''}
                </span>
              </div>
            </AlertDescription>
          </Alert>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              Por seguridad, tu sesión se cerrará automáticamente tras 5 minutos de inactividad.
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleExtend}
              className="flex-1 flex items-center gap-2"
              style={{backgroundColor: '#007F7C'}}
            >
              <RotateCcw className="w-4 h-4" />
              Continuar Sesión
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            También puedes mover el mouse o presionar cualquier tecla para extender la sesión
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
