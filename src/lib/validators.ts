import { z } from "zod";

export const sedeSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  direccion: z.string().optional(),
});

export type SedeInput = z.infer<typeof sedeSchema>;

export const carreraSchema = z.object({
  nombre: z.string().min(1),
  sedeId: z.string().min(1), // Sede activa asociada
});
export type CarreraInput = z.infer<typeof carreraSchema>;