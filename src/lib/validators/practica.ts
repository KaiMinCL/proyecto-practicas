import { z } from 'zod';
import { TipoPractica as PrismaTipoPracticaEnum, EstadoPractica as PrismaEstadoPracticaEnum } from '@prisma/client';

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
  // carreraId se obtendrá del alumno seleccionado y se pasará al servicio.
});

export type IniciarPracticaInput = z.infer<typeof iniciarPracticaSchema>;

// Interface para la entidad Practica completa, para usar en respuestas de actions/services
export interface PracticaConDetalles {
  id: number;
  alumnoId: number;
  docenteId: number;
  carreraId: number;
  tipo: PrismaTipoPracticaEnum;
  fechaInicio: Date;
  fechaTermino: Date;
  estado: PrismaEstadoPracticaEnum;
  alumno?: {
    usuario: { rut: string; nombre: string; apellido: string; };
    carrera: { id: number; nombre: string; sede?: { nombre: string; } | null };
  };
  docente?: {
    usuario: { nombre: string; apellido: string; };
  };
}