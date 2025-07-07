import { z } from 'zod';

// Criterios de evaluación estándar para empleadores
export const CRITERIOS_EVALUACION_EMPLEADOR = [
  {
    id: 'puntualidad',
    nombre: 'Puntualidad y Asistencia',
    descripcion: 'Cumple con horarios establecidos y presenta baja ausentismo',
    peso: 15
  },
  {
    id: 'responsabilidad',
    nombre: 'Responsabilidad',
    descripcion: 'Cumple con las tareas asignadas en tiempo y forma',
    peso: 20
  },
  {
    id: 'iniciativa',
    nombre: 'Iniciativa y Proactividad',
    descripcion: 'Propone mejoras y actúa de manera proactiva',
    peso: 15
  },
  {
    id: 'trabajo_equipo',
    nombre: 'Trabajo en Equipo',
    descripcion: 'Se integra bien al equipo y colabora efectivamente',
    peso: 15
  },
  {
    id: 'comunicacion',
    nombre: 'Comunicación',
    descripcion: 'Se comunica de manera clara y efectiva',
    peso: 10
  },
  {
    id: 'conocimientos',
    nombre: 'Aplicación de Conocimientos',
    descripcion: 'Aplica conocimientos académicos en el trabajo práctico',
    peso: 15
  },
  {
    id: 'adaptabilidad',
    nombre: 'Adaptabilidad',
    descripcion: 'Se adapta a cambios y nuevas situaciones',
    peso: 10
  }
] as const;

// Escala de evaluación (1-7 según sistema chileno)
export const ESCALA_EVALUACION = [
  { valor: 1, descripcion: 'Muy Deficiente' },
  { valor: 2, descripcion: 'Deficiente' },
  { valor: 3, descripcion: 'Insuficiente' },
  { valor: 4, descripcion: 'Suficiente' },
  { valor: 5, descripcion: 'Bueno' },
  { valor: 6, descripcion: 'Muy Bueno' },
  { valor: 7, descripcion: 'Excelente' }
] as const;

// Schema para una evaluación individual de criterio
export const evaluacionCriterioSchema = z.object({
  criterioId: z.string().min(1, 'El criterio es requerido'),
  puntaje: z.number()
    .min(1, 'El puntaje mínimo es 1')
    .max(7, 'El puntaje máximo es 7')
    .int('El puntaje debe ser un número entero')
});

// Schema para la evaluación completa del empleador
export const evaluacionEmpleadorSchema = z.object({
  practicaId: z.number({
    required_error: 'ID de práctica es requerido',
    invalid_type_error: 'ID de práctica debe ser un número'
  }).int().positive(),
  
  criterios: z.array(evaluacionCriterioSchema)
    .min(CRITERIOS_EVALUACION_EMPLEADOR.length, 
      `Debe evaluar todos los ${CRITERIOS_EVALUACION_EMPLEADOR.length} criterios`),
    comentarios: z.string()
    .max(2000, 'Los comentarios no pueden exceder 2000 caracteres')
    .optional()
    .or(z.literal(''))
    .transform(val => val === '' ? undefined : val),
    
  notaFinal: z.number()
    .min(1, 'La nota final mínima es 1.0')
    .max(7, 'La nota final máxima es 7.0')
}).refine(data => {
  // Verificar que todos los criterios requeridos están presentes
  const criteriosRequeridos = CRITERIOS_EVALUACION_EMPLEADOR.map(c => c.id);
  const criteriosPresentes = data.criterios.map(c => c.criterioId);
  
  return criteriosRequeridos.every(req => criteriosPresentes.includes(req));
}, {
  message: 'Faltan criterios por evaluar',
  path: ['criterios']
});

export type EvaluacionEmpleadorInput = z.infer<typeof evaluacionEmpleadorSchema>;
export type EvaluacionCriterioInput = z.infer<typeof evaluacionCriterioSchema>;

// Función utilitaria para calcular nota final
export function calcularNotaFinal(criterios: EvaluacionCriterioInput[]): number {
  let sumaTotal = 0;
  let pesoTotal = 0;
  
  for (const criterio of criterios) {
    const criterioDef = CRITERIOS_EVALUACION_EMPLEADOR.find(c => c.id === criterio.criterioId);
    if (criterioDef) {
      sumaTotal += criterio.puntaje * criterioDef.peso;
      pesoTotal += criterioDef.peso;
    }
  }
  
  return pesoTotal > 0 ? Math.round((sumaTotal / pesoTotal) * 100) / 100 : 0;
}