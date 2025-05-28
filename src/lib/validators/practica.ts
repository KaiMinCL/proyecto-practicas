import { z } from 'zod';
import { TipoPractica as PrismaTipoPracticaEnum, EstadoPractica as PrismaEstadoPracticaEnum } from '@prisma/client';

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
  
  tipoPractica: z.nativeEnum(PrismaTipoPracticaEnum, {
    required_error: "Debe seleccionar el tipo de práctica.",
  }),

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

// Interface general para Práctica con detalles
export interface PracticaConDetalles {
  id: number;
  alumnoId: number;
  docenteId: number;
  carreraId: number;
  tipo: PrismaTipoPracticaEnum;
  fechaInicio: Date;
  fechaTermino: Date;
  estado: PrismaEstadoPracticaEnum;

  // Campos del Acta 1 del alumno
  direccionCentro?: string | null;
  departamento?: string | null;        
  nombreJefeDirecto?: string | null;
  cargoJefeDirecto?: string | null;
  contactoCorreoJefe?: string | null;  
  contactoTelefonoJefe?: string | null;
  practicaDistancia?: boolean | null;
  tareasPrincipales?: string | null;
  fechaCompletadoAlumno?: Date | null;

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
}