import { prisma } from '@/lib/prisma';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FiltrosNominaAlumnos {
  fechaDesde?: Date;
  fechaHasta?: Date;
  sedeId?: number;
  carreraId?: number;
  estado?: string;
}

export interface AlumnoEnPractica {
  rutAlumno: string;
  nombreAlumno: string;
  apellidoAlumno: string;
  carrera: string;
  centroPractica: string;
  jefeDirecto: string;
  docenteTutor: string;
  fechaInicio: Date;
  fechaTermino: Date | null;
  estado: string;
}

export interface ResumenNominaAlumnos {
  totalAlumnos: number;
  alumnos: AlumnoEnPractica[];
  filtrosAplicados: {
    periodo?: { fechaDesde: Date; fechaHasta: Date };
    sede?: string;
    carrera?: string;
    estado?: string;
  };
}

export interface OpcionesFiltrosNomina {
  sedes: Array<{ id: number; nombre: string }>;
  carreras: Array<{ id: number; nombre: string; sedeId: number; sede: { nombre: string } }>;
  estados: Array<{ valor: string; descripcion: string }>;
  periodoDisponible: {
    fechaMasAntigua: Date | null;
    fechaMasReciente: Date | null;
  };
}

export class ReporteNominaAlumnosService {
  /**
   * Obtiene datos de la nómina de alumnos en práctica según filtros y permisos
   * Solo para usuarios DC (DIRECTOR_CARRERA) y COORDINADOR
   */
  static async getNominaAlumnos(
    filtros: FiltrosNominaAlumnos,
    usuarioRol: string,
    usuarioSedeId?: number | null
  ): Promise<ApiResponse<ResumenNominaAlumnos>> {
    try {
      // Verificar permisos (HU-54)
      if (!['DIRECTOR_CARRERA', 'COORDINADOR'].includes(usuarioRol)) {
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
        estado?: 'PENDIENTE' | 'PENDIENTE_ACEPTACION_DOCENTE' | 'RECHAZADA_DOCENTE' | 'EN_CURSO' | 'FINALIZADA_PENDIENTE_EVAL' | 'EVALUACION_COMPLETA' | 'CERRADA' | 'ANULADA';
      } = {};

      // Aplicar filtros por permisos (DC y Coordinador solo ven su sede)
      if (['DIRECTOR_CARRERA', 'COORDINADOR'].includes(usuarioRol) && usuarioSedeId) {
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

      // Filtro por estado (por defecto 'EN_CURSO' para alumnos actualmente en práctica)
      if (filtros.estado) {
        whereBase.estado = filtros.estado as 'PENDIENTE' | 'PENDIENTE_ACEPTACION_DOCENTE' | 'RECHAZADA_DOCENTE' | 'EN_CURSO' | 'FINALIZADA_PENDIENTE_EVAL' | 'EVALUACION_COMPLETA' | 'CERRADA' | 'ANULADA';
      } else {
        whereBase.estado = 'EN_CURSO'; // Default: solo alumnos en curso
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

      // Obtener datos de prácticas con toda la información requerida
      const practicas = await prisma.practica.findMany({
        where: whereBase,
        include: {
          alumno: {
            include: {
              usuario: true,
            },
          },
          carrera: {
            include: {
              sede: true,
            },
          },
          centroPractica: true,
          docente: {
            include: {
              usuario: true,
            },
          },
        },
        orderBy: [
          { carrera: { nombre: 'asc' } },
          { alumno: { usuario: { apellido: 'asc' } } },
          { alumno: { usuario: { nombre: 'asc' } } },
        ],
      });

      // Mapear los datos a la estructura requerida
      const alumnos: AlumnoEnPractica[] = practicas.map(practica => ({
        rutAlumno: practica.alumno.usuario.rut,
        nombreAlumno: practica.alumno.usuario.nombre,
        apellidoAlumno: practica.alumno.usuario.apellido,
        carrera: practica.carrera.nombre,
        centroPractica: practica.centroPractica?.nombreEmpresa || 'No asignado',
        jefeDirecto: practica.nombreJefeDirecto || 'No asignado',
        docenteTutor: practica.docente 
          ? `${practica.docente.usuario.nombre} ${practica.docente.usuario.apellido}`
          : 'No asignado',
        fechaInicio: practica.fechaInicio,
        fechaTermino: practica.fechaTermino,
        estado: practica.estado,
      }));

      // Construir información de filtros aplicados
      const filtrosAplicados: ResumenNominaAlumnos['filtrosAplicados'] = {};
      
      if (filtros.fechaDesde && filtros.fechaHasta) {
        filtrosAplicados.periodo = {
          fechaDesde: filtros.fechaDesde,
          fechaHasta: filtros.fechaHasta,
        };
      }

      if (filtros.sedeId) {
        const sede = await prisma.sede.findUnique({
          where: { id: filtros.sedeId },
          select: { nombre: true },
        });
        filtrosAplicados.sede = sede?.nombre;
      }

      if (filtros.carreraId) {
        const carrera = await prisma.carrera.findUnique({
          where: { id: filtros.carreraId },
          select: { nombre: true },
        });
        filtrosAplicados.carrera = carrera?.nombre;
      }

      if (filtros.estado) {
        const mapeoEstados: Record<string, string> = {
          'EN_CURSO': 'En Curso',
          'FINALIZADA_PENDIENTE_EVAL': 'Finalizada Pendiente Evaluación',
          'EVALUACION_COMPLETA': 'Evaluación Completa',
          'CERRADA': 'Cerrada',
        };
        filtrosAplicados.estado = mapeoEstados[filtros.estado] || filtros.estado;
      }

      const resultado: ResumenNominaAlumnos = {
        totalAlumnos: alumnos.length,
        alumnos,
        filtrosAplicados,
      };

      return { success: true, data: resultado };
    } catch (error) {
      console.error('Error al obtener nómina de alumnos:', error);
      return {
        success: false,
        error: 'Error al obtener la nómina de alumnos.',
      };
    }
  }

  /**
   * Obtiene las opciones disponibles para los filtros
   */
  static async getOpcionesFiltrosNomina(
    usuarioRol: string,
    usuarioSedeId?: number | null
  ): Promise<ApiResponse<OpcionesFiltrosNomina>> {
    try {
      // Verificar permisos
      if (!['DIRECTOR_CARRERA', 'COORDINADOR'].includes(usuarioRol)) {
        return {
          success: false,
          error: 'No tiene permisos para acceder a este reporte.',
        };
      }

      // Filtros de permisos
      const filtroSede = ['DIRECTOR_CARRERA', 'COORDINADOR'].includes(usuarioRol) && usuarioSedeId
        ? { id: usuarioSedeId }
        : {};

      const filtroCarrera = ['DIRECTOR_CARRERA', 'COORDINADOR'].includes(usuarioRol) && usuarioSedeId
        ? { sedeId: usuarioSedeId }
        : {};

      const filtroPermisoPracticas = ['DIRECTOR_CARRERA', 'COORDINADOR'].includes(usuarioRol) && usuarioSedeId
        ? { carrera: { sedeId: usuarioSedeId } }
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
          where: filtroPermisoPracticas,
          _min: {
            fechaInicio: true,
          },
          _max: {
            fechaInicio: true,
          },
        }),
      ]);

      // Estados disponibles para filtrar
      const estados = [
        { valor: 'EN_CURSO', descripcion: 'En Curso' },
        { valor: 'FINALIZADA_PENDIENTE_EVAL', descripcion: 'Finalizada Pendiente Evaluación' },
        { valor: 'EVALUACION_COMPLETA', descripcion: 'Evaluación Completa' },
        { valor: 'CERRADA', descripcion: 'Cerrada' },
      ];

      const resultado: OpcionesFiltrosNomina = {
        sedes,
        carreras,
        estados,
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
    datos: ResumenNominaAlumnos
  ): Promise<string> {
    try {
      const lines: string[] = [];
      
      // Header del archivo
      lines.push('Reporte de Nómina de Alumnos en Práctica');
      lines.push(`Total de alumnos: ${datos.totalAlumnos}`);
      
      // Información de filtros aplicados
      if (datos.filtrosAplicados.periodo) {
        lines.push(`Período: ${datos.filtrosAplicados.periodo.fechaDesde.toLocaleDateString()} - ${datos.filtrosAplicados.periodo.fechaHasta.toLocaleDateString()}`);
      }
      if (datos.filtrosAplicados.sede) {
        lines.push(`Sede: ${datos.filtrosAplicados.sede}`);
      }
      if (datos.filtrosAplicados.carrera) {
        lines.push(`Carrera: ${datos.filtrosAplicados.carrera}`);
      }
      if (datos.filtrosAplicados.estado) {
        lines.push(`Estado: ${datos.filtrosAplicados.estado}`);
      }
      lines.push('');

      // Headers de la tabla
      lines.push('RUT Alumno,Nombre,Apellido,Carrera,Centro Práctica,Jefe Directo,Docente Tutor,Fecha Inicio,Fecha Término,Estado');
      
      // Datos de alumnos
      datos.alumnos.forEach(alumno => {
        const fechaTermino = alumno.fechaTermino 
          ? alumno.fechaTermino.toLocaleDateString()
          : 'En curso';
        
        lines.push(
          `"${alumno.rutAlumno}","${alumno.nombreAlumno}","${alumno.apellidoAlumno}","${alumno.carrera}","${alumno.centroPractica}","${alumno.jefeDirecto}","${alumno.docenteTutor}","${alumno.fechaInicio.toLocaleDateString()}","${fechaTermino}","${alumno.estado}"`
        );
      });

      return lines.join('\n');
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      throw new Error('Error al generar el archivo CSV');
    }
  }
}
