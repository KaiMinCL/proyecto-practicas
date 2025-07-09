'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import { InactivityWarningDialog } from '@/components/custom/InactivityWarningDialog';

interface InactivityContextType {
  extendSession: () => void;
  getRemainingTime: () => number;
  isActive: () => boolean;
}

const InactivityContext = createContext<InactivityContextType | undefined>(undefined);

interface InactivityProviderProps {
  children: ReactNode;
}

export function InactivityProvider({ children }: InactivityProviderProps) {
  const [showWarning, setShowWarning] = useState(false);

  const { extendSession, getRemainingTime, isActive } = useInactivityTimer({
    timeout: 5 * 60 * 1000, // 5 minutos
    warningTime: 30 * 1000, // 30 segundos de warning
    excludeRoles: ['COORDINADOR'],
    onWarning: () => {
      setShowWarning(true);
    },
    onTimeout: () => {
      setShowWarning(false);
    }
  });

  const handleExtendSession = () => {
    extendSession();
    setShowWarning(false);
  };

  const handleCloseWarning = () => {
    setShowWarning(false);
  };

  return (
    <InactivityContext.Provider value={{ extendSession, getRemainingTime, isActive }}>
      {children}
      <InactivityWarningDialog
        isOpen={showWarning}
        onExtend={handleExtendSession}
        onClose={handleCloseWarning}
        remainingSeconds={30}
      />
    </InactivityContext.Provider>
  );
}

export function useInactivity() {
  const context = useContext(InactivityContext);
  if (context === undefined) {
    throw new Error('useInactivity must be used within an InactivityProvider');
  }
  return context;
}
