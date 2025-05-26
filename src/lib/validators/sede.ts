import { z } from 'zod';

export const sedeSchema = z.object({
  nombre: z.string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
    .max(100, { message: "El nombre no puede tener más de 100 caracteres" })
    .transform(val => val.trim()),
  direccion: z.string()
    .max(200, { message: "La dirección no puede tener más de 200 caracteres" })
    .default("")
    .transform(val => val.trim()),
});

export type SedeInput = z.infer<typeof sedeSchema>;

export interface Sede extends SedeInput {
  id: number;
  estado: 'ACTIVO' | 'INACTIVO';
  createdAt: Date;
  updatedAt: Date;
}
