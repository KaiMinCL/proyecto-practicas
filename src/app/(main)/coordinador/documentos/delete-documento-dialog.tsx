'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, AlertTriangle, FileText } from 'lucide-react';
import { DocumentoService } from '@/lib/services/documentoService';
import { toast } from 'sonner';

interface Documento {
  id: number;
  nombre: string;
  url: string;
  carreraId: number;
  sedeId: number;
  carrera?: {
    nombre: string;
  };
  sede?: {
    nombre: string;
  };
  creadoEn: string;
}

interface DeleteDocumentoDialogProps {
  documento: Documento;
  onDocumentoDeleted: (documentoId: number) => void;
}

export function DeleteDocumentoDialog({ documento, onDocumentoDeleted }: DeleteDocumentoDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      
      const response = await DocumentoService.eliminarDocumento(documento.id);
        if (response.success) {
        onDocumentoDeleted(documento.id);
        setOpen(false);
        toast.success("Documento eliminado correctamente");
      } else {
        toast.error(response.message || "No se pudo eliminar el documento");
      }    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error("Error al eliminar el documento");
    } finally {
      setLoading(false);
    }
  };
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:border-red-300"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Documento
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. El documento será eliminado permanentemente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">          {/* Información del documento */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Nombre:</strong> {documento.nombre}</p>
                <p><strong>URL:</strong> {documento.url}</p>
                {documento.carrera && (
                  <p><strong>Carrera:</strong> {documento.carrera.nombre}</p>
                )}
                {documento.sede && (
                  <p><strong>Sede:</strong> {documento.sede.nombre}</p>
                )}
                <p><strong>Fecha de creación:</strong> {formatDate(documento.creadoEn)}</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Advertencia */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>¿Estás seguro de que deseas eliminar este documento?</strong>
              <br />
              Esta acción eliminará permanentemente el documento y no podrá ser recuperado.
              Los estudiantes y empleadores ya no podrán acceder a este archivo.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Eliminar Documento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
