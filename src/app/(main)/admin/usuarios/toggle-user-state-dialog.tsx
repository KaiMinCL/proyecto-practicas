'use client';

import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { toast } from 'sonner';
import { deactivateUserAction, reactivateUserAction } from './actions';
import type { ToggleUserStateFormState } from './actions';
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

  const toggleAction = isActive ? deactivateUserAction : reactivateUserAction;
  const [state, formAction] = useFormState<ToggleUserStateFormState, FormData>(toggleAction, {
    message: undefined,
    errors: undefined,
    success: false
  });

  useEffect(() => {    
    if (state?.success) {
      setOpen(false);
      toast.success(state.message);
      if (onSuccess) onSuccess();
    } else if (state?.errors) {
      Object.entries(state.errors).forEach(([, messages]) => {
        if (Array.isArray(messages)) {
          messages.forEach((message) => toast.error(message));
        }
      });
    }
    setIsSubmitting(false);
  }, [state, onSuccess]);

  const Icon = isActive ? UserX : UserCheck;
  const actionText = isActive ? 'Desactivar' : 'Activar';

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
            <p className="mb-2">
              <strong>Usuario:</strong> {userName}
            </p>
            <p>
              {isActive 
                ? `¿Está seguro que desea desactivar este usuario? No podrá iniciar sesión hasta que sea reactivado.`
                : `¿Está seguro que desea reactivar este usuario? Podrá volver a iniciar sesión en el sistema.`
              }
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="id" value={userId} />
            <AlertDialogAction 
              type="submit" 
              disabled={isSubmitting}
              onClick={() => setIsSubmitting(true)}
              className={isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {isSubmitting ? (
                `${isActive ? 'Desactivando...' : 'Activando...'}`
              ) : (
                `${actionText}`
              )}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
