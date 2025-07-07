'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2, AlertTriangle } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Empleador {
  id: number;
  nombre: string;
  email: string;
}

interface CentroPractica {
  id: number;
  nombreEmpresa: string;
  giro?: string;
  direccion?: string;
  telefono?: string;
  emailGerente?: string;
  nombreContacto?: string;
  emailContacto?: string;
  telefonoContacto?: string;
  empleadores: Empleador[];
  cantidadPracticas: number;
}

interface DeleteCentroDialogProps {
  centro: CentroPractica;
  onSuccess: () => void;
}

export function DeleteCentroDialog({ centro, onSuccess }: DeleteCentroDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = centro.cantidadPracticas === 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/centros/${centro.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message);
        setOpen(false);
        onSuccess();
      } else {
        toast.error(result.error || 'Error al eliminar centro de práctica');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar centro de práctica');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={canDelete 
            ? "text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400" 
            : "text-gray-400 border-gray-200 cursor-not-allowed"
          }
          disabled={!canDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Centro de Práctica
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar el centro <strong>{centro.nombreEmpresa}</strong>?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Información del centro */}
          <div className="bg-gray-50 p-4 rounded-md space-y-2">
            <div>
              <span className="font-medium">Empresa:</span> {centro.nombreEmpresa}
            </div>
            {centro.giro && (
              <div>
                <span className="font-medium">Giro:</span> {centro.giro}
              </div>
            )}
            {centro.direccion && (
              <div>
                <span className="font-medium">Dirección:</span> {centro.direccion}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-medium">Empleadores asociados:</span>
              <Badge variant="outline">{centro.empleadores.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Prácticas:</span>
              <Badge variant={centro.cantidadPracticas > 0 ? "default" : "secondary"}>
                {centro.cantidadPracticas}
              </Badge>
            </div>
          </div>

          {/* Advertencias */}
          {!canDelete && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                No se puede eliminar este centro porque tiene {centro.cantidadPracticas} práctica{centro.cantidadPracticas !== 1 ? 's' : ''} asociada{centro.cantidadPracticas !== 1 ? 's' : ''}.
                Debes reasignar o eliminar las prácticas primero.
              </AlertDescription>
            </Alert>
          )}

          {canDelete && centro.empleadores.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Este centro tiene {centro.empleadores.length} empleador{centro.empleadores.length !== 1 ? 'es' : ''} asociado{centro.empleadores.length !== 1 ? 's' : ''}. 
                Al eliminar el centro, se eliminarán también estas asociaciones.
              </AlertDescription>
            </Alert>
          )}

          {canDelete && centro.empleadores.length === 0 && (
            <Alert className="border-green-200 bg-green-50">
              <AlertTriangle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Este centro no tiene empleadores ni prácticas asociadas. Se puede eliminar de forma segura.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          {canDelete && (
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar Centro'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
