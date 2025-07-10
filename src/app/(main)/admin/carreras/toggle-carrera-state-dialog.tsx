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
import type { Carrera as FullCarreraType } from '@/lib/validators/carrera';
import { deactivateCarreraAction, activateCarreraAction, type ActionResponse } from "./actions";

interface ToggleCarreraStateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carrera: FullCarreraType | null; 
}

export function ToggleCarreraStateDialog({
  open,
  onOpenChange,
  carrera,
}: ToggleCarreraStateDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!carrera) return null;

  const isActivating = carrera.estado === "INACTIVO";
  const actionToPerformText = isActivating ? "activar" : "desactivar";
  const ActionIcon = isActivating ? CheckCircle : AlertTriangle;

  const actionButtonClasses = isActivating 
    ? "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white dark:text-gray-900"
    : "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-gray-900";

  const handleConfirm = async () => {
    if (!carrera) return;
    setIsSubmitting(true);

    try {
      let result: ActionResponse<FullCarreraType>;
      if (isActivating) {
        result = await activateCarreraAction(carrera.id.toString());
      } else {
        result = await deactivateCarreraAction(carrera.id.toString());
      }

      if (result.success && result.data) {
        if (result.message) { 
          toast.info(result.message);
        } else {
          toast.success(`Carrera "${carrera.nombre}" ${isActivating ? "activada" : "desactivada"} correctamente.`);
        }
        onOpenChange(false);
      } else {
        toast.error(result.error || `No se pudo ${actionToPerformText} la carrera.`);
      }
    } catch (error) {
      console.error(`Error al ${actionToPerformText} la carrera:`, error);
      toast.error("Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => {
        if (isSubmitting && !isOpen) return;
        onOpenChange(isOpen);
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <ActionIcon className={`mr-2 h-5 w-5 ${isActivating ? "text-green-500" : "text-red-500"}`} />
            Confirmar {isActivating ? "Activación" : "Desactivación"} de Carrera
          </AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que quieres {actionToPerformText} la carrera{" "}
            <strong>{carrera.nombre}</strong> (Sede: {carrera.sede?.nombre || 'N/A'})?
            {isActivating 
              ? " Esto permitirá que la carrera vuelva a estar operativa en el sistema."
              : " Esto podría afectar a alumnos y procesos asociados."
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
            className={actionButtonClasses} // Aplica estilos dinámicos
          >
            {isSubmitting ? "Procesando..." : (isActivating ? "Sí, activar" : "Sí, desactivar")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}