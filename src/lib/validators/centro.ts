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
  // Opciones para el contacto/empleador
  empleadorExistenteId: z.number().optional(), // ID de empleador existente
  // O crear nuevo empleador
  crearNuevoEmpleador: z.boolean(),
  nuevoEmpleador: z.object({
    rut: z.string()
      .min(8, 'RUT debe tener al menos 8 caracteres')
      .max(12, 'RUT no puede tener más de 12 caracteres')
      .regex(/^[0-9]{7,8}-[0-9kK]$/, 'Formato de RUT inválido'),
    nombre: z.string()
      .min(2, { message: "El nombre debe tener al menos 2 caracteres." })
      .max(50, { message: "El nombre debe tener máximo 50 caracteres." }),
    apellido: z.string()
      .min(2, { message: "El apellido debe tener al menos 2 caracteres." })
      .max(50, { message: "El apellido debe tener máximo 50 caracteres." }),
    email: z.string()
      .min(1, { message: "El email es requerido." })
      .email({ message: "Formato de email inválido." }),
  }).optional(),
}).refine((data) => {
  // Debe tener o un empleador existente o crear uno nuevo
  return data.empleadorExistenteId || data.crearNuevoEmpleador;
}, {
  message: "Debe seleccionar un empleador existente o crear uno nuevo",
  path: ["empleadorExistenteId"]
}).refine((data) => {
  // Si va a crear nuevo empleador, debe proporcionar los datos
  if (data.crearNuevoEmpleador) {
    return data.nuevoEmpleador;
  }
  return true;
}, {
  message: "Debe proporcionar los datos del nuevo empleador",
  path: ["nuevoEmpleador"]
});

export const UpdateCentroSchema = z.object({
  id: z.number({
    required_error: "El ID es requerido.",
    invalid_type_error: "ID inválido.",
  }),
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
