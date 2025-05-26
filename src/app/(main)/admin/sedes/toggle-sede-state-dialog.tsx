"use client";

import React from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

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
import type { Sede } from "@/lib/validators/sede";
import { deactivateSedeAction, type ActionResponse } from "./actions";

interface ToggleSedeStateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sede: Sede | null;
}

export function ToggleSedeStateDialog({
  open,
  onOpenChange,
  sede,
}: ToggleSedeStateDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!sede) return null;

  const actionToPerform = sede.estado === "ACTIVO" ? "desactivar" : "activar";
  const ActionIcon = actionToPerform === "desactivar" ? AlertTriangle : CheckCircle; 
  const actionButtonVariant = actionToPerform === "desactivar" ? "destructive" : "default";
  const actionButtonText = actionToPerform === "desactivar" ? "Sí, desactivar" : "Sí, activar";

  const handleConfirm = async () => {
    if (!sede) return;
    setIsSubmitting(true);

    try {
      let result: ActionResponse<Sede>;
      if (actionToPerform === "desactivar") {
        result = await deactivateSedeAction(sede.id.toString());
      } else {
        // Placeholder para activar - necesitarías una activateSedeAction
        toast.info("La funcionalidad de activar sede aún no está implementada.");
        setIsSubmitting(false);
        onOpenChange(false);
        return;
        // result = await activateSedeAction(sede.id.toString()); // Cuando exista
      }

      if (result.success && result.data) {
        toast.success(`Sede "${sede.nombre}" ${actionToPerform === "desactivar" ? "desactivada" : "activada"} correctamente.`);
        onOpenChange(false);
      } else {
        toast.error(result.error || `No se pudo ${actionToPerform} la sede.`);
      }
    } catch (error) {
      console.error(`Error al ${actionToPerform} la sede:`, error);
      toast.error("Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <ActionIcon className={`mr-2 h-5 w-5 ${actionToPerform === "desactivar" ? "text-red-500" : "text-green-500"}`} />
            Confirmar {actionToPerform === "desactivar" ? "Desactivación" : "Activación"} de Sede
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que quieres {actionToPerform} la sede{" "}
            <strong>"{sede.nombre}"</strong>?
            {actionToPerform === "desactivar" && (
              " Esto podría afectar a carreras y usuarios asociados."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting} onClick={() => onOpenChange(false)}>
             <XCircle className="mr-2 h-4 w-4" />Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={actionButtonVariant === "destructive" ? 
              "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white" : 
              "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"
            }
          >
            {isSubmitting ? "Procesando..." : actionButtonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}