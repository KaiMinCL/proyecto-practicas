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
import { PowerIcon } from 'lucide-react';

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
      Object.entries(state.errors).forEach(([_key, messages]) => {
        if (Array.isArray(messages)) {
          messages.forEach((message) => toast.error(message));
        }
      });
    }
    setIsSubmitting(false);
  }, [state]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant={isActive ? "destructive" : "default"}
          size="icon"
        >
          <PowerIcon className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isActive ? "Desactivar" : "Reactivar"} Usuario
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isActive 
              ? `¿Está seguro que desea desactivar al usuario ${userName}? El usuario no podrá iniciar sesión.`
              : `¿Está seguro que desea reactivar al usuario ${userName}? El usuario podrá volver a iniciar sesión.`
            }
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
            >
              {isActive ? "Desactivar" : "Reactivar"}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
