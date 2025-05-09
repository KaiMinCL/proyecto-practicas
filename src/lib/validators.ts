import { z } from 'zod';

export const LoginSchema = z.object({
  rut: z.string().min(1, { message: "El RUT es requerido." })
    .regex(/^[0-9]{7,8}-[0-9Kk]$/, { message: "Formato de RUT inválido (ej: 12345678-9)." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
});

export type LoginFormData = z.infer<typeof LoginSchema>;