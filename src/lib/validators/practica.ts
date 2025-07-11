import { z } from 'zod';

// Definir enums localmente
const TipoPracticaEnum = z.enum(['LABORAL', 'PROFESIONAL']);

// Schema para cuando el Coordinador inicia la práctica
export const iniciarPracticaSchema = z.object({
  alumnoId: z.coerce.number({
    required_error: "Debe seleccionar un alumno.",
    invalid_type_error: "ID de alumno inválido.",
  }).int().positive({ message: "ID de alumno debe ser positivo." }),

  docenteId: z.coerce.number({
    required_error: "Debe seleccionar un docente tutor.",
    invalid_type_error: "ID de docente inválido.",
  }).int().positive({ message: "ID de docente debe ser positivo." }),
  
  tipoPractica: TipoPracticaEnum,

  fechaInicio: z.coerce.date({
    required_error: "La fecha de inicio es requerida.",
  }),

  // Esta es la fecha de término que el coordinador confirma o modifica
  fechaTermino: z.coerce.date({
    required_error: "La fecha de término es requerida.",
  }),
});
export type IniciarPracticaInput = z.infer<typeof iniciarPracticaSchema>;

// Schema para completar el Acta 1 del Alumno
export const completarActaAlumnoSchema = z.object({
  direccionCentro: z.string({ required_error: "La dirección del centro de práctica es requerida."})
    .min(5, 'La dirección debe tener al menos 5 caracteres.')
    .max(255, 'La dirección no puede exceder los 255 caracteres.'),
  
  departamento: z.string()
    .max(100, 'El departamento no puede exceder los 100 caracteres.')
    .optional().or(z.literal('')), // Opcional, pero si se envía, no puede ser solo espacios (se trimea)
  
  nombreJefeDirecto: z.string({ required_error: "El nombre del jefe directo es requerido."})
    .min(3, 'El nombre del jefe directo debe tener al menos 3 caracteres.')
    .max(100, 'El nombre del jefe no puede exceder los 100 caracteres.'),
  
  cargoJefeDirecto: z.string({ required_error: "El cargo del jefe directo es requerido."})
    .min(3, 'El cargo debe tener al menos 3 caracteres.')
    .max(100, 'El cargo no puede exceder los 100 caracteres.'),
  
  contactoCorreoJefe: z.string({ required_error: "El correo del jefe directo es requerido."})
    .email('El correo del jefe directo debe ser un correo electrónico válido.')
    .max(100, 'El correo no puede exceder los 100 caracteres.'),
  
  contactoTelefonoJefe: z.string()
    .regex(/^\+?[0-9\s-()]{7,20}$/, 'Número de teléfono inválido. Formato: "+56 9 1234 5678" o "1234567". Entre 7 y 20 dígitos.')
    .optional().or(z.literal('')), // Opcional, pero si se provee, debe ser válido o vacío
  
  practicaDistancia: z.boolean().default(false), // Ya tiene default en Prisma, Zod lo refuerza
  
  tareasPrincipales: z.string({ required_error: "La descripción de tareas principales es requerida."})
    .min(10, 'Describe brevemente las tareas principales (mínimo 10 caracteres).')
    .max(2000, 'La descripción de tareas no puede exceder los 2000 caracteres.'),
  
});

export type CompletarActaAlumnoData = z.infer<typeof completarActaAlumnoSchema>;

export const decisionDocenteActaSchema = z.object({
  decision: z.enum(['ACEPTADA', 'RECHAZADA'], {
    required_error: "La decisión (aceptar/rechazar) es requerida.",
  }),
  motivoRechazo: z.string().max(1000, "El motivo de rechazo no puede exceder los 1000 caracteres.").optional(),
}).refine(data => {
  // Si la decisión es RECHAZADA, el motivoRechazo se vuelve obligatorio y no puede estar vacío.
  if (data.decision === 'RECHAZADA') {
    return data.motivoRechazo && data.motivoRechazo.trim().length > 0;
  }
  return true; // Si es ACEPTADA, motivoRechazo no se envia)
}, {
  message: "El motivo de rechazo es requerido si se rechaza la supervisión.",
  path: ['motivoRechazo'], // Asocia este error al campo motivoRechazo
});

export type DecisionDocenteActaData = z.infer<typeof decisionDocenteActaSchema>;

// Schema para subir informe de práctica
export const subirInformePracticaSchema = z.object({
  informeUrl: z.string({
    required_error: "La URL del informe es requerida.",
  }).url("Debe ser una URL válida del informe subido."),
});

export type SubirInformePracticaData = z.infer<typeof subirInformePracticaSchema>;

// Schema para editar práctica por el Coordinador o Docente de Carrera
export const editarPracticaCoordDCSchema = z.object({
  docenteId: z.coerce.number({
    invalid_type_error: "ID de docente inválido.",
  }).int().positive({ message: "ID de docente debe ser positivo." }).optional(),

  fechaInicio: z.coerce.date({
    invalid_type_error: "Fecha de inicio inválida.",
  }).optional(),

  fechaTermino: z.coerce.date({
    invalid_type_error: "Fecha de término inválida.",
  }).optional(),

  estado: z.enum([
    'PENDIENTE',
    'PENDIENTE_ACEPTACION_DOCENTE', 
    'RECHAZADA_DOCENTE',
    'EN_CURSO',
    'FINALIZADA_PENDIENTE_EVAL',
    'EVALUACION_COMPLETA',
    'CERRADA',
    'ANULADA'
  ]).optional(),

  // Campos del Centro de Práctica y Tareas (originalmente llenados por alumno, ahora editables por Coord/DC)
  direccionCentro: z.string()
    .min(1, {message: "La dirección no puede estar vacía si se modifica."})
    .max(255, 'La dirección no puede exceder los 255 caracteres.')
    .optional()
    .or(z.union([
      z.literal(''),
      z.literal(null)
    ]))
    .transform(e => (e === "" ? null : e)),

  departamento: z.string()
    .max(100, 'El departamento no puede exceder los 100 caracteres.')
    .optional()
    .or(z.union([
      z.literal(''),
      z.literal(null) 
    ]))
    .transform(e => (e === "" ? null : e)),

  nombreJefeDirecto: z.string()
    .min(1, {message: "El nombre del jefe no puede estar vacío si se modifica."})
    .max(100, 'El nombre del jefe no puede exceder los 100 caracteres.')
    .optional()
    .or(z.union([
      z.literal(''),
      z.literal(null)
    ]))
    .transform(e => (e === "" ? null : e)),

  cargoJefeDirecto: z.string()
    .min(1, {message: "El cargo del jefe no puede estar vacío si se modifica."})
    .max(100, 'El cargo no puede exceder los 100 caracteres.')
    .optional()
    .or(z.union([
      z.literal(''),
      z.literal(null)
    ]))
    .transform(e => (e === "" ? null : e)),
  
  contactoCorreoJefe: z.string()
    .email('Debe ser un correo electrónico válido si se modifica.')
    .max(100, 'El correo no puede exceder los 100 caracteres.')
    .optional()
    .or(z.union([
      z.literal(''),
      z.literal(null) 
    ]))
    .transform(e => (e === "" ? null : e)),
  
  contactoTelefonoJefe: z.string()
    .regex(/^\+?[0-9\s-()]{7,20}$/, 'Número de teléfono inválido si se modifica.')
    .optional()
    .or(z.union([
      z.literal(''),
      z.literal(null)
    ]))
    .transform(e => (e === "" ? null : e)),
  
  practicaDistancia: z.boolean().optional(),
  
  tareasPrincipales: z.string()
    .min(1, {message: "Las tareas не pueden estar vacías si se modifican."})
    .max(2000, 'La descripción de tareas no puede exceder los 2000 caracteres.')
    .optional()
    .or(z.union([
      z.literal(''),
      z.literal(null)
    ]))
    .transform(e => (e === "" ? null : e)),

  // No se permite cambiar: alumnoId, carreraId, tipoPractica
}).refine(data => {
    if (data.fechaInicio && data.fechaTermino) {
      return data.fechaTermino >= data.fechaInicio;
    }
    return true;
  }, {
    message: "La fecha de término no puede ser anterior a la fecha de inicio.",
    path: ["fechaTermino"], 
});

export type EditarPracticaCoordDCInput = z.infer<typeof editarPracticaCoordDCSchema>;


// Interface general para Práctica con detalles
export interface PracticaConDetalles {
  id: number;
  alumnoId: number;
  docenteId: number;
  carreraId: number;
  tipo: 'LABORAL' | 'PROFESIONAL';
  fechaInicio: Date;
  fechaTermino: Date;
  estado: string;

  // Campos del Acta 1 del alumno
  direccionCentro?: string | null;
  departamento?: string | null;        
  nombreJefeDirecto?: string | null;
  cargoJefeDirecto?: string | null;
  contactoCorreoJefe?: string | null;  
  contactoTelefonoJefe?: string | null;
  practicaDistancia?: boolean | null;
  tareasPrincipales?: string | null;  fechaCompletadoAlumno?: Date | null;
  motivoRechazoDocente?: string | null;
  informeUrl?: string | null; // URL del informe de práctica subido por el alumno
  fechaSubidaInforme?: Date | null; // Fecha en que se subió el informe

  // DATOS RELACIONALES
  alumno?: { // Datos del alumno asociado
    id: number; 
    usuario: { 
      rut: string; 
      nombre: string; 
      apellido: string; 
    };
    fotoUrl?: string | null;
  };
  docente?: { // Datos del docente asignado
    id: number;
    usuario: { 
      nombre: string; 
      apellido: string; 
    };
  };
  carrera?: { // Datos de la carrera asociada
    id: number;
    nombre: string;
    sede?: { 
      id: number;
      nombre: string; 
    } | null;
  };
  centroPractica?: { // Datos del centro de práctica
    nombreEmpresa: string | null;
  } | null;
  evaluacionDocente?: { // Evaluación de informe por el docente
    id: number;
    nota: number;
    fecha: Date;
  } | null;
  evaluacionEmpleador?: { // Evaluación del empleador
    id: number;
    nota: number;
    fecha: Date;
  } | null;
  actaFinal?: { // Acta final de la práctica
    id: number;
    notaFinal: number;
    estado: string;
    fechaCierre: Date;
  } | null;
}