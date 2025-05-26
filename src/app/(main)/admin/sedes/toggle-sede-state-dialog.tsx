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
// Importa activateSedeAction
import { deactivateSedeAction, activateSedeAction, type ActionResponse } from "./actions"; 

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

  if (!sede) return null; // No renderizar si no hay sede

  const isActivating = sede.estado === "INACTIVO"; // Determina si la acción será activar
  const actionToPerformText = isActivating ? "activar" : "desactivar";
  const ActionIcon = isActivating ? CheckCircle : AlertTriangle;
  const actionButtonText = isActivating ? "Sí, activar" : "Sí, desactivar";
  
  // Define clases específicas para los botones de acción
  const actionButtonClasses = isActivating 
    ? "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white dark:text-gray-900" // Estilo para "Activar"
    : "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-gray-900"; // Estilo para "Desactivar"

  const handleConfirm = async () => {
    if (!sede) return;
    setIsSubmitting(true);

    try {
      let result: ActionResponse<Sede>;
      if (isActivating) {
        result = await activateSedeAction(sede.id.toString());
      } else { // Desactivando
        result = await deactivateSedeAction(sede.id.toString());
      }

      if (result.success && result.data) {
        toast.success(`Sede "${sede.nombre}" ${isActivating ? "activada" : "desactivada"} correctamente.`);
        onOpenChange(false);
      } else {
        toast.error(result.error || `No se pudo ${actionToPerformText} la sede.`);
      }
    } catch (error) {
      console.error(`Error al ${actionToPerformText} la sede:`, error);
      toast.error("Ocurrió un error inesperado. Por favor, inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => {
        if (isSubmitting && !isOpen) return; // Previene cierre accidental
        onOpenChange(isOpen);
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <ActionIcon className={`mr-2 h-5 w-5 ${isActivating ? "text-green-500" : "text-red-500"}`} />
            Confirmar {isActivating ? "Activación" : "Desactivación"} de Sede
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que quieres {actionToPerformText} la sede{" "}
            <strong>"{sede.nombre}"</strong>?
            {isActivating 
              ? " Esto permitirá que la sede vuelva a estar operativa en el sistema."
              : " Esto podría afectar a carreras y usuarios asociados."
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting} onClick={() => onOpenChange(false)}>
             <XCircle className="mr-2 h-4 w-4" />Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={actionButtonClasses}
          >
            {isSubmitting ? "Procesando..." : actionButtonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}