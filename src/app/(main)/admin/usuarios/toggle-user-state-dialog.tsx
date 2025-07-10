'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { Button } from '@/components/ui/button';
import { UserCheck, UserX } from 'lucide-react';

interface ToggleUserStateDialogProps {
  userId: number;
  userName: string;
  isActive: boolean;
  onSuccess?: () => void;
}

export function ToggleUserStateDialog({ userId, userName, isActive, onSuccess }: ToggleUserStateDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const Icon = isActive ? UserX : UserCheck;
  const actionText = isActive ? 'Desactivar' : 'Activar';

  async function handleToggle() {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, estado: isActive ? 'INACTIVO' : 'ACTIVO' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
        setOpen(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(data.error || data.message || 'Error al actualizar usuario');
      }
    } catch (e) {
      toast.error('Error de red al actualizar usuario');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost"
          size="sm"
          className={isActive ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-green-50 hover:text-green-600'}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {actionText} Usuario
          </AlertDialogTitle>
          <AlertDialogDescription>
            <span className="mb-2 block">
              <strong>Usuario:</strong> {userName}
            </span>
            {isActive
              ? (
                <span>
                  ¿Está seguro que desea desactivar este usuario? No podrá iniciar sesión hasta que sea reactivado.
                </span>
              )
              : (
                <span>
                  ¿Está seguro que desea reactivar este usuario? Podrá volver a iniciar sesión en el sistema.
                </span>
              )
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            type="button"
            disabled={isSubmitting}
            onClick={handleToggle}
            className={isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
          >
            {isSubmitting ? (
              `${isActive ? 'Desactivando...' : 'Activando...'}`
            ) : (
              `${actionText}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
