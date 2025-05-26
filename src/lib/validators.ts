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
  rol: z.enum(['DirectorCarrera', 'Coordinador', 'Docente'], {
    required_error: "El rol es requerido.",
    invalid_type_error: "Rol inválido.",
  }),
  sedeId: z.number({
    required_error: "La sede es requerida.",
    invalid_type_error: "ID de sede inválido.",
  }),
});

export const UpdateUserSchema = z.object({
  id: z.number(),
  nombre: z.string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres." })
    .max(50, { message: "El nombre debe tener máximo 50 caracteres." }),
  apellido: z.string()
    .min(2, { message: "El apellido debe tener al menos 2 caracteres." })
    .max(50, { message: "El apellido debe tener máximo 50 caracteres." }),
  email: z.string()
    .min(1, { message: "El email es requerido." })
    .email({ message: "Formato de email inválido." }),
  rol: z.enum(['DirectorCarrera', 'Coordinador', 'Docente'], {
    required_error: "El rol es requerido.",
    invalid_type_error: "Rol inválido.",
  }),
  sedeId: z.number({
    required_error: "La sede es requerida.",
    invalid_type_error: "ID de sede inválido.",
  }),
});

export type LoginFormData = z.infer<typeof LoginSchema>;
export type CreateUserFormData = z.infer<typeof CreateUserSchema>;
export type UpdateUserFormData = z.infer<typeof UpdateUserSchema>;