import { prisma } from '@/lib/prisma';
import { EstadoPractica, TipoPractica, Prisma } from '@prisma/client';
import { UserJwtPayload } from '@/lib/auth-utils';

export interface FiltrosPracticas {
  estados?: EstadoPractica[];
  fechaInicio?: Date;
  fechaFin?: Date;
  carreraId?: number;
  sedeId?: number;
  tipo?: TipoPractica;
  alumnoRut?: string;
  nombreAlumno?: string;
}

export interface PracticaHistorial {
  id: number;
  alumno: {
    usuario: {
      rut: string;
      nombre: string;
      apellido: string;
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
  };
  tipo: TipoPractica;
  fechaInicio: Date;
  fechaTermino: Date;
  estado: EstadoPractica;
  creadoEn: Date;
  actaFinal?: {
    notaFinal: number;
    fechaCierre: Date;
  };
}

export interface PaginacionResultado {
  data: PracticaHistorial[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export class ActasRepositorioService {
  
  /**
   * Construye las condiciones WHERE para la consulta de prácticas
   * considerando los permisos del usuario
   */
  private static buildWhereConditions(
    filtros: FiltrosPracticas,
    usuario: UserJwtPayload
  ): Prisma.PracticaWhereInput {
    const where: Prisma.PracticaWhereInput = {};
    
    // Aplicar filtros de permisos según el rol del usuario
    if (usuario.rol === 'COORDINADOR' || usuario.rol === 'DIRECTOR_CARRERA') {
      // Los coordinadores y directores solo ven prácticas de su sede
      where.carrera = {
        sedeId: usuario.sedeId || undefined
      };
    }
    
    // Filtro por estados
    if (filtros.estados && filtros.estados.length > 0) {
      where.estado = {
        in: filtros.estados
      };
    }
    
    // Filtro por rango de fechas
    if (filtros.fechaInicio || filtros.fechaFin) {
      where.fechaInicio = {};
      if (filtros.fechaInicio) {
        where.fechaInicio.gte = filtros.fechaInicio;
      }
      if (filtros.fechaFin) {
        where.fechaInicio.lte = filtros.fechaFin;
      }
    }
    
    // Filtro por carrera
    if (filtros.carreraId) {
      where.carreraId = filtros.carreraId;
    }
    
    // Filtro por sede (solo para super admin)
    if (filtros.sedeId && usuario.rol === 'SUPER_ADMIN') {
      where.carrera = {
        sedeId: filtros.sedeId
      };
    }
    
    // Filtro por tipo de práctica
    if (filtros.tipo) {
      where.tipo = filtros.tipo;
    }
    
    // Filtro por RUT del alumno
    if (filtros.alumnoRut) {
      where.alumno = {
        usuario: {
          rut: {
            contains: filtros.alumnoRut,
            mode: 'insensitive'
          }
        }
      };
    }
    
    // Filtro por nombre del alumno
    if (filtros.nombreAlumno) {
      where.alumno = {
        usuario: {
          OR: [
            {
              nombre: {
                contains: filtros.nombreAlumno,
                mode: 'insensitive'
              }
            },
            {
              apellido: {
                contains: filtros.nombreAlumno,
                mode: 'insensitive'
              }
            }
          ]
        }
      };
    }
    
    return where;
  }
  
  /**
   * Obtiene el histórico de prácticas con filtros y paginación
   */
  static async obtenerHistorialPracticas(
    filtros: FiltrosPracticas,
    usuario: UserJwtPayload,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginacionResultado> {
    const skip = (page - 1) * limit;
    
    const where = this.buildWhereConditions(filtros, usuario);
    
    const [practicas, totalCount] = await Promise.all([
      prisma.practica.findMany({
        where,
        include: {
          alumno: {
            include: {
              usuario: true,
              carrera: {
                include: {
                  sede: true
                }
              }
            }
          },
          docente: {
            include: {
              usuario: true
            }
          },
          centroPractica: true,
          actaFinal: true
        },
        orderBy: [
          { creadoEn: 'desc' },
          { fechaInicio: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.practica.count({ where })
    ]);
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      data: practicas as PracticaHistorial[],
      totalItems: totalCount,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }
  
  /**
   * Obtiene estadísticas del histórico de prácticas
   */
  static async obtenerEstadisticasPracticas(
    filtros: FiltrosPracticas,
    usuario: UserJwtPayload
  ) {
    const where = this.buildWhereConditions(filtros, usuario);
    
    // Estadísticas por estado
    const estadisticasPorEstado = await prisma.practica.groupBy({
      by: ['estado'],
      where,
      _count: {
        id: true
      }
    });
    
    // Estadísticas por tipo
    const estadisticasPorTipo = await prisma.practica.groupBy({
      by: ['tipo'],
      where,
      _count: {
        id: true
      }
    });
    
    // Estadísticas por carrera
    const estadisticasPorCarrera = await prisma.practica.groupBy({
      by: ['carreraId'],
      where,
      _count: {
        id: true
      }
    });
    
    // Obtener nombres de carreras
    const carreraIds = estadisticasPorCarrera.map(e => e.carreraId);
    const carreras = await prisma.carrera.findMany({
      where: {
        id: {
          in: carreraIds
        }
      },
      select: {
        id: true,
        nombre: true
      }
    });
    
    const estadisticasCarreraConNombres = estadisticasPorCarrera.map(stat => ({
      carrera: carreras.find(c => c.id === stat.carreraId)?.nombre || 'Sin carrera',
      count: stat._count.id
    }));
    
    return {
      porEstado: estadisticasPorEstado.map(e => ({
        estado: e.estado,
        count: e._count.id
      })),
      porTipo: estadisticasPorTipo.map(e => ({
        tipo: e.tipo,
        count: e._count.id
      })),
      porCarrera: estadisticasCarreraConNombres
    };
  }
  
  /**
   * Obtiene las carreras disponibles para el usuario
   */
  static async obtenerCarrerasDisponibles(usuario: UserJwtPayload) {
    const where: Prisma.CarreraWhereInput = {
      estado: 'ACTIVO'
    };
    
    // Filtrar por sede si no es super admin
    if (usuario.rol !== 'SUPER_ADMIN') {
      where.sedeId = usuario.sedeId || undefined;
    }
    
    return await prisma.carrera.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        sede: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: [
        { sede: { nombre: 'asc' } },
        { nombre: 'asc' }
      ]
    });
  }
  
  /**
   * Obtiene las sedes disponibles (solo para super admin)
   */
  static async obtenerSedesDisponibles() {
    return await prisma.sede.findMany({
      where: {
        estado: 'ACTIVO'
      },
      select: {
        id: true,
        nombre: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });
  }
  
  /**
   * Exporta el histórico de prácticas a CSV
   */
  static async exportarHistorialCSV(
    filtros: FiltrosPracticas,
    usuario: UserJwtPayload
  ): Promise<string> {
    const where = this.buildWhereConditions(filtros, usuario);
    
    const practicas = await prisma.practica.findMany({
      where,
      include: {
        alumno: {
          include: {
            usuario: true,
            carrera: {
              include: {
                sede: true
              }
            }
          }
        },
        docente: {
          include: {
            usuario: true
          }
        },
        centroPractica: true,
        actaFinal: true
      },
      orderBy: [
        { creadoEn: 'desc' },
        { fechaInicio: 'desc' }
      ]
    });
    
    // Crear CSV
    const headers = [
      'RUT Alumno',
      'Nombre Alumno',
      'Carrera',
      'Sede',
      'Tipo Práctica',
      'Fecha Inicio',
      'Fecha Término',
      'Estado',
      'Docente Tutor',
      'Centro Práctica',
      'Nota Final',
      'Fecha Creación'
    ];
    
    const rows = practicas.map(p => [
      p.alumno.usuario.rut,
      `${p.alumno.usuario.nombre} ${p.alumno.usuario.apellido}`,
      p.alumno.carrera.nombre,
      p.alumno.carrera.sede.nombre,
      p.tipo,
      p.fechaInicio.toLocaleDateString(),
      p.fechaTermino.toLocaleDateString(),
      p.estado,
      `${p.docente.usuario.nombre} ${p.docente.usuario.apellido}`,
      p.centroPractica?.nombreEmpresa || 'Sin centro',
      p.actaFinal?.notaFinal?.toString() || 'Sin nota',
      p.creadoEn.toLocaleDateString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');
    
    return csvContent;
  }
}
