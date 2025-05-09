'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserJwtPayload } from '@/lib/auth'; 
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AuthContextType {
  user: UserJwtPayload | null;
  isLoading: boolean;
  login: (tokenPayload: UserJwtPayload) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserJwtPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUserSession() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const sessionData = await response.json();
          if (sessionData) { // Check if sessionData is not null
            setUser(sessionData as UserJwtPayload);
          } else {
            setUser(null);
          }
        } else {
          setUser(null); // Fijar el estado de usuario a null si la respuesta no es ok
        }
      } catch (error) {
        console.error("Error al cargar la sesión del usuario en AuthContext:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUserSession();
  }, []);

  const login = (tokenPayload: UserJwtPayload) => {
    setUser(tokenPayload as UserJwtPayload);
    // El login real lo realiza una serverAction
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to logout via API');
      }
      
      setUser(null);
      toast.success("Sesión cerrada exitosamente.");
      window.location.href = '/'; 
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast.error("Error al cerrar sesión. Por favor, inténtalo de nuevo.");
      // Fallback: si la API falla, limpiar el estado local
      setUser(null);
      if (router) { // Asegúrar que el router esté disponible
         router.push('/');
      } else {
         window.location.href = '/'; // Fallback si router no está disponible
      }
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}