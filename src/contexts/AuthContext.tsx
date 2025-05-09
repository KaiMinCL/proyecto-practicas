'use client'; // Este contexto se usará en componentes cliente

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserJwtPayload, getUserSession, clearAuthCookie as clearSessionCookie } from '@/lib/auth'; // Asumiendo alias @/lib
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UserSession extends UserJwtPayload {
  // Añadir más propiedades específicas del cliente aquí si es necesario
  // Por ahora, UserJwtPayload ya tiene: userId, rut, rol, email, nombre, apellido
}

// 2. Define la forma del valor del contexto
interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  login: (tokenPayload: UserJwtPayload) => void; // Función para "simular" login en el cliente si es necesario
  logout: () => Promise<void>;
  // Añadir una función para recargar la sesión si es necesario
  // reloadSession: () => Promise<void>;
}

// 3. Crea el contexto con un valor por defecto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Crea el componente Proveedor del Contexto
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Inicia como true hasta que se cargue la sesión
  const router = useRouter();

  // Efecto para cargar la sesión del usuario al montar el proveedor
  useEffect(() => {
    async function loadUserSession() {
      setIsLoading(true);
      try {
        const session = await getUserSession(); // Esta función lee la cookie y verifica el JWT
        if (session) {
          setUser(session as UserSession);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error al cargar la sesión del usuario en AuthContext:", error);
        setUser(null); // Asegura que el usuario sea null si hay error
      } finally {
        setIsLoading(false);
      }
    }
    loadUserSession();
  }, []); // Se ejecuta solo una vez al montar

  // Función de login (principalmente para actualizar el estado del contexto si el login ocurre en el cliente)
  // el login real (cookie) ocurre en Server Action.
  // Esta función si despues de logear y redireccionar 
  // quisieramos forzar una actualización del estado del contexto sin recargar toda la página,
  // aunque el useEffect ya debería manejarlo al cargar la nueva página.
  // O si el token se obtuviera de una forma que no involucra una recarga de página completa.
  const login = (tokenPayload: UserJwtPayload) => {
    // Aquí, asumimos que la cookie ya está establecida por la Server Action.
    // Este 'login' es más para actualizar el estado del contexto si fuera necesario.
    // El useEffect debería ser suficiente en la mayoría de los casos post-redirección.
    setUser(tokenPayload as UserSession);
    // Podrías querer redirigir aquí si el login se manejara completamente en el cliente
    // router.push('/dashboard');
  };

  // Función de logout
  const logout = async () => {
    try {
      clearSessionCookie(); // Llama a la función que borra la cookie HttpOnly
      setUser(null);
      toast.success("Sesión cerrada exitosamente.");
      router.push('/'); // Redirige a la página de login (raíz)
      window.location.href = '/'; // Limpia el estado de la página
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast.error("Error al cerrar sesión. Por favor, inténtalo de nuevo.");
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

// 5. Crea un hook personalizado para usar el contexto fácilmente
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}