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
import { PowerIcon, UserCheck, UserX } from 'lucide-react';

interface ToggleUserStateDialogProps {
  userId: number;
  userName: string;
  isActive: boolean;
}

export function ToggleUserStateDialog({ userId, userName, isActive }: ToggleUserStateDialogProps) {
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
    } else if (state?.errors) {
      Object.entries(state.errors).forEach(([, messages]) => {
        if (Array.isArray(messages)) {
          messages.forEach((message) => toast.error(message));
        }
      });
    }
    setIsSubmitting(false);
  }, [state]);

  const Icon = isActive ? UserX : UserCheck;
  const actionText = isActive ? 'Desactivar' : 'Activar';
  const buttonVariant = isActive ? 'destructive' : 'default';

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost"
          size="sm"
          className={`hover:${isActive ? 'bg-red-50 hover:text-red-600' : 'bg-green-50 hover:text-green-600'}`}
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
          <AlertDialogDescription className="space-y-2">
            <p>
              <strong>Usuario:</strong> {userName}
            </p>
            <p>
              {isActive 
                ? `¿Está seguro que desea desactivar este usuario? Una vez desactivado, el usuario no podrá iniciar sesión en el sistema hasta que sea reactivado.`
                : `¿Está seguro que desea reactivar este usuario? Una vez reactivado, el usuario podrá volver a iniciar sesión en el sistema.`
              }
            </p>
            <div className={`p-3 rounded-lg ${isActive ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <p className={`text-sm font-medium ${isActive ? 'text-red-800' : 'text-green-800'}`}>
                {isActive ? '⚠️ Esta acción es reversible' : '✓ Esta acción es reversible'}
              </p>
              <p className={`text-xs mt-1 ${isActive ? 'text-red-600' : 'text-green-600'}`}>
                {isActive 
                  ? 'Puede reactivar al usuario en cualquier momento.'
                  : 'Puede desactivar al usuario nuevamente si es necesario.'
                }
              </p>
            </div>
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
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isActive ? 'Desactivando...' : 'Activando...'}
                </>
              ) : (
                <>
                  <Icon className="h-4 w-4 mr-2" />
                  {actionText}
                </>
              )}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
