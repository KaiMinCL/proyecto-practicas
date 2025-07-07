import { z } from 'zod';

export const CreateCentroSchema = z.object({
  nombreEmpresa: z.string()
    .min(2, { message: "El nombre de la empresa debe tener al menos 2 caracteres." })
    .max(100, { message: "El nombre de la empresa debe tener máximo 100 caracteres." }),
  giro: z.string()
    .max(100, { message: "El giro debe tener máximo 100 caracteres." })
    .optional(),
  direccion: z.string()
    .max(200, { message: "La dirección debe tener máximo 200 caracteres." })
    .optional(),
  telefono: z.string()
    .regex(/^(\+?56)?[0-9\s\-\(\)]{8,15}$/, { message: "Formato de teléfono inválido." })
    .optional()
    .or(z.literal("")),
  emailGerente: z.string()
    .email({ message: "Formato de email inválido." })
    .optional()
    .or(z.literal("")),
  nombreContacto: z.string()
    .max(100, { message: "El nombre del contacto debe tener máximo 100 caracteres." })
    .optional(),
  emailContacto: z.string()
    .email({ message: "Formato de email inválido." })
    .optional()
    .or(z.literal("")),
  telefonoContacto: z.string()
    .regex(/^(\+?56)?[0-9\s\-\(\)]{8,15}$/, { message: "Formato de teléfono inválido." })
    .optional()
    .or(z.literal("")),
});

export const UpdateCentroSchema = CreateCentroSchema.partial().extend({
  id: z.number({
    required_error: "El ID es requerido.",
    invalid_type_error: "ID inválido.",
  }),
});

export const AssociateEmpleadorSchema = z.object({
  centroPracticaId: z.number({
    required_error: "El ID del centro de práctica es requerido.",
    invalid_type_error: "ID de centro de práctica inválido.",
  }),
  empleadorId: z.number({
    required_error: "El ID del empleador es requerido.",
    invalid_type_error: "ID de empleador inválido.",
  }),
});

export type CreateCentroFormData = z.infer<typeof CreateCentroSchema>;
export type UpdateCentroFormData = z.infer<typeof UpdateCentroSchema>;
export type AssociateEmpleadorFormData = z.infer<typeof AssociateEmpleadorSchema>;
