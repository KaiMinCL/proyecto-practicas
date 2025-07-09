'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UseInactivityTimerOptions {
  timeout?: number; // en milisegundos
  warningTime?: number; // en milisegundos antes del timeout para mostrar warning
  excludeRoles?: string[]; // roles que están exentos del timeout
  onWarning?: () => void;
  onTimeout?: () => void;
}

export function useInactivityTimer(options: UseInactivityTimerOptions = {}) {
  const {
    timeout = 5 * 60 * 1000, // 5 minutos por defecto
    warningTime = 30 * 1000, // 30 segundos de warning por defecto
    excludeRoles = ['COORDINADOR'],
    onWarning,
    onTimeout
  } = options;

  const { user, logout } = useAuth();
  const router = useRouter();
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);

  // Función para hacer logout y redireccionar
  const handleTimeout = useCallback(async () => {
    if (onTimeout) {
      onTimeout();
    }

    try {
      await logout();
      toast.error('Sesión cerrada por inactividad', {
        description: 'Tu sesión se cerró automáticamente por seguridad',
        duration: 5000
      });
      router.push('/login');
    } catch (error) {
      console.error('Error durante logout automático:', error);
      // Forzar redirección incluso si hay error
      router.push('/login');
    }
  }, [logout, router, onTimeout]);

  // Función para mostrar warning
  const handleWarning = useCallback(() => {
    if (warningShownRef.current) return;
    
    warningShownRef.current = true;
    
    if (onWarning) {
      onWarning();
    } else {
      toast.warning('Sesión por expirar', {
        description: 'Tu sesión se cerrará en 30 segundos por inactividad. Mueve el mouse o presiona una tecla para continuar.',
        duration: 4000
      });
    }
  }, [onWarning]);

  // Función para resetear los timers
  const resetTimer = useCallback(() => {
    // Solo aplicar si el usuario existe y no está en roles exentos
    if (!user || excludeRoles.includes(user.rol)) {
      return;
    }

    lastActivityRef.current = Date.now();
    warningShownRef.current = false;

    // Limpiar timers existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Configurar timer de warning
    warningTimeoutRef.current = setTimeout(() => {
      handleWarning();
    }, timeout - warningTime);

    // Configurar timer de timeout
    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, timeout);
  }, [user, excludeRoles, timeout, warningTime, handleWarning, handleTimeout]);

  // Función para verificar si el usuario está activo
  const checkActivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    if (timeSinceLastActivity >= timeout) {
      handleTimeout();
    } else if (timeSinceLastActivity >= timeout - warningTime && !warningShownRef.current) {
      handleWarning();
    }
  }, [timeout, warningTime, handleTimeout, handleWarning]);

  useEffect(() => {
    // Lista de eventos que consideramos como actividad
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    // Solo activar si el usuario existe y no está en roles exentos
    if (!user || excludeRoles.includes(user.rol)) {
      return;
    }

    // Inicializar timer
    resetTimer();

    // Agregar listeners de eventos
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Verificar actividad periódicamente (cada 10 segundos)
    const intervalId = setInterval(checkActivity, 10000);

    // Limpiar al desmontar
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      clearInterval(intervalId);
    };
  }, [user, excludeRoles, resetTimer, checkActivity]);

  // Función para extender la sesión manualmente
  const extendSession = useCallback(() => {
    resetTimer();
    toast.success('Sesión extendida', {
      description: 'Tu sesión ha sido extendida exitosamente',
      duration: 2000
    });
  }, [resetTimer]);

  // Función para obtener tiempo restante
  const getRemainingTime = useCallback(() => {
    const now = Date.now();
    const elapsed = now - lastActivityRef.current;
    const remaining = Math.max(0, timeout - elapsed);
    return Math.ceil(remaining / 1000); // en segundos
  }, [timeout]);

  return {
    extendSession,
    getRemainingTime,
    isActive: () => getRemainingTime() > 0
  };
}
