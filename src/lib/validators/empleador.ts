import { z } from 'zod';

export const CreateEmpleadorSchema = z.object({
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
  centroPracticaId: z.number({
    required_error: "El centro de práctica es requerido.",
    invalid_type_error: "ID de centro de práctica inválido.",
  }),
});

export type CreateEmpleadorFormData = z.infer<typeof CreateEmpleadorSchema>;
