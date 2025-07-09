import { prisma } from '@/lib/prisma';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FiltrosRepositorioInformes {
  sedeId?: number;
  carreraId?: number;
  anioAcademico?: number;
  semestre?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  nombreAlumno?: string;
  rutAlumno?: string;
}

export interface InformeHistorico {
  id: number;
  alumno: {
    usuario: {
      nombre: string;
      apellido: string;
      rut: string;
    };
  };
  carrera: {
    id: number;
    nombre: string;
    sede: {
      id: number;
      nombre: string;
    };
  };
  docente: {
    usuario: {
      nombre: string;
      apellido: string;
    };
  };
  informeUrl: string;
  fechaSubidaInforme: Date | null;
  fechaTermino: Date;
  tipo: string;
  evaluacionDocente?: {
    nota: number;
    fecha: Date;
  } | null;
}

export interface RepositorioInformesResponse {
  informes: InformeHistorico[];
  total: number;
  totalPaginas: number;
  paginaActual: number;
}

export class RepositorioInformesService {
  /**
   * Obtiene informes históricos con filtros de búsqueda y paginación
   * Respeta los permisos por sede/carrera del usuario
   */
  static async getInformesHistoricos(
    filtros: FiltrosRepositorioInformes,
    usuarioSedeId?: number | null,
    pagina: number = 1,
    limite: number = 20
  ): Promise<ApiResponse<RepositorioInformesResponse>> {
    try {
      // Construir filtros de consulta
      const where: {
        informeUrl: { not: null };
        carrera?: {
          sedeId?: number;
        };
        carreraId?: number;
        fechaTermino?: {
          gte?: Date;
          lt?: Date;
          lte?: Date;
        };
        alumno?: {
          usuario?: {
            OR?: Array<{
              nombre?: { contains: string; mode: 'insensitive' };
              apellido?: { contains: string; mode: 'insensitive' };
            }>;
            rut?: { contains: string; mode: 'insensitive' };
          };
        };
      } = {
        informeUrl: {
          not: null, // Solo prácticas con informe subido
        },
      };

      // Aplicar filtros por permisos de usuario (HU-54)
      if (usuarioSedeId) {
        where.carrera = {
          sedeId: usuarioSedeId,
        };
      }

      // Aplicar filtros específicos
      if (filtros.sedeId) {
        where.carrera = {
          ...(where.carrera || {}),
          sedeId: filtros.sedeId,
        };
      }

      if (filtros.carreraId) {
        where.carreraId = filtros.carreraId;
      }

      // Filtros por fecha de término (aproximación a año académico/semestre)
      if (filtros.anioAcademico || filtros.semestre) {
        const fechaFiltros: { gte?: Date; lt?: Date } = {};
        
        if (filtros.anioAcademico) {
          const inicioAnio = new Date(filtros.anioAcademico, 0, 1);
          const finAnio = new Date(filtros.anioAcademico + 1, 0, 1);
          fechaFiltros.gte = inicioAnio;
          fechaFiltros.lt = finAnio;
        }

        // Si hay semestre específico, ajustar las fechas
        if (filtros.semestre && filtros.anioAcademico) {
          if (filtros.semestre === '1') {
            // Primer semestre: Marzo - Julio
            fechaFiltros.gte = new Date(filtros.anioAcademico, 2, 1);
            fechaFiltros.lt = new Date(filtros.anioAcademico, 7, 1);
          } else if (filtros.semestre === '2') {
            // Segundo semestre: Agosto - Diciembre
            fechaFiltros.gte = new Date(filtros.anioAcademico, 7, 1);
            fechaFiltros.lt = new Date(filtros.anioAcademico + 1, 0, 1);
          }
        }

        where.fechaTermino = fechaFiltros;
      }

      // Filtros por rango de fechas personalizado
      if (filtros.fechaDesde || filtros.fechaHasta) {
        const fechaFiltros: { gte?: Date; lte?: Date } = {};
        if (filtros.fechaDesde) {
          fechaFiltros.gte = filtros.fechaDesde;
        }
        if (filtros.fechaHasta) {
          fechaFiltros.lte = filtros.fechaHasta;
        }
        where.fechaTermino = { ...(where.fechaTermino || {}), ...fechaFiltros };
      }

      // Filtros por alumno
      if (filtros.nombreAlumno || filtros.rutAlumno) {
        const alumnoFiltros: {
          usuario?: {
            OR?: Array<{
              nombre?: { contains: string; mode: 'insensitive' };
              apellido?: { contains: string; mode: 'insensitive' };
            }>;
            rut?: { contains: string; mode: 'insensitive' };
          };
        } = {};
        
        if (filtros.nombreAlumno) {
          alumnoFiltros.usuario = {
            OR: [
              {
                nombre: {
                  contains: filtros.nombreAlumno,
                  mode: 'insensitive',
                },
              },
              {
                apellido: {
                  contains: filtros.nombreAlumno,
                  mode: 'insensitive',
                },
              },
            ],
          };
        }

        if (filtros.rutAlumno) {
          alumnoFiltros.usuario = {
            ...(alumnoFiltros.usuario || {}),
            rut: {
              contains: filtros.rutAlumno,
              mode: 'insensitive',
            },
          };
        }

        where.alumno = alumnoFiltros;
      }

      // Calcular offset para paginación
      const offset = (pagina - 1) * limite;

      // Ejecutar consulta con paginación
      const [informes, total] = await Promise.all([
        prisma.practica.findMany({
          where,
          include: {
            alumno: {
              include: {
                usuario: {
                  select: {
                    nombre: true,
                    apellido: true,
                    rut: true,
                  },
                },
              },
            },
            carrera: {
              include: {
                sede: {
                  select: {
                    id: true,
                    nombre: true,
                  },
                },
              },
            },
            docente: {
              include: {
                usuario: {
                  select: {
                    nombre: true,
                    apellido: true,
                  },
                },
              },
            },
            evaluacionDocente: {
              select: {
                nota: true,
                fecha: true,
              },
            },
          },
          orderBy: {
            fechaTermino: 'desc',
          },
          skip: offset,
          take: limite,
        }),
        prisma.practica.count({ where }),
      ]);

      const totalPaginas = Math.ceil(total / limite);

      const result: RepositorioInformesResponse = {
        informes: informes.map((practica) => ({
          id: practica.id,
          alumno: practica.alumno,
          carrera: practica.carrera,
          docente: practica.docente,
          informeUrl: practica.informeUrl!,
          fechaSubidaInforme: practica.updatedAt, // Aproximación - podríamos agregar campo específico
          fechaTermino: practica.fechaTermino,
          tipo: practica.tipo,
          evaluacionDocente: practica.evaluacionDocente,
        })),
        total,
        totalPaginas,
        paginaActual: pagina,
      };

      return { success: true, data: result };
    } catch (error) {
      console.error('Error al obtener informes históricos:', error);
      return {
        success: false,
        error: 'Error al obtener el repositorio de informes históricos.',
      };
    }
  }

  /**
   * Obtiene las opciones disponibles para filtros (sedes, carreras, años)
   */
  static async getOpcionesFiltros(usuarioSedeId?: number | null): Promise<ApiResponse<{
    sedes: Array<{ id: number; nombre: string }>;
    carreras: Array<{ id: number; nombre: string; sedeId: number }>;
    aniosDisponibles: number[];
  }>> {
    try {
      // Construir filtros por permisos
      const filtroSede = usuarioSedeId ? { id: usuarioSedeId } : {};
      
      const [sedes, carreras, practicasConFechas] = await Promise.all([
        // Obtener sedes (filtradas por permisos)
        prisma.sede.findMany({
          where: filtroSede,
          select: {
            id: true,
            nombre: true,
          },
          orderBy: { nombre: 'asc' },
        }),

        // Obtener carreras (filtradas por permisos)
        prisma.carrera.findMany({
          where: usuarioSedeId ? { sedeId: usuarioSedeId } : {},
          select: {
            id: true,
            nombre: true,
            sedeId: true,
          },
          orderBy: { nombre: 'asc' },
        }),

        // Obtener años disponibles basados en prácticas con informes
        prisma.practica.findMany({
          where: {
            informeUrl: { not: null },
            ...(usuarioSedeId && {
              carrera: { sedeId: usuarioSedeId },
            }),
          },
          select: {
            fechaTermino: true,
          },
        }),
      ]);

      // Extraer años únicos de las fechas de término
      const aniosSet = new Set<number>();
      practicasConFechas.forEach((practica) => {
        aniosSet.add(practica.fechaTermino.getFullYear());
      });

      const aniosDisponibles = Array.from(aniosSet).sort((a, b) => b - a);

      return {
        success: true,
        data: {
          sedes,
          carreras,
          aniosDisponibles,
        },
      };
    } catch (error) {
      console.error('Error al obtener opciones de filtros:', error);
      return {
        success: false,
        error: 'Error al obtener las opciones de filtros.',
      };
    }
  }
}
