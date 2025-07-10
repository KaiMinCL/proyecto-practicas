import { z } from 'zod';

export const CreateDocumentoSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres'),
  
  carreraId: z
    .number()
    .int()
    .positive('ID de carrera inválido')
    .optional(),
  
  sedeId: z
    .number()
    .int()
    .positive('ID de sede inválido')
    .optional(),
});

export const UpdateDocumentoSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .optional(),
  
  carreraId: z
    .number()
    .int()
    .positive('ID de carrera inválido')
    .optional(),
  
  sedeId: z
    .number()
    .int()
    .positive('ID de sede inválido')
    .optional(),
});

export type CreateDocumentoData = z.infer<typeof CreateDocumentoSchema>;
export type UpdateDocumentoData = z.infer<typeof UpdateDocumentoSchema>;
