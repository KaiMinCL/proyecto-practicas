import { z } from 'zod';

export const carreraSchema = z.object({
  nombre: z.string()
    .min(3, { message: "El nombre de la carrera debe tener al menos 3 caracteres." })
    .max(150, { message: "El nombre de la carrera no puede tener más de 150 caracteres." })
    .transform(val => val.trim()),
  sedeId: z.coerce.number({
      required_error: "Debes seleccionar una sede.",
      invalid_type_error: "ID de sede inválido.",
    })
    .int({ message: "ID de sede debe ser un entero."})
    .positive({ message: "ID de sede debe ser positivo." }),
  horasPracticaLaboral: z.coerce.number({
      required_error: "Las horas de práctica laboral son requeridas.",
      invalid_type_error: "Las horas deben ser un número.",
    })
    .int({ message: "Las horas deben ser un número entero." })
    .nonnegative({ message: "Las horas no pueden ser negativas." })
    .max(320, { message: "Las horas de práctica laboral no deben exceder 320."}),
  horasPracticaProfesional: z.coerce.number({
      required_error: "Las horas de práctica profesional son requeridas.",
      invalid_type_error: "Las horas deben ser un número.",
    })
    .int({ message: "Las horas deben ser un número entero." })
    .nonnegative({ message: "Las horas no pueden ser negativas." })
    .max(320, { message: "Las horas de práctica profesional no deben exceder 320."}),
});

export type CarreraInput = z.infer<typeof carreraSchema>;

export interface Carrera extends CarreraInput {
  id: number;
  estado: 'ACTIVO' | 'INACTIVO';
  sede?: { 
    id: number;
    nombre: string;
  };
}