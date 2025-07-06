'use client';

import { toast } from 'sonner';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const notify = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    toast.error(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  },

  info: (message: string, options?: ToastOptions) => {
    toast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    });
  },

  loading: (message: string, options?: Omit<ToastOptions, 'action'>) => {
    return toast.loading(message, {
      description: options?.description,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success: typeof success === 'function' ? success : () => success,
      error: typeof error === 'function' ? error : () => error,
    });
  },

  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },

  dismissAll: () => {
    toast.dismiss();
  },
};

// Tipos de notificaciones específicas para el dominio de la aplicación
export const practiceNotify = {
  practiceCreated: (studentName: string) => {
    notify.success('Práctica iniciada exitosamente', {
      description: `Se ha iniciado la práctica para ${studentName}. El estudiante recibirá una notificación para completar el Acta 1.`,
      duration: 6000,
    });
  },

  practiceUpdated: () => {
    notify.success('Práctica actualizada', {
      description: 'Los cambios se han guardado correctamente.',
    });
  },

  documentUploaded: (documentType: string) => {
    notify.success('Documento subido', {
      description: `${documentType} se ha subido exitosamente.`,
    });
  },

  evaluationSubmitted: () => {
    notify.success('Evaluación enviada', {
      description: 'La evaluación se ha enviado correctamente y está siendo procesada.',
    });
  },

  practiceApproved: () => {
    notify.success('Práctica aprobada', {
      description: 'La práctica ha sido aprobada por el docente tutor.',
    });
  },

  practiceRejected: (reason?: string) => {
    notify.error('Práctica rechazada', {
      description: reason || 'La práctica ha sido rechazada. Revisa los comentarios del docente.',
      duration: 8000,
    });
  },

  sessionExpiring: () => {
    notify.warning('Sesión expirando', {
      description: 'Tu sesión expirará en 5 minutos. Guarda tu trabajo.',
      action: {
        label: 'Renovar',
        onClick: () => window.location.reload(),
      },
    });
  },

  networkError: () => {
    notify.error('Error de conexión', {
      description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      action: {
        label: 'Reintentar',
        onClick: () => window.location.reload(),
      },
    });
  },
};
