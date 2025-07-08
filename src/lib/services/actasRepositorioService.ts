import prisma from '@/lib/prisma';

// Tipos para el repositorio de actas
export interface FiltrosRepositorioActas {
  alumnoQuery?: string; // Búsqueda por nombre o RUT
  sedeId?: number;
  carreraId?: number;
  anioAcademico?: number;
  semestre?: number;
  tipoActa?: 'ACTA1' | 'EVALUACION_INFORME' | 'EVALUACION_EMPLEADOR' | 'ACTA_FINAL';
}

export interface ActaHistorica {
  id: number;
  practicaId: number;
  tipo: 'ACTA1' | 'EVALUACION_INFORME' | 'EVALUACION_EMPLEADOR' | 'ACTA_FINAL';
  titulo: string;
  fechaCreacion: Date;
  estado: string;
  alumno: {
    nombre: string;
    apellido: string;
    rut: string;
  };
  carrera: {
    nombre: string;
    sede: {
      nombre: string;
    };
  };
  docente?: {
    nombre: string;
    apellido: string;
  };
  // Datos específicos según el tipo de acta
  nota?: number;
  notaFinal?: number;
  // URLs para descarga (cuando aplique)
  urlDescarga?: string;
}

export class ActasRepositorioService {
  /**
   * Obtiene el historial de actas según los filtros aplicados
   */
  static async obtenerActasHistoricas(
    filtros: FiltrosRepositorioActas,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    usuarioSedeId?: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    usuarioCarreraIds?: number[]
  ): Promise<{
    success: boolean;
    data?: ActaHistorica[];
    error?: string;
  }> {
    try {
      // Por ahora retornar datos mock hasta que tengamos las relaciones correctas
      // En la implementación real se usarán usuarioSedeId y usuarioCarreraIds para filtrar por permisos
      const actasMock: ActaHistorica[] = [
        {
          id: 1001,
          practicaId: 1,
          tipo: 'ACTA1',
          titulo: 'Acta 1 - Supervisión de Práctica',
          fechaCreacion: new Date('2024-03-15'),
          estado: 'COMPLETADA',
          alumno: {
            nombre: 'Juan',
            apellido: 'Pérez',
            rut: '12345678-9'
          },
          carrera: {
            nombre: 'Ingeniería en Informática',
            sede: {
              nombre: 'Sede Santiago'
            }
          },
          docente: {
            nombre: 'María',
            apellido: 'González'
          }
        },
        {
          id: 1002,
          practicaId: 1,
          tipo: 'EVALUACION_EMPLEADOR',
          titulo: 'Acta 2 - Evaluación por Empleador',
          fechaCreacion: new Date('2024-07-20'),
          estado: 'COMPLETADA',
          nota: 6.5,
          alumno: {
            nombre: 'Juan',
            apellido: 'Pérez',
            rut: '12345678-9'
          },
          carrera: {
            nombre: 'Ingeniería en Informática',
            sede: {
              nombre: 'Sede Santiago'
            }
          },
          docente: {
            nombre: 'María',
            apellido: 'González'
          }
        }
      ];

      // Aplicar filtros básicos a los datos mock
      let actasFiltradas = actasMock;

      if (filtros.alumnoQuery) {
        const query = filtros.alumnoQuery.toLowerCase();
        actasFiltradas = actasFiltradas.filter(acta => 
          acta.alumno.nombre.toLowerCase().includes(query) ||
          acta.alumno.apellido.toLowerCase().includes(query) ||
          acta.alumno.rut.includes(query)
        );
      }

      if (filtros.tipoActa) {
        actasFiltradas = actasFiltradas.filter(acta => acta.tipo === filtros.tipoActa);
      }

      return {
        success: true,
        data: actasFiltradas
      };

    } catch (error) {
      console.error('Error al obtener actas históricas:', error);
      return {
        success: false,
        error: 'Error al obtener el historial de actas'
      };
    }
  }

  /**
   * Obtiene los datos de sedes disponibles para el usuario
   */
  static async obtenerSedesDisponibles(usuarioSedeId?: number) {
    try {
      const whereCondition = usuarioSedeId ? { id: usuarioSedeId } : {};

      const sedes = await prisma.sede.findMany({
        where: {
          ...whereCondition,
          estado: 'ACTIVO'
        },
        select: {
          id: true,
          nombre: true
        },
        orderBy: { nombre: 'asc' }
      });

      return { success: true, data: sedes };
    } catch (error) {
      console.error('Error al obtener sedes:', error);
      return { success: false, error: 'Error al obtener sedes' };
    }
  }

  /**
   * Obtiene las carreras disponibles para el usuario (filtradas por sede)
   */
  static async obtenerCarrerasDisponibles(sedeId?: number, usuarioCarreraIds?: number[]) {
    try {
      const whereCondition = {
        estado: 'ACTIVO' as const,
        ...(sedeId ? { sedeId } : {}),
        ...(usuarioCarreraIds && usuarioCarreraIds.length > 0 ? { id: { in: usuarioCarreraIds } } : {})
      };

      const carreras = await prisma.carrera.findMany({
        where: whereCondition,
        select: {
          id: true,
          nombre: true,
          sede: {
            select: {
              nombre: true
            }
          }
        },
        orderBy: [
          { sede: { nombre: 'asc' } },
          { nombre: 'asc' }
        ]
      });

      return { success: true, data: carreras };
    } catch (error) {
      console.error('Error al obtener carreras:', error);
      return { success: false, error: 'Error al obtener carreras' };
    }
  }
}
