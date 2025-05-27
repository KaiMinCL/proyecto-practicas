import prisma from '@/lib/prisma';
import type { IniciarPracticaInput } from '@/lib/validators/practica';
import { 
    TipoPractica as PrismaTipoPracticaEnum, 
    EstadoPractica as PrismaEstadoPracticaEnum,
    Prisma 
} from '@prisma/client';
import { isHoliday } from './holidayService';


const HORAS_POR_DIA_LABORAL = 8; // Asunción: 8 horas por día laboral

/**
 * Calcula una fecha de término sugerida basada en la fecha de inicio y horas de práctica.
 * Cuenta solo días de Lunes a Viernes.
 * @param fechaInicio La fecha de inicio de la práctica.
 * @param horasPracticaRequeridas El total de horas que debe cumplir el alumno.
 * @returns La fecha de término calculada.
 * @throws Error si las horas de práctica son 0 o negativas.
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
    
    if (diaDeLaSemana !== 0 && diaDeLaSemana !== 6 && !(await isHoliday(fechaActual))) { // <--- await isHoliday
      diasLaboralesContados++;
    }
    
    if (diasLaboralesContados < diasLaboralesNecesarios) {
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    iteracionesSeguridad++;
  }

  if (iteracionesSeguridad >= MAX_ITERACIONES) {
      console.warn("Cálculo de fecha de término excedió iteraciones de seguridad.");
      throw new Error("No se pudo calcular una fecha de término dentro de un rango razonable (posiblemente demasiados feriados o error en API).");
  }

  return fechaActual;
}

export class PracticaService {

  /**
   * Sugiere una fecha de término para una práctica.
   * @param fechaInicio La fecha de inicio propuesta.
   * @param tipoPractica El tipo de práctica (LABORAL o PROFESIONAL).
   * @param carreraId El ID de la carrera para obtener las horas requeridas.
   */
   static async sugerirFechaTermino(
    fechaInicio: Date,
    tipoPractica: PrismaTipoPracticaEnum,
    carreraId: number
  ): Promise<{ success: boolean; data?: Date; error?: string }> {
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
          error: `La carrera "${carrera.nombre}" no tiene horas configuradas para la práctica ${tipoPractica.toLowerCase()}.` 
        };
      }

      const fechaTerminoSugerida = await calculateFechaTerminoSugerida(fechaInicio, horasRequeridas);
      return { success: true, data: fechaTerminoSugerida };

    } catch (error) {
      console.error('Error al sugerir fecha de término:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error al sugerir fecha de término.' };
    }
  }

  /**
   * Inicia el registro de una práctica (Parte del Coordinador).
   * @param input Datos del formulario del coordinador, incluyendo la fechaTermino final.
   * @param alumnoObtenido El objeto Alumno completo (incluyendo carreraId) para evitar otra consulta.
   */
  static async iniciarPracticaCoordinador(
    input: IniciarPracticaInput,
    alumnoCarreraId: number,
  ) {
    try {
      // Validaciones de existencia (opcional, Prisma lo haría pero con errores menos amigables)
      const alumno = await prisma.alumno.findUnique({ where: { id: input.alumnoId } });
      if (!alumno || alumno.carreraId !== alumnoCarreraId) {
        return { success: false, error: 'Alumno no válido o no pertenece a la carrera indicada.' };
      }
      const docente = await prisma.docente.findUnique({ where: { id: input.docenteId } });
      if (!docente) {
        return { success: false, error: 'Docente tutor no encontrado.' };
      }
      
      // Asegurarse que la fecha de término no sea anterior a la de inicio
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
        }
      });

      return { success: true, data: nuevaPractica };
    } catch (error) {
      console.error('Error al iniciar práctica (servicio):', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          type PrismaFieldError = { field_name: string };
          const fieldName = (error.meta as PrismaFieldError)?.field_name || 'desconocido';
          return { success: false, error: `Error de referencia: El campo '${fieldName}' apunta a un registro inexistente.` };
        }
      }
      return { success: false, error: 'No se pudo iniciar el registro de la práctica.' };
    }
  }
}