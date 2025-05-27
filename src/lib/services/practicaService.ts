import prisma from '@/lib/prisma';
import type { IniciarPracticaInput } from '@/lib/validators/practica';
import { 
    TipoPractica as PrismaTipoPracticaEnum, 
    EstadoPractica as PrismaEstadoPracticaEnum,
    Prisma 
} from '@prisma/client';

const HORAS_POR_DIA_LABORAL = 8; // Asunción: 8 horas por día laboral

/**
 * Calcula una fecha de término sugerida basada en la fecha de inicio y horas de práctica.
 * Cuenta solo días de Lunes a Viernes.
 * @param fechaInicio La fecha de inicio de la práctica.
 * @param horasPracticaRequeridas El total de horas que debe cumplir el alumno.
 * @returns La fecha de término calculada.
 * @throws Error si las horas de práctica son 0 o negativas.
 */
export function calculateFechaTerminoSugerida(fechaInicio: Date, horasPracticaRequeridas: number): Date {
  if (horasPracticaRequeridas <= 0) {
    throw new Error("Las horas de práctica requeridas deben ser un número positivo.");
  }

  let diasLaboralesNecesarios = Math.ceil(horasPracticaRequeridas / HORAS_POR_DIA_LABORAL);
  const fechaTermino = new Date(fechaInicio.valueOf());
  let diasAgregados = 0;

  // Si el día de inicio es fin de semana, lo movemos al siguiente lunes (o al mismo día si es laboral)
  // para asegurar que el conteo empiece en un día laboral o el cálculo sea correcto.
  // Asumimos que el coordinador elige una fecha de inicio laboral, o el cálculo es "bruto".
  // Para un cálculo más preciso, se necesitaría una librería de manejo de fechas laborales.

  // Si el primer día es laboral y se cuentan las horas de ese día:
  const diaInicioSemana = fechaInicio.getDay();
  if (diaInicioSemana !== 0 && diaInicioSemana !== 6) { // Si el día de inicio es laboral
      diasLaboralesNecesarios--; // Ya cuenta como un día trabajado
  }


  while (diasAgregados < diasLaboralesNecesarios) {
    fechaTermino.setDate(fechaTermino.getDate() + 1);
    const diaDeLaSemana = fechaTermino.getDay();
    if (diaDeLaSemana !== 0 && diaDeLaSemana !== 6) { // No es Domingo ni Sábado
      diasAgregados++;
    }
  }
  return fechaTermino;
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
  ) {
    try {
      const carrera = await prisma.carrera.findUnique({
        where: { id: carreraId },
      });

      if (!carrera) {
        return { success: false, error: 'Carrera no encontrada para calcular horas.' };
      }

      let horasRequeridas: number;
      if (tipoPractica === PrismaTipoPracticaEnum.LABORAL) {
        horasRequeridas = carrera.horasPracticaLaboral;
      } else if (tipoPractica === PrismaTipoPracticaEnum.PROFESIONAL) {
        horasRequeridas = carrera.horasPracticaProfesional;
      } else {
        return { success: false, error: 'Tipo de práctica inválido.' };
      }

      if (horasRequeridas <= 0) {
        return { 
          success: false, 
          error: `La carrera "${carrera.nombre}" no tiene horas configuradas para la práctica ${tipoPractica.toLowerCase()}.` 
        };
      }

      const fechaTerminoSugerida = calculateFechaTerminoSugerida(fechaInicio, horasRequeridas);
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