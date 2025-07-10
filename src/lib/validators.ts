import { z } from 'zod';

export const LoginSchema = z.object({
  rut: z.string().min(1, { message: "El RUT es requerido." })
    .regex(/^[0-9]{7,8}-[0-9Kk]$/, { message: "Formato de RUT inválido (ej: 12345678-9)." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
});

export const CreateUserSchema = z.object({
  rut: z.string()
    .min(1, { message: "El RUT es requerido." })
    .regex(/^[0-9]{7,8}-[0-9Kk]$/, { message: "Formato de RUT inválido (ej: 12345678-9)." }),
  nombre: z.string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres." })
    .max(50, { message: "El nombre debe tener máximo 50 caracteres." }),
  apellido: z.string()
    .min(2, { message: "El apellido debe tener al menos 2 caracteres." })
    .max(50, { message: "El apellido debe tener máximo 50 caracteres." }),
  email: z.string()
    .min(1, { message: "El email es requerido." })
    .email({ message: "Formato de email inválido." }),
   rol: z.enum(['DIRECTOR_CARRERA', 'COORDINADOR', 'DOCENTE'], {
    required_error: "El rol es requerido.",
    invalid_type_error: "Rol inválido.",
  }),
  sedeId: z.number({
    required_error: "La sede es requerida.",
    invalid_type_error: "ID de sede inválido.",
  }).int().positive({ message: "Debe seleccionar una sede válida." }),
});

export const UpdateUserSchema = CreateUserSchema.extend({
  id: z.number().int().positive(),
});

export const CreateAlumnoSchema = z.object({
  rut: z.string()
    .min(8, 'RUT debe tener al menos 8 caracteres')
    .max(12, 'RUT no puede tener más de 12 caracteres')
    .regex(/^[0-9]{7,8}-[0-9kK]$/, 'RUT debe tener el formato correcto (ej: 12345678-9)'),
  nombre: z.string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(50, 'Nombre no puede tener más de 50 caracteres'),
  apellido: z.string()
    .min(2, 'Apellido debe tener al menos 2 caracteres')
    .max(50, 'Apellido no puede tener más de 50 caracteres'),
  carreraId: z.number({
    required_error: 'Debe seleccionar una carrera',
    invalid_type_error: 'Carrera inválida',
  }),
});

export type LoginFormData = z.infer<typeof LoginSchema>;
export type CreateUserFormData = z.infer<typeof CreateUserSchema>;
export type UpdateUserFormData = z.infer<typeof UpdateUserSchema>;
export type CreateAlumnoFormData = z.infer<typeof CreateAlumnoSchema>;