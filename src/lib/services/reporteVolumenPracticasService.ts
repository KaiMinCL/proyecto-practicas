import { prisma } from '@/lib/prisma';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FiltrosVolumenPracticas {
  fechaDesde?: Date;
  fechaHasta?: Date;
  sedeId?: number;
  carreraId?: number;
}

export interface DatosVolumenPractica {
  id: number;
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

export interface ResumenVolumenPracticas {
  totalPracticas: number;
  porSede: DatosVolumenPractica[];
  porCarrera: DatosVolumenPractica[];
  porTipoPractica: DatosVolumenPractica[];
  periodoConsultado: {
    fechaDesde: Date;
    fechaHasta: Date;
  };
}

export interface OpcionesFiltrosVolumen {
  sedes: Array<{ id: number; nombre: string }>;
  carreras: Array<{ id: number; nombre: string; sedeId: number; sede: { nombre: string } }>;
  periodoDisponible: {
    fechaMasAntigua: Date | null;
    fechaMasReciente: Date | null;
  };
}

export class ReporteVolumenPracticasService {
  /**
   * Obtiene datos de volumen de prácticas iniciadas según filtros y permisos
   * Solo para usuarios SA (SUPER_ADMIN) y DC (DIRECTOR_CARRERA)
   */
  static async getVolumenPracticas(
    filtros: FiltrosVolumenPracticas,
    usuarioRol: string,
    usuarioSedeId?: number | null
  ): Promise<ApiResponse<ResumenVolumenPracticas>> {
    try {
      // Verificar permisos (HU-54)
      if (!['SUPER_ADMIN', 'DIRECTOR_CARRERA'].includes(usuarioRol)) {
        return {
          success: false,
          error: 'No tiene permisos para acceder a este reporte.',
        };
      }

      // Construir filtros base
      const whereBase: {
        fechaInicio?: {
          gte?: Date;
          lte?: Date;
        };
        carrera?: {
          sedeId?: number;
        };
        carreraId?: number;
      } = {};

      // Aplicar filtros por permisos (DC solo ve su sede)
      if (usuarioRol === 'DIRECTOR_CARRERA' && usuarioSedeId) {
        whereBase.carrera = {
          sedeId: usuarioSedeId,
        };
      }

      // Aplicar filtros adicionales
      if (filtros.sedeId) {
        whereBase.carrera = {
          ...(whereBase.carrera || {}),
          sedeId: filtros.sedeId,
        };
      }

      if (filtros.carreraId) {
        whereBase.carreraId = filtros.carreraId;
      }

      // Filtros por rango de fechas
      if (filtros.fechaDesde || filtros.fechaHasta) {
        const fechaFiltros: { gte?: Date; lte?: Date } = {};
        if (filtros.fechaDesde) {
          fechaFiltros.gte = filtros.fechaDesde;
        }
        if (filtros.fechaHasta) {
          fechaFiltros.lte = filtros.fechaHasta;
        }
        whereBase.fechaInicio = fechaFiltros;
      }

      // Obtener datos agregados
      const [
        totalPracticas,
        practicasPorCarreraParaSedes,
        practicasPorCarrera,
        practicasPorTipo,
      ] = await Promise.all([
        // Total de prácticas
        prisma.practica.count({ where: whereBase }),

        // Prácticas agrupadas por carrera (para calcular por sede)
        prisma.practica.groupBy({
          by: ['carreraId'],
          where: whereBase,
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
        }),

        // Prácticas agrupadas por carrera
        prisma.practica.groupBy({
          by: ['carreraId'],
          where: whereBase,
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
        }),

        // Prácticas agrupadas por tipo
        prisma.practica.groupBy({
          by: ['tipo'],
          where: whereBase,
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
        }),
      ]);

      // Obtener información detallada de carreras para agrupar por sede
      const carrerasConSede = await prisma.carrera.findMany({
        where: {
          id: {
            in: practicasPorCarreraParaSedes.map(p => p.carreraId),
          },
        },
        select: {
          id: true,
          nombre: true,
          sedeId: true,
          sede: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

      // Agrupar por sede manualmente
      const practicasPorSedeMap = new Map<number, { sede: { id: number; nombre: string }, count: number }>();
      
      practicasPorCarreraParaSedes.forEach(p => {
        const carrera = carrerasConSede.find(c => c.id === p.carreraId);
        if (carrera) {
          const sedeId = carrera.sede.id;
          const existing = practicasPorSedeMap.get(sedeId);
          if (existing) {
            existing.count += p._count.id;
          } else {
            practicasPorSedeMap.set(sedeId, {
              sede: carrera.sede,
              count: p._count.id,
            });
          }
        }
      });

      const porSede = Array.from(practicasPorSedeMap.values())
        .map(item => ({
          id: item.sede.id,
          nombre: item.sede.nombre,
          cantidad: item.count,
          porcentaje: totalPracticas > 0 ? Math.round((item.count / totalPracticas) * 100) : 0,
        }))
        .sort((a, b) => b.cantidad - a.cantidad);

      // Obtener información detallada de carreras para el resultado final
      const carrerasDataFinal = await prisma.carrera.findMany({
        where: {
          id: {
            in: practicasPorCarrera.map(p => p.carreraId),
          },
        },
        select: {
          id: true,
          nombre: true,
          sede: {
            select: {
              nombre: true,
            },
          },
        },
      });

      const porCarrera = practicasPorCarrera.map(p => {
        const carrera = carrerasDataFinal.find(c => c.id === p.carreraId);
        return {
          id: p.carreraId,
          nombre: carrera ? `${carrera.nombre} (${carrera.sede.nombre})` : 'Carrera no encontrada',
          cantidad: p._count.id,
          porcentaje: totalPracticas > 0 ? Math.round((p._count.id / totalPracticas) * 100) : 0,
        };
      });

      const porTipoPractica = practicasPorTipo.map(p => ({
        id: p.tipo === 'LABORAL' ? 1 : 2,
        nombre: p.tipo === 'LABORAL' ? 'Práctica Laboral' : 'Práctica Profesional',
        cantidad: p._count.id,
        porcentaje: totalPracticas > 0 ? Math.round((p._count.id / totalPracticas) * 100) : 0,
      }));

      const resultado: ResumenVolumenPracticas = {
        totalPracticas,
        porSede,
        porCarrera,
        porTipoPractica,
        periodoConsultado: {
          fechaDesde: filtros.fechaDesde || new Date(0),
          fechaHasta: filtros.fechaHasta || new Date(),
        },
      };

      return { success: true, data: resultado };
    } catch (error) {
      console.error('Error al obtener volumen de prácticas:', error);
      return {
        success: false,
        error: 'Error al generar el reporte de volumen de prácticas.',
      };
    }
  }

  /**
   * Obtiene las opciones disponibles para filtros del reporte
   */
  static async getOpcionesFiltrosVolumen(
    usuarioRol: string,
    usuarioSedeId?: number | null
  ): Promise<ApiResponse<OpcionesFiltrosVolumen>> {
    try {
      // Verificar permisos
      if (!['SUPER_ADMIN', 'DIRECTOR_CARRERA'].includes(usuarioRol)) {
        return {
          success: false,
          error: 'No tiene permisos para acceder a este reporte.',
        };
      }

      // Construir filtros por permisos
      const filtroSede = usuarioRol === 'DIRECTOR_CARRERA' && usuarioSedeId
        ? { id: usuarioSedeId }
        : {};

      const filtroCarrera = usuarioRol === 'DIRECTOR_CARRERA' && usuarioSedeId
        ? { sedeId: usuarioSedeId }
        : {};

      const [sedes, carreras, periodoDisponible] = await Promise.all([
        // Obtener sedes disponibles
        prisma.sede.findMany({
          where: filtroSede,
          select: {
            id: true,
            nombre: true,
          },
          orderBy: { nombre: 'asc' },
        }),

        // Obtener carreras disponibles
        prisma.carrera.findMany({
          where: filtroCarrera,
          select: {
            id: true,
            nombre: true,
            sedeId: true,
            sede: {
              select: {
                nombre: true,
              },
            },
          },
          orderBy: [
            { sede: { nombre: 'asc' } },
            { nombre: 'asc' },
          ],
        }),

        // Obtener rango de fechas disponible
        prisma.practica.aggregate({
          where: usuarioRol === 'DIRECTOR_CARRERA' && usuarioSedeId
            ? { carrera: { sedeId: usuarioSedeId } }
            : {},
          _min: {
            fechaInicio: true,
          },
          _max: {
            fechaInicio: true,
          },
        }),
      ]);

      const resultado: OpcionesFiltrosVolumen = {
        sedes,
        carreras,
        periodoDisponible: {
          fechaMasAntigua: periodoDisponible._min.fechaInicio,
          fechaMasReciente: periodoDisponible._max.fechaInicio,
        },
      };

      return { success: true, data: resultado };
    } catch (error) {
      console.error('Error al obtener opciones de filtros:', error);
      return {
        success: false,
        error: 'Error al obtener las opciones de filtros.',
      };
    }
  }

  /**
   * Exporta los datos del reporte en formato CSV
   */
  static async exportarCSV(
    datos: ResumenVolumenPracticas
  ): Promise<string> {
    try {
      const lines: string[] = [];
      
      // Header del archivo
      lines.push('Reporte de Volumen de Prácticas');
      lines.push(`Período: ${datos.periodoConsultado.fechaDesde.toLocaleDateString()} - ${datos.periodoConsultado.fechaHasta.toLocaleDateString()}`);
      lines.push(`Total de prácticas: ${datos.totalPracticas}`);
      lines.push('');

      // Datos por Sede
      lines.push('PRÁCTICAS POR SEDE');
      lines.push('Sede,Cantidad,Porcentaje');
      datos.porSede.forEach(sede => {
        lines.push(`"${sede.nombre}",${sede.cantidad},${sede.porcentaje}%`);
      });
      lines.push('');

      // Datos por Carrera
      lines.push('PRÁCTICAS POR CARRERA');
      lines.push('Carrera,Cantidad,Porcentaje');
      datos.porCarrera.forEach(carrera => {
        lines.push(`"${carrera.nombre}",${carrera.cantidad},${carrera.porcentaje}%`);
      });
      lines.push('');

      // Datos por Tipo
      lines.push('PRÁCTICAS POR TIPO');
      lines.push('Tipo,Cantidad,Porcentaje');
      datos.porTipoPractica.forEach(tipo => {
        lines.push(`"${tipo.nombre}",${tipo.cantidad},${tipo.porcentaje}%`);
      });

      return lines.join('\n');
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      throw new Error('Error al generar el archivo CSV');
    }
  }
}
