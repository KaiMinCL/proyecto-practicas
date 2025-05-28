import { z } from 'zod';

export const configuracionEvaluacionSchema = z.object({
  porcentajeInforme: z.coerce // Usamos coerce para convertir string de input a número
    .number({
      required_error: "El porcentaje del informe es requerido.",
      invalid_type_error: "El porcentaje del informe debe ser un número.",
    })
    .int({ message: "El porcentaje debe ser un número entero." })
    .min(0, { message: "El porcentaje no puede ser menor que 0." })
    .max(100, { message: "El porcentaje no puede ser mayor que 100." }),
  
  porcentajeEmpleador: z.coerce
    .number({
      required_error: "El porcentaje del empleador es requerido.",
      invalid_type_error: "El porcentaje del empleador debe ser un número.",
    })
    .int({ message: "El porcentaje debe ser un número entero." })
    .min(0, { message: "El porcentaje no puede ser menor que 0." })
    .max(100, { message: "El porcentaje no puede ser mayor que 100." }),
}).refine(data => data.porcentajeInforme + data.porcentajeEmpleador === 100, {
  message: "La suma de los porcentajes del informe y del empleador debe ser exactamente 100%.",
});

export type ConfiguracionEvaluacionInput = z.infer<typeof configuracionEvaluacionSchema>;

// Interfaz para la entidad completa
export interface ConfiguracionEvaluacion extends ConfiguracionEvaluacionInput {
  id: number; 
}