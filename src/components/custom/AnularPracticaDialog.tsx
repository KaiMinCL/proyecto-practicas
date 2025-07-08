"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface AnularPracticaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  practicaId: number;
  alumnoNombre?: string;
  onSuccess?: () => void;
}

export function AnularPracticaDialog({ 
  isOpen, 
  onClose, 
  practicaId, 
  alumnoNombre,
  onSuccess 
}: AnularPracticaDialogProps) {
  const [motivo, setMotivo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAnular = async () => {
    if (motivo.trim().length < 10) {
      setError("El motivo debe tener al menos 10 caracteres");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/practicas/${practicaId}/anular`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ motivo: motivo.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al anular la práctica");
      }

      toast.success("Práctica anulada exitosamente");
      onClose();
      setMotivo("");
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setMotivo("");
      setError("");
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Anular Práctica
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              {alumnoNombre 
                ? `¿Está seguro que desea anular la práctica de ${alumnoNombre}?`
                : "¿Está seguro que desea anular esta práctica?"
              }
            </p>
            <p className="text-sm text-muted-foreground">
              Esta acción <strong>no se puede deshacer</strong>. La práctica quedará marcada como anulada 
              y no se considerará en reportes futuros.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo de la anulación <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="motivo"
              placeholder="Describa el motivo por el cual se anula esta práctica..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={isLoading}
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {motivo.length}/500 caracteres (mínimo 10)
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAnular}
            disabled={isLoading || motivo.trim().length < 10}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Anulando...
              </>
            ) : (
              "Confirmar Anulación"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
