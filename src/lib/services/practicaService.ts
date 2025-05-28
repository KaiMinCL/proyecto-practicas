import prisma from '@/lib/prisma';
import { 
    Prisma, 
    EstadoPractica as PrismaEstadoPracticaEnum,
    TipoPractica as PrismaTipoPracticaEnum
} from '@prisma/client';
import { 
    type IniciarPracticaInput, 
    type CompletarActaAlumnoData 
} from '@/lib/validators/practica'; 
import { isHoliday } from './holidayService';

const HORAS_POR_DIA_LABORAL = 8;

/**
 * Calcula una fecha de término sugerida basada en la fecha de inicio y horas de práctica.
 * Cuenta solo días de Lunes a Viernes y excluye feriados.
 */
export async function calculateFechaTerminoSugerida(
  fechaInicio: Date,
  horasPracticaRequeridas: number
): Promise<Date> {
  if (horasPracticaRequeridas <= 0) {
    throw new Error("Las horas de práctica requeridas deben ser un número positivo.");
  }

  const diasLaboralesNecesarios = Math.ceil(horasPracticaRequeridas / HORAS_POR_DIA_LABORAL);
  const fechaActual = new Date(fechaInicio.valueOf());
  let diasLaboralesContados = 0;
  let iteracionesSeguridad = 0;
  const MAX_ITERACIONES = diasLaboralesNecesarios + 365 * 2; // Margen para feriados en 2 años

  while (diasLaboralesContados < diasLaboralesNecesarios && iteracionesSeguridad < MAX_ITERACIONES) {
    const diaDeLaSemana = fechaActual.getDay();
    if (diaDeLaSemana !== 0 && diaDeLaSemana !== 6 && !(await isHoliday(fechaActual))) {
      diasLaboralesContados++;
    }
    if (diasLaboralesContados < diasLaboralesNecesarios) {
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    iteracionesSeguridad++;
  }

  if (iteracionesSeguridad >= MAX_ITERACIONES) {
    console.warn("Cálculo de fecha de término excedió iteraciones de seguridad.");
    throw new Error("No se pudo calcular una fecha de término dentro de un rango razonable.");
  }
  return fechaActual;
}

export class PracticaService {
  /**
   * Sugiere una fecha de término para una práctica.
   */
  static async sugerirFechaTermino(
    fechaInicio: Date,
    tipoPractica: PrismaTipoPracticaEnum,
    carreraId: number
  ): Promise<{ success: boolean; data?: Date; error?: string; message?: string }> {
    try {
      const carrera = await prisma.carrera.findUnique({
        where: { id: carreraId },
      });

      if (!carrera) {
        return { success: false, error: 'Carrera no encontrada para calcular horas.' };
      }

      const horasRequeridas = tipoPractica === PrismaTipoPracticaEnum.LABORAL 
        ? carrera.horasPracticaLaboral 
        : carrera.horasPracticaProfesional;

      if (horasRequeridas <= 0) {
        return { 
          success: false, 
          error: `La carrera "${carrera.nombre}" no tiene horas configuradas para la práctica de tipo ${tipoPractica.toLowerCase()}.` 
        };
      }
      
      const fechaTerminoSugerida = await calculateFechaTerminoSugerida(fechaInicio, horasRequeridas);
      return { success: true, data: fechaTerminoSugerida };

    } catch (error) {
      console.error('Error al sugerir fecha de término:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al sugerir fecha de término.';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Inicia el registro de una práctica (Parte del Coordinador).
   */
  static async iniciarPracticaCoordinador(
    input: IniciarPracticaInput,
    alumnoCarreraId: number,
  ) {
    try {
      const alumno = await prisma.alumno.findUnique({ 
        where: { id: input.alumnoId },
        select: { id: true, carreraId: true } // Seleccionar carreraId para verificar
      });
      if (!alumno || alumno.carreraId !== alumnoCarreraId) {
        return { success: false, error: 'Alumno no válido o la carrera no coincide con la del alumno seleccionado.' };
      }
      const docente = await prisma.docente.findUnique({ where: { id: input.docenteId } });
      if (!docente) {
        return { success: false, error: 'Docente tutor no encontrado.' };
      }
      
      if (input.fechaTermino < input.fechaInicio) {
        return { success: false, error: 'La fecha de término no puede ser anterior a la fecha de inicio.' };
      }

      const nuevaPractica = await prisma.practica.create({
        data: {
          alumnoId: input.alumnoId,
          docenteId: input.docenteId,
          carreraId: alumnoCarreraId,
          tipo: input.tipoPractica,
          fechaInicio: input.fechaInicio,
          fechaTermino: input.fechaTermino,
          estado: PrismaEstadoPracticaEnum.PENDIENTE,
        },
        include: { 
          alumno: { include: { usuario: { select: { nombre: true, apellido: true, rut: true }}, carrera: { select: {id:true, nombre: true, sede: {select: {nombre: true}}}}} },
          docente: { include: { usuario: { select: { nombre: true, apellido: true }} } },
          carrera: { select: { nombre: true } },
        }
      });
      return { success: true, data: nuevaPractica };
    } catch (error) {
      console.error('Error al iniciar práctica (servicio):', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          const fieldName = error.meta?.field_name || 'campo desconocido';
          return { success: false, error: `Error de referencia: El campo '${fieldName}' apunta a un registro inexistente.` };
        }
      }
      return { success: false, error: 'No se pudo iniciar el registro de la práctica.' };
    }
  }

  /**
   * Obtiene los detalles de una práctica para que el alumno la complete.
   * Incluye datos pre-llenados por el coordinador y verifica el estado y propiedad.
   */
  static async getPracticaParaCompletarAlumno(practicaId: number, alumnoUsuarioId: number) {
    try {
      const alumno = await prisma.alumno.findUnique({
        where: { usuarioId: alumnoUsuarioId },
        select: { id: true }
      });

      if (!alumno) {
          return { success: false, error: "Perfil de alumno no encontrado." };
      }

      const practica = await prisma.practica.findUnique({
        where: { id: practicaId },
        include: {
          alumno: { include: { usuario: true, carrera: { include: { sede: true } } } },
          carrera: { include: { sede: true } },
          docente: { include: { usuario: true } },
        },
      });

      if (!practica) {
        return { success: false, error: 'Práctica no encontrada.' };
      }

      if (practica.alumnoId !== alumno.id) {
        return { success: false, error: 'No tienes permiso para acceder a esta práctica.' };
      }

      if (practica.estado !== PrismaEstadoPracticaEnum.PENDIENTE) {
        return { success: false, error: `Esta práctica ya no está en estado pendiente para completar. Estado actual: ${practica.estado}` };
      }
      
      const hoy = new Date();
      const fechaInicioPractica = new Date(practica.fechaInicio);
      const plazoDias = 5; 
      const fechaLimite = new Date(fechaInicioPractica);
      fechaLimite.setDate(fechaInicioPractica.getDate() + plazoDias); 

      const hoySoloFecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const fechaLimiteSoloFecha = new Date(fechaLimite.getFullYear(), fechaLimite.getMonth(), fechaLimite.getDate());

      let fueraDePlazo = false;
      if (hoySoloFecha > fechaLimiteSoloFecha) {
          fueraDePlazo = true;
      }
      
      return { success: true, data: { ...practica, fueraDePlazo } };

    } catch (error) {
        console.error("Error en getPracticaParaCompletarAlumno:", error);
        return { success: false, error: "Error al obtener los detalles de la práctica." };
    }
  }

  /**
   * Permite a un alumno completar su parte del Acta 1.
   * Valida el plazo, actualiza la práctica y cambia su estado.
   */
  static async completarActaAlumno(
    practicaId: number,
    alumnoUsuarioId: number, 
    data: CompletarActaAlumnoData
  ) {
    try {
      const alumno = await prisma.alumno.findUnique({
          where: { usuarioId: alumnoUsuarioId },
          select: { id: true }
      });
      if (!alumno) {
          return { success: false, error: "Perfil de alumno no encontrado." };
      }

      const practica = await prisma.practica.findUnique({
        where: { id: practicaId },
      });

      if (!practica) {
        return { success: false, error: 'Práctica no encontrada.' };
      }
      if (practica.alumnoId !== alumno.id) {
        return { success: false, error: 'No tienes permiso para modificar esta práctica.' };
      }
      if (practica.estado !== PrismaEstadoPracticaEnum.PENDIENTE) {
        return { success: false, error: `Esta práctica no puede ser completada. Estado actual: ${practica.estado}` };
      }

      const fechaInicioPractica = new Date(practica.fechaInicio);
      const hoy = new Date();
      const plazoDias = 5;
      const fechaLimite = new Date(fechaInicioPractica);
      fechaLimite.setDate(fechaInicioPractica.getDate() + plazoDias);
      
      const hoySoloFecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const fechaLimiteSoloFecha = new Date(fechaLimite.getFullYear(), fechaLimite.getMonth(), fechaLimite.getDate());

      if (hoySoloFecha > fechaLimiteSoloFecha) {
        return { success: false, error: `El plazo para completar el Acta 1 ha vencido (${plazoDias} días desde el inicio). Contacta a tu coordinador.` };
      }

      const updatedPractica = await prisma.practica.update({
        where: { id: practicaId },
        data: {
          direccionCentro: data.direccionCentro,
          departamento: data.departamento,
          nombreJefeDirecto: data.nombreJefeDirecto,
          cargoJefeDirecto: data.cargoJefeDirecto,
          contactoCorreoJefe: data.contactoCorreoJefe,
          contactoTelefonoJefe: data.contactoTelefonoJefe,
          practicaDistancia: data.practicaDistancia,
          tareasPrincipales: data.tareasPrincipales,
          estado: PrismaEstadoPracticaEnum.PENDIENTE_ACEPTACION_DOCENTE,
          fechaCompletadoAlumno: new Date(),
        },
        include: { 
            alumno: { include: { usuario: true, carrera: {include: {sede: true}} } },
            docente: { include: { usuario: true } },
        }
      });
      return { success: true, data: updatedPractica };
    } catch (error) {
      console.error("Error al actualizar práctica (completar acta alumno):", error);
      return { success: false, error: 'No se pudo guardar la información del acta.' };
    }
  }

  /**
   * Obtiene las prácticas de un alumno específico, opcionalmente filtradas por estado.
   */
  static async getPracticasPorAlumno(alumnoId: number, estado?: PrismaEstadoPracticaEnum) {
    try {
      const practicas = await prisma.practica.findMany({
        where: {
          alumnoId: alumnoId,
          estado: estado,
        },
        include: {
          carrera: { select: { id: true, nombre: true, sede: { select: { id: true, nombre: true } } } }, 
          docente: { include: { usuario: { select: { id:true, nombre: true, apellido: true } } } },
          alumno: { include: { usuario: { select: { id:true, rut:true, nombre: true, apellido: true }}}},
          centroPractica: { select: { nombreEmpresa: true } } 
        },
        orderBy: {
          fechaInicio: 'desc',
        },
      });
      return { success: true, data: practicas };
    } catch (error) {
      console.error(`Error al obtener prácticas para el alumno ${alumnoId}:`, error);
      return { success: false, error: 'Error al obtener las prácticas del alumno.' };
    }
  }
}