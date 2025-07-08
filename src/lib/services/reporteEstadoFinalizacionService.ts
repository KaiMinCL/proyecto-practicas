import { prisma } from '@/lib/prisma';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FiltrosEstadoFinalizacion {
  fechaDesde?: Date;
  fechaHasta?: Date;
  sedeId?: number;
  carreraId?: number;
}

export interface DatosEstadoPractica {
  estado: string;
  cantidad: number;
  porcentaje: number;
  descripcion: string;
}

export interface ResumenEstadoFinalizacion {
  totalPracticas: number;
  porEstado: DatosEstadoPractica[];
  detalleEstados: {
    terminadas: number;
    enCurso: number;
    anuladas: number;
    pendientes: number;
    rechazadas: number;
  };
  periodoConsultado: {
    fechaDesde: Date;
    fechaHasta: Date;
  };
}

export interface OpcionesFiltrosEstado {
  sedes: Array<{ id: number; nombre: string }>;
  carreras: Array<{ id: number; nombre: string; sedeId: number; sede: { nombre: string } }>;
  periodoDisponible: {
    fechaMasAntigua: Date | null;
    fechaMasReciente: Date | null;
  };
  estadosDisponibles: Array<{ estado: string; descripcion: string; cantidad: number }>;
}

export class ReporteEstadoFinalizacionService {
  /**
   * Obtiene datos del estado de finalización de prácticas según filtros y permisos
   * Solo para usuarios SA (SUPER_ADMIN) y DC (DIRECTOR_CARRERA)
   */
  static async getEstadoFinalizacion(
    filtros: FiltrosEstadoFinalizacion,
    usuarioRol: string,
    usuarioSedeId?: number | null
  ): Promise<ApiResponse<ResumenEstadoFinalizacion>> {
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

      // Obtener datos agregados por estado
      const [
        totalPracticas,
        practicasPorEstado,
      ] = await Promise.all([
        // Total de prácticas
        prisma.practica.count({ where: whereBase }),

        // Prácticas agrupadas por estado
        prisma.practica.groupBy({
          by: ['estado'],
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

      // Mapear estados a descripciones más amigables
      const mapeoEstados: Record<string, string> = {
        'CERRADA': 'Terminadas',
        'EN_CURSO': 'En Curso',
        'ANULADA': 'Anuladas',
        'PENDIENTE': 'Pendientes',
        'PENDIENTE_ACEPTACION_DOCENTE': 'Pendientes Aceptación',
        'RECHAZADA_DOCENTE': 'Rechazadas por Docente',
        'FINALIZADA_PENDIENTE_EVAL': 'Pendientes Evaluación',
        'EVALUACION_COMPLETA': 'Evaluación Completa',
      };

      // Procesar datos por estado
      const porEstado: DatosEstadoPractica[] = practicasPorEstado.map(p => ({
        estado: p.estado,
        cantidad: p._count.id,
        porcentaje: totalPracticas > 0 ? Math.round((p._count.id / totalPracticas) * 100) : 0,
        descripcion: mapeoEstados[p.estado] || p.estado,
      }));

      // Calcular detalle de estados
      const detalleEstados = {
        terminadas: practicasPorEstado.find(p => p.estado === 'CERRADA')?._count.id || 0,
        enCurso: practicasPorEstado.find(p => p.estado === 'EN_CURSO')?._count.id || 0,
        anuladas: practicasPorEstado.find(p => p.estado === 'ANULADA')?._count.id || 0,
        pendientes: practicasPorEstado.find(p => p.estado === 'PENDIENTE')?._count.id || 0,
        rechazadas: practicasPorEstado.find(p => p.estado === 'RECHAZADA_DOCENTE')?._count.id || 0,
      };

      const resultado: ResumenEstadoFinalizacion = {
        totalPracticas,
        porEstado,
        detalleEstados,
        periodoConsultado: {
          fechaDesde: filtros.fechaDesde || new Date(0),
          fechaHasta: filtros.fechaHasta || new Date(),
        },
      };

      return { success: true, data: resultado };
    } catch (error) {
      console.error('Error al obtener estado de finalización:', error);
      return {
        success: false,
        error: 'Error al generar el reporte de estado de finalización.',
      };
    }
  }

  /**
   * Obtiene las opciones disponibles para filtros del reporte
   */
  static async getOpcionesFiltrosEstado(
    usuarioRol: string,
    usuarioSedeId?: number | null
  ): Promise<ApiResponse<OpcionesFiltrosEstado>> {
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

      const filtroPermisoPracticas = usuarioRol === 'DIRECTOR_CARRERA' && usuarioSedeId
        ? { carrera: { sedeId: usuarioSedeId } }
        : {};

      const [sedes, carreras, periodoDisponible, estadosDisponibles] = await Promise.all([
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
          where: filtroPermisoPracticas,
          _min: {
            fechaInicio: true,
          },
          _max: {
            fechaInicio: true,
          },
        }),

        // Obtener estados disponibles
        prisma.practica.groupBy({
          by: ['estado'],
          where: filtroPermisoPracticas,
          _count: {
            id: true,
          },
          orderBy: {
            estado: 'asc',
          },
        }),
      ]);

      // Mapear estados con descripciones
      const mapeoEstados: Record<string, string> = {
        'CERRADA': 'Terminadas',
        'EN_CURSO': 'En Curso',
        'ANULADA': 'Anuladas',
        'PENDIENTE': 'Pendientes',
        'PENDIENTE_ACEPTACION_DOCENTE': 'Pendientes Aceptación',
        'RECHAZADA_DOCENTE': 'Rechazadas por Docente',
        'FINALIZADA_PENDIENTE_EVAL': 'Pendientes Evaluación',
        'EVALUACION_COMPLETA': 'Evaluación Completa',
      };

      const estadosConDescripcion = estadosDisponibles.map(e => ({
        estado: e.estado,
        descripcion: mapeoEstados[e.estado] || e.estado,
        cantidad: e._count.id,
      }));

      const resultado: OpcionesFiltrosEstado = {
        sedes,
        carreras,
        periodoDisponible: {
          fechaMasAntigua: periodoDisponible._min.fechaInicio,
          fechaMasReciente: periodoDisponible._max.fechaInicio,
        },
        estadosDisponibles: estadosConDescripcion,
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
    datos: ResumenEstadoFinalizacion
  ): Promise<string> {
    try {
      const lines: string[] = [];
      
      // Header del archivo
      lines.push('Reporte de Estado de Finalización de Prácticas');
      lines.push(`Período: ${datos.periodoConsultado.fechaDesde.toLocaleDateString()} - ${datos.periodoConsultado.fechaHasta.toLocaleDateString()}`);
      lines.push(`Total de prácticas: ${datos.totalPracticas}`);
      lines.push('');

      // Resumen por estado
      lines.push('RESUMEN POR ESTADO');
      lines.push('Estado,Cantidad,Porcentaje');
      datos.porEstado.forEach(estado => {
        lines.push(`"${estado.descripcion}",${estado.cantidad},${estado.porcentaje}%`);
      });
      lines.push('');

      // Detalle de estados
      lines.push('DETALLE DE ESTADOS');
      lines.push('Categoría,Cantidad');
      lines.push(`"Terminadas",${datos.detalleEstados.terminadas}`);
      lines.push(`"En Curso",${datos.detalleEstados.enCurso}`);
      lines.push(`"Anuladas",${datos.detalleEstados.anuladas}`);
      lines.push(`"Pendientes",${datos.detalleEstados.pendientes}`);
      lines.push(`"Rechazadas",${datos.detalleEstados.rechazadas}`);

      return lines.join('\n');
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      throw new Error('Error al generar el archivo CSV');
    }
  }
}
