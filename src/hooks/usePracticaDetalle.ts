import { useState, useCallback } from 'react';

interface PracticaDetalle {
  id: number;
  alumno: {
    usuario: {
      rut: string;
      nombre: string;
      apellido: string;
      email: string;
    };
    carrera: {
      nombre: string;
      sede: {
        nombre: string;
      };
    };
  };
  docente: {
    usuario: {
      nombre: string;
      apellido: string;
    };
  };
  centroPractica?: {
    nombreEmpresa: string;
    direccion?: string;
    giro?: string;
    telefono?: string;
  };
  tipo: string;
  fechaInicio: string;
  fechaTermino: string;
  estado: string;
  creadoEn: string;
  direccionCentro?: string;
  departamento?: string;
  nombreJefeDirecto?: string;
  cargoJefeDirecto?: string;
  contactoCorreoJefe?: string;
  contactoTelefonoJefe?: string;
  practicaDistancia?: boolean;
  tareasPrincipales?: string;
  actaFinal?: {
    notaFinal: number;
    fechaCierre: string;
  };
  evaluacionDocente?: {
    nota: number;
    comentarios?: string;
    fecha: string;
  };
  evaluacionEmpleador?: {
    nota: number;
    comentarios?: string;
    fecha: string;
  };
}

export function usePracticaDetalle() {
  const [practica, setPractica] = useState<PracticaDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const obtenerPractica = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/practicas/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Práctica no encontrada');
        } else if (response.status === 403) {
          throw new Error('Sin permisos para ver esta práctica');
        } else {
          throw new Error('Error al cargar la práctica');
        }
      }
      
      const data = await response.json();
      setPractica(data);
    } catch (error) {
      console.error('Error al obtener práctica:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar la práctica');
    } finally {
      setLoading(false);
    }
  }, []);

  const limpiarPractica = useCallback(() => {
    setPractica(null);
    setError(null);
  }, []);

  return {
    practica,
    loading,
    error,
    obtenerPractica,
    limpiarPractica
  };
}
