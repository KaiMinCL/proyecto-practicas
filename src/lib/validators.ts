import { z } from "zod";

// Schema para Sede
export const sedeSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  direccion: z.string().optional(),
});
export type SedeInput = z.infer<typeof sedeSchema>;

// Schema para Carrera
export const carreraSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  sedeId: z.string().min(1, "Debe seleccionar una sede"),
});
export type CarreraInput = z.infer<typeof carreraSchema>;
 