import prisma from '@/lib/prisma';
import { 
    type IniciarPracticaInput, 
    type CompletarActaAlumnoData, 
    type EditarPracticaCoordDCInput,
    DecisionDocenteActaData
} from '@/lib/validators/practica';
import { isHoliday } from './holidayService';
import { EmailService } from '@/lib/email';
import { AuditoriaService } from '@/lib/services/auditoria';
import { AlertasPracticasService } from './alertasPracticasService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const HORAS_POR_DIA_LABORAL = 8;

export class PracticaService {

  /**
   * Calcula una fecha de término sugerida basada en la fecha de inicio y horas de práctica.
   * Cuenta solo días de Lunes a Viernes y excluye feriados.
   */
  static async calculateFechaTerminoSugerida(
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

  /**
   * Sugiere una fecha de término para una práctica.
   */
  static async sugerirFechaTermino(
    fechaInicio: Date,
    tipoPractica: string,
    carreraId: number
  ): Promise<{ success: boolean; data?: Date; error?: string; message?: string }> {
    try {
      const carrera = await prisma.carrera.findUnique({
        where: { id: carreraId },
      });

      if (!carrera) {
        return { success: false, error: 'Carrera no encontrada para calcular horas.' };
      }

      const horasRequeridas = tipoPractica === 'LABORAL' 
        ? carrera.horasPracticaLaboral 
        : carrera.horasPracticaProfesional;

      if (horasRequeridas <= 0) {
        return { 
          success: false, 
          error: `La carrera "${carrera.nombre}" no tiene horas configuradas para la práctica ${tipoPractica.toLowerCase()}.` 
        };
      }
      
      // Llama al método estático de la clase
      const fechaTerminoSugerida = await PracticaService.calculateFechaTerminoSugerida(fechaInicio, horasRequeridas);
      return { success: true, data: fechaTerminoSugerida };

    } catch (error) {
      console.error('Error al sugerir fecha de término:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error al sugerir fecha de término.' };
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
          estado: 'PENDIENTE',
        },
        include: { 
          alumno: { include: { usuario: { select: { nombre: true, apellido: true, rut: true }}}},
          docente: { include: { usuario: { select: { nombre: true, apellido: true }} } },
          carrera: { select: { id: true, nombre: true, sede: {select: {id: true, nombre: true}}} },
        }
      });
      return { success: true, data: nuevaPractica };
    } catch (error: unknown) {
      console.error('Error al iniciar práctica (servicio):', error);
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
        const fieldName = ('meta' in error && error.meta && typeof error.meta === 'object' && 'field_name' in error.meta) 
          ? error.meta.field_name || 'campo desconocido'
          : 'campo desconocido';
        return { success: false, error: `Error de referencia: El campo '${fieldName}' apunta a un registro inexistente.` };
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

      if (practica.estado !== 'PENDIENTE') {
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
      if (practica.estado !== 'PENDIENTE') {
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
          estado: 'PENDIENTE_ACEPTACION_DOCENTE',
          fechaCompletadoAlumno: new Date(),
        },
        include: { 
            alumno: { include: { usuario: true, carrera: {include: {sede: true}} } },
            docente: { include: { usuario: true } },
            centroPractica: true,
        }
      });

      // Enviar notificación por email al docente
      try {
        if (updatedPractica.docente?.usuario?.email) {
          const emailData = {
            docenteEmail: updatedPractica.docente.usuario.email,
            docenteNombre: updatedPractica.docente.usuario.nombre,
            docenteApellido: updatedPractica.docente.usuario.apellido,
            alumnoNombre: updatedPractica.alumno.usuario.nombre,
            alumnoApellido: updatedPractica.alumno.usuario.apellido,
            alumnoRut: updatedPractica.alumno.usuario.rut,
            carreraNombre: updatedPractica.alumno.carrera.nombre,
            sedeNombre: updatedPractica.alumno.carrera.sede?.nombre || 'Sede no especificada',
            fechaInicio: format(new Date(updatedPractica.fechaInicio), 'dd/MM/yyyy', { locale: es }),
            fechaTermino: format(new Date(updatedPractica.fechaTermino), 'dd/MM/yyyy', { locale: es }),
            practicaId: updatedPractica.id,
            centroPractica: updatedPractica.centroPractica?.nombreEmpresa || 'Por definir'
          };

          const emailResult = await EmailService.notificarDocenteActa1Completada(emailData);
          
          // Registrar auditoría del envío de email
          await AuditoriaService.registrarEnvioEmail(
            alumnoUsuarioId,
            updatedPractica.docente.usuario.id!,
            'NOTIFICACION_DOCENTE_ACTA1_COMPLETADA',
            {
              destinatarioEmail: emailData.docenteEmail,
              destinatarioNombre: `${emailData.docenteNombre} ${emailData.docenteApellido}`,
              asunto: `Acta 1 completada - ${emailData.alumnoNombre} ${emailData.alumnoApellido}`,
              exitoso: emailResult.success,
              emailId: emailResult.emailId,
              errorMessage: emailResult.error
            },
            {
              tipo: 'Practica',
              id: updatedPractica.id.toString()
            }
          );

          if (!emailResult.success) {
            console.error('Error al enviar email de notificación al docente:', emailResult.error);
            // No fallar toda la operación por un error de email
          }
        } else {
          console.warn('No se pudo enviar notificación: docente sin email configurado');
        }
      } catch (emailError) {
        console.error('Error crítico al procesar notificación por email al docente:', emailError);
        // No fallar la operación principal por un error de notificación
      }

      return { success: true, data: updatedPractica };
    } catch (error) {
      console.error("Error al actualizar práctica (completar acta alumno):", error);
      return { success: false, error: 'No se pudo guardar la información del acta.' };
    }
  }

  /**
   * Obtiene las prácticas de un alumno específico, opcionalmente filtradas por estado.
   */
  static async getPracticasPorAlumno(alumnoId: number, estado?: string) {
    try {
      // Construir la condición where dinámicamente
      const whereCondition = estado 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? { alumnoId, estado: estado as any }
        : { alumnoId };

      const practicas = await prisma.practica.findMany({
        where: whereCondition,
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

  /**
   * Obtiene los detalles de una práctica para que el Docente la revise.
   * Verifica que la práctica esté asignada al docente y en estado PENDIENTE_ACEPTACION_DOCENTE.
   */
  static async getPracticaParaRevisionDocente(practicaId: number, docenteUsuarioId: number) {
    try {
      const docente = await prisma.docente.findUnique({
        where: { usuarioId: docenteUsuarioId },
        select: { id: true }
      });

      if (!docente) {
        return { success: false, error: "Perfil de docente no encontrado." };
      }

      const practica = await prisma.practica.findUnique({
        where: { 
          id: practicaId,
          docenteId: docente.id // Asegura que la práctica esté asignada a este docente
        },
        include: { // Incluye todos los datos relevantes del Acta 1
          alumno: { include: { usuario: true, carrera: { include: { sede: true } } } },
          carrera: { include: { sede: true } },
          docente: { include: { usuario: true } }, // Para confirmar info del docente actual
          centroPractica: true, // Si el alumno ya lo asoció (aunque no debería en PENDIENTE_ACEPTACION_DOCENTE)
        },
      });

      if (!practica) {
        return { success: false, error: 'Práctica no encontrada o no asignada a usted.' };
      }

      if (practica.estado !== 'PENDIENTE_ACEPTACION_DOCENTE') {
        return { success: false, error: `Esta práctica no está pendiente de su aceptación. Estado actual: ${practica.estado}` };
      }

      return { success: true, data: practica };
    } catch (error) {
      console.error("Error en getPracticaParaRevisionDocente:", error);
      return { success: false, error: "Error al obtener los detalles de la práctica para revisión." };
    }
  }

  /**
   * Procesa la decisión del Docente (Aceptar/Rechazar) sobre la supervisión del Acta 1.
   */
  static async procesarDecisionDocenteActa(
    practicaId: number,
    docenteUsuarioId: number,
    decisionData: DecisionDocenteActaData
  ) {
    try {
      const docente = await prisma.docente.findUnique({
        where: { usuarioId: docenteUsuarioId },
        select: { id: true }
      });
      if (!docente) {
        return { success: false, error: "Perfil de docente no encontrado." };
      }

      const practica = await prisma.practica.findUnique({
        where: { id: practicaId },
      });

      if (!practica) {
        return { success: false, error: 'Práctica no encontrada.' };
      }
      if (practica.docenteId !== docente.id) {
        return { success: false, error: 'No tienes permiso para modificar esta práctica.' };
      }
      if (practica.estado !== 'PENDIENTE_ACEPTACION_DOCENTE') {
        return { success: false, error: `Esta práctica ya no está en estado 'Pendiente Aceptación Docente'. Estado actual: ${practica.estado}` };
      }

      let nuevoEstado: string;
      let updateData: Record<string, unknown> = {};

      if (decisionData.decision === 'ACEPTADA') {
        nuevoEstado = 'EN_CURSO';
        updateData = {
          estado: nuevoEstado,
          motivoRechazoDocente: null, // Limpiar cualquier motivo de rechazo previo si existiera
        };
      } else if (decisionData.decision === 'RECHAZADA') {
        if (!decisionData.motivoRechazo || decisionData.motivoRechazo.trim() === '') {
          // Esta validación ya está en Zod, pero una doble verificación no hace daño.
          return { success: false, error: 'Se requiere un motivo para el rechazo.' };
        }
        nuevoEstado = 'RECHAZADA_DOCENTE';
        updateData = {
          estado: nuevoEstado,
          motivoRechazoDocente: decisionData.motivoRechazo,
        };
      } else {
        return { success: false, error: 'Decisión no válida.' };
      }

      const practicaActualizada = await prisma.practica.update({
        where: { id: practicaId },
        data: updateData,
      });

      return { success: true, data: practicaActualizada };
    } catch (error) {
      console.error("Error al procesar decisión del docente sobre el acta:", error);
      return { success: false, error: 'No se pudo procesar la decisión sobre el acta.' };
    }
  }

  /**
   * Obtiene los datos completos de una práctica para ser editada por un Coordinador/DC.
   */
  static async getPracticaParaEditarCoordDC(practicaId: number) {
    try {
      const practica = await prisma.practica.findUnique({
        where: { id: practicaId },
        include: { // Incluir todos los datos relevantes para mostrar y editar
          alumno: { include: { usuario: true, carrera: { include: { sede: true } } } },
          carrera: { include: { sede: true } },
          docente: { include: { usuario: true } },
          centroPractica: true, // Si está vinculado
        },
      });

      if (!practica) {
        return { success: false, error: 'Práctica no encontrada.' };
      }
      // Aquí no se aplican filtros de estado específicos, ya que un Coord/DC podría necesitar editar prácticas en varios estados.
      return { success: true, data: practica };
    } catch (error) {
      console.error("Error en getPracticaParaEditarCoordDC:", error);
      return { success: false, error: "Error al obtener los detalles de la práctica para edición." };
    }
  }

   /**
   * Actualiza una práctica existente por un Coordinador/DC.
   * Los datos de entrada ya deben estar validados por Zod.
   */
  static async updatePracticaCoordDC(
    practicaId: number,
    data: EditarPracticaCoordDCInput
  ) {
    try {
      // Validar que la práctica exista
      const existingPractica = await prisma.practica.findUnique({ where: { id: practicaId }});
      if (!existingPractica) {
        return { success: false, error: "Práctica no encontrada para actualizar." };
      }

      // Si se modifica fechaIniciola fechaTermino podría necesitar recalcularse o revalidarse.
      // Si fechaTermino no se provee en 'data', no se actualiza.
      // El frontend debería manejar la lógica de re-sugerir fechaTermino si fechaInicio cambia.

      const updatedPractica = await prisma.practica.update({
        where: { id: practicaId },
        data: {
          // Solo actualiza los campos que vienen en 'data' (Zod hace que los opcionales no enviados sean undefined)
          docenteId: data.docenteId,
          fechaInicio: data.fechaInicio,
          fechaTermino: data.fechaTermino,
          estado: data.estado,
          // Campos del centro de práctica y tareas
          direccionCentro: data.direccionCentro,
          departamento: data.departamento,
          nombreJefeDirecto: data.nombreJefeDirecto,
          cargoJefeDirecto: data.cargoJefeDirecto,
          contactoCorreoJefe: data.contactoCorreoJefe,
          contactoTelefonoJefe: data.contactoTelefonoJefe,
          practicaDistancia: data.practicaDistancia,
          tareasPrincipales: data.tareasPrincipales,
        },
        include: { // Devuelve la práctica actualizada con detalles
            alumno: { include: { usuario: true, carrera: {include: {sede: true}} } },
            docente: { include: { usuario: true } },
            carrera: { include: { sede: true } },
        }
      });
      return { success: true, data: updatedPractica };
    } catch (error) {
      console.error("Error al actualizar la práctica (Coord/DC):", error);
      return { success: false, error: 'No se pudo actualizar la información de la práctica.' };
    }
  }

  /**
   * Obtiene una lista de todas las prácticas con detalles para la gestión por Coord/DC.
   * Puede filtrar por la sede del usuario solicitante si se proporciona.
   * @param filters - Opcional: { requestingUserSedeId?: number | null }
   */
  static async getPracticasParaGestion(filters?: { requestingUserSedeId?: number | null }) {
    try {
      const whereClause: Record<string, unknown> = {};

      if (filters?.requestingUserSedeId) {
        // Filtra prácticas cuya carrera pertenezca a la sede del usuario solicitante
        whereClause.carrera = {
          sedeId: filters.requestingUserSedeId,
        };
      }

      const practicas = await prisma.practica.findMany({
        where: whereClause,
        include: {
          alumno: { 
            select: { 
              id: true, 
              usuario: { select: { rut: true, nombre: true, apellido: true }},
            } 
          },
          docente: { 
            select: { 
              id: true, 
              usuario: { select: { nombre: true, apellido: true }} 
            } 
          },
          carrera: { 
            select: { 
              id: true, 
              nombre: true, 
              sede: { select: { id: true, nombre: true } } 
            } 
          },
          // No incluimos centroPractica aquí a menos que sea necesario para la vista de lista general
        },
        orderBy: [
            { estado: 'asc' }, // Agrupar por estado
            { fechaInicio: 'desc' }, // Luego por fecha de inicio
        ]
      });
      return { success: true, data: practicas };
    } catch (error) {
      console.error('Error al obtener prácticas para gestión:', error);
      return { success: false, error: 'No se pudieron obtener las prácticas para gestión.' };
    }
  }

  /**
   * Permite a un alumno subir su informe de práctica.
   * Valida que la práctica esté en estado apropiado y actualiza la URL del informe.
   */
  static async subirInformePractica(
    practicaId: number,
    alumnoUsuarioId: number,
    informeUrl: string
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
        select: { 
          id: true, 
          alumnoId: true, 
          estado: true, 
          fechaTermino: true,
          informeUrl: true 
        }
      });

      if (!practica) {
        return { success: false, error: 'Práctica no encontrada.' };
      }

      if (practica.alumnoId !== alumno.id) {
        return { success: false, error: 'No tienes permiso para subir el informe de esta práctica.' };
      }      // Verificar que la práctica esté en un estado válido para subir informe
      if (practica.estado !== 'EN_CURSO' && 
          practica.estado !== 'FINALIZADA_PENDIENTE_EVAL') {
        return { 
          success: false, 
          error: `No puedes subir el informe en el estado actual: ${practica.estado}. La práctica debe estar en curso o finalizada pendiente de evaluación.` 
        };
      }

      // Validar que la fecha de término haya pasado para permitir la subida
      const hoy = new Date();
      const fechaTermino = new Date(practica.fechaTermino);
      
      if (hoy < fechaTermino) {
        return { 
          success: false, 
          error: 'No puedes subir el informe antes de la fecha de término de la práctica.' 
        };
      }      const updatedPractica = await prisma.practica.update({
        where: { id: practicaId },
        data: {
          informeUrl: informeUrl,
          // Si es la primera vez que sube el informe y está en curso, cambiar estado
          ...(practica.estado === 'EN_CURSO' && !practica.informeUrl && {
            estado: 'FINALIZADA_PENDIENTE_EVAL'
          })
        },
        include: {
          alumno: { include: { usuario: true, carrera: { include: { sede: true } } } },
          docente: { include: { usuario: true } },
          carrera: { include: { sede: true } },
        }
      });

      // HU-48: Notificar al docente que el informe fue subido
      try {
        await AlertasPracticasService.notificarDocenteInformeSubido(practicaId);
      } catch (error) {
        console.error('Error al notificar docente sobre informe subido:', error);
        // No fallar la operación principal si falla la notificación
      }

      return { success: true, data: updatedPractica };
    } catch (error) {
      console.error("Error al subir informe de práctica:", error);
      return { success: false, error: 'No se pudo subir el informe de práctica.' };
    }
  }

  /**
   * Obtiene la evaluación de empleador (Acta 2) para una práctica específica.
   * Valida que el alumno tenga permiso para ver esta evaluación.
   */
  static async getEvaluacionEmpleadorPorPractica(
    practicaId: number,
    alumnoUsuarioId: number
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
        include: {
          alumno: { include: { usuario: true, carrera: { include: { sede: true } } } },
          carrera: { include: { sede: true } },
          docente: { include: { usuario: true } },
          centroPractica: true,
          evaluacionEmpleador: true
        }
      });

      if (!practica) {
        return { success: false, error: 'Práctica no encontrada.' };
      }

      if (practica.alumnoId !== alumno.id) {
        return { success: false, error: 'No tienes permiso para ver la evaluación de esta práctica.' };
      }

      // Verificar que la práctica esté en un estado donde debería tener evaluación disponible
      if (!practica.evaluacionEmpleador) {
        return { success: false, error: 'Esta práctica aún no tiene evaluación de empleador disponible.' };
      }

      return { success: true, data: { practica, evaluacion: practica.evaluacionEmpleador } };
    } catch (error) {
      console.error("Error en getEvaluacionEmpleadorPorPractica:", error);
      return { success: false, error: "Error al obtener la evaluación del empleador." };
    }
  }

  /**
   * Obtiene todas las prácticas de un alumno que tienen evaluación de empleador disponible.
   * Solo retorna prácticas donde ya existe una evaluación completada.
   */
  static async getPracticasConEvaluacionEmpleadorDisponible(alumnoUsuarioId: number) {
    try {
      const alumno = await prisma.alumno.findUnique({
        where: { usuarioId: alumnoUsuarioId },
        select: { id: true }
      });

      if (!alumno) {
        return { success: false, error: "Perfil de alumno no encontrado." };
      }

      const practicas = await prisma.practica.findMany({
        where: {
          alumnoId: alumno.id,
          evaluacionEmpleador: {
            isNot: null // Solo prácticas que tienen evaluación de empleador
          }
        },
        include: {
          carrera: { select: { id: true, nombre: true, sede: { select: { id: true, nombre: true } } } },
          docente: { include: { usuario: { select: { id: true, nombre: true, apellido: true } } } },
          centroPractica: { select: { nombreEmpresa: true } },
          evaluacionEmpleador: {
            select: {
              id: true,
              nota: true,
              fecha: true,
              comentarios: true
            }
          }
        },
        orderBy: {
          fechaInicio: 'desc'
        }
      });

      return { success: true, data: practicas };
    } catch (error) {
      console.error("Error en getPracticasConEvaluacionEmpleadorDisponible:", error);
      return { success: false, error: "Error al obtener las prácticas con evaluación de empleador." };
    }
  }

  /**
   * Obtiene la evaluación de informe (del docente) para una práctica específica.
   * Valida que el alumno tenga permiso para ver esta evaluación.
   */
  static async getEvaluacionInformeDocentePorPractica(
    practicaId: number,
    alumnoUsuarioId: number
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
        include: {
          alumno: { include: { usuario: true, carrera: { include: { sede: true } } } },
          carrera: { include: { sede: true } },
          docente: { include: { usuario: true } },
          centroPractica: true,
          evaluacionDocente: true
        }
      });

      if (!practica) {
        return { success: false, error: 'Práctica no encontrada.' };
      }

      if (practica.alumnoId !== alumno.id) {
        return { success: false, error: 'No tienes permiso para ver la evaluación de esta práctica.' };
      }

      // Verificar que la práctica esté en un estado donde debería tener evaluación disponible
      if (!['EVALUACION_COMPLETA', 'CERRADA'].includes(practica.estado)) {
        return { success: false, error: 'La evaluación del informe aún no está disponible para esta práctica.' };
      }

      if (!practica.evaluacionDocente) {
        return { success: false, error: 'Esta práctica aún no tiene evaluación de informe disponible.' };
      }

      return { success: true, data: { practica, evaluacion: practica.evaluacionDocente } };
    } catch (error) {
      console.error("Error en getEvaluacionInformeDocentePorPractica:", error);
      return { success: false, error: "Error al obtener la evaluación del informe." };
    }
  }

  /**
   * Obtiene todas las prácticas de un alumno que tienen evaluación de informe disponible.
   * Solo retorna prácticas donde ya existe una evaluación completada por el docente.
   */
  static async getPracticasConEvaluacionInformeDisponible(alumnoUsuarioId: number) {
    try {
      const alumno = await prisma.alumno.findUnique({
        where: { usuarioId: alumnoUsuarioId },
        select: { id: true }
      });

      if (!alumno) {
        return { success: false, error: "Perfil de alumno no encontrado." };
      }

      const practicas = await prisma.practica.findMany({
        where: {
          alumnoId: alumno.id,
          evaluacionDocente: {
            isNot: null // Solo prácticas que tienen evaluación de docente
          }
        },
        include: {
          alumno: { include: { usuario: { select: { nombre: true, apellido: true, rut: true } } } },
          carrera: { select: { id: true, nombre: true, sede: { select: { id: true, nombre: true } } } },
          docente: { include: { usuario: { select: { id: true, nombre: true, apellido: true } } } },
          centroPractica: { select: { nombreEmpresa: true } },
          evaluacionDocente: {
            select: {
              id: true,
              nota: true,
              fecha: true,
              comentarios: true
            }
          }
        },
        orderBy: {
          fechaInicio: 'desc'
        }
      });

      return { success: true, data: practicas };
    } catch (error) {
      console.error("Error en getPracticasConEvaluacionInformeDisponible:", error);
      return { success: false, error: "Error al obtener las prácticas con evaluación de informe." };
    }
  }
}