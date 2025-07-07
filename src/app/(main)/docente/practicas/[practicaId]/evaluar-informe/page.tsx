'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, FileText, User, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

// Schema de validación para la evaluación
const evaluacionSchema = z.object({
  claridad_objetivos: z.number().min(1, 'Debe seleccionar un puntaje').max(7),
  fundamentacion_teorica: z.number().min(1, 'Debe seleccionar un puntaje').max(7),
  metodologia_aplicada: z.number().min(1, 'Debe seleccionar un puntaje').max(7),
  analisis_resultados: z.number().min(1, 'Debe seleccionar un puntaje').max(7),
  conclusiones_recomendaciones: z.number().min(1, 'Debe seleccionar un puntaje').max(7),
  calidad_redaccion: z.number().min(1, 'Debe seleccionar un puntaje').max(7),
  presentacion_formato: z.number().min(1, 'Debe seleccionar un puntaje').max(7),
  comentarios_generales: z.string().optional(),
  comentarios_mejoras: z.string().optional(),
})

type EvaluacionFormValues = z.infer<typeof evaluacionSchema>

// Criterios de evaluación según el Caso 13
const criteriosEvaluacion = [
  {
    key: 'claridad_objetivos' as keyof EvaluacionFormValues,
    titulo: 'Claridad de Objetivos',
    descripcion: 'Los objetivos de la práctica están claramente definidos y son coherentes con las actividades realizadas.'
  },
  {
    key: 'fundamentacion_teorica' as keyof EvaluacionFormValues,
    titulo: 'Fundamentación Teórica',
    descripcion: 'Demuestra conocimiento teórico relevante y lo aplica adecuadamente al contexto de la práctica.'
  },
  {
    key: 'metodologia_aplicada' as keyof EvaluacionFormValues,
    titulo: 'Metodología Aplicada',
    descripcion: 'La metodología utilizada es apropiada y está bien documentada en el informe.'
  },
  {
    key: 'analisis_resultados' as keyof EvaluacionFormValues,
    titulo: 'Análisis de Resultados',
    descripcion: 'Los resultados obtenidos son analizados de manera crítica y reflexiva.'
  },
  {
    key: 'conclusiones_recomendaciones' as keyof EvaluacionFormValues,
    titulo: 'Conclusiones y Recomendaciones',
    descripcion: 'Las conclusiones son coherentes con los objetivos y las recomendaciones son pertinentes.'
  },
  {
    key: 'calidad_redaccion' as keyof EvaluacionFormValues,
    titulo: 'Calidad de Redacción',
    descripcion: 'El informe presenta correcta ortografía, gramática y fluidez en la redacción.'
  },
  {
    key: 'presentacion_formato' as keyof EvaluacionFormValues,
    titulo: 'Presentación y Formato',
    descripcion: 'El informe cumple con los estándares de presentación y formato establecidos.'
  }
]

// Opciones de calificación (escala 1-7)
const opcionesCalificacion = [
  { value: 1, label: '1 - Muy Deficiente' },
  { value: 2, label: '2 - Deficiente' },
  { value: 3, label: '3 - Insuficiente' },
  { value: 4, label: '4 - Suficiente' },
  { value: 5, label: '5 - Bueno' },
  { value: 6, label: '6 - Muy Bueno' },
  { value: 7, label: '7 - Excelente' }
]

interface PracticaData {
  id: number
  alumno: {
    usuario: {
      nombre: string
      apellido: string
    }
  }
  informeUrl: string | null
  estado: string
}

interface EvaluacionData {
  id: number
  nota: number
  comentarios: string | null
  fecha: Date
}

export default function EvaluarInformePage() {
  const params = useParams()
  const router = useRouter()
  const practicaId = parseInt(params.practicaId as string)

  const [practicaData, setPracticaData] = useState<PracticaData | null>(null)
  const [evaluacionExistente, setEvaluacionExistente] = useState<EvaluacionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<EvaluacionFormValues>({
    resolver: zodResolver(evaluacionSchema),
    defaultValues: {
      claridad_objetivos: 4,
      fundamentacion_teorica: 4,
      metodologia_aplicada: 4,
      analisis_resultados: 4,
      conclusiones_recomendaciones: 4,
      calidad_redaccion: 4,
      presentacion_formato: 4,
      comentarios_generales: '',
      comentarios_mejoras: '',
    },
  })

  // Obtener datos de la práctica y evaluación existente
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Verificar que hay práctica con informe
        const practicaResponse = await fetch(`/api/practicas/${practicaId}`)
        if (!practicaResponse.ok) {
          throw new Error('Error al cargar datos de la práctica')
        }
        const practica = await practicaResponse.json()
        setPracticaData(practica)

        if (!practica.informeUrl) {
          setError('El alumno aún no ha subido el informe de práctica')
          return
        }

        // Intentar cargar evaluación existente
        try {
          const evaluacionResponse = await fetch(`/api/practicas/${practicaId}/evaluaciones/informe`)
          if (evaluacionResponse.ok) {
            const { evaluacion } = await evaluacionResponse.json()
            setEvaluacionExistente(evaluacion)
            
            // Cargar datos en el formulario si existe evaluación
            if (evaluacion.comentarios) {
              const partes = evaluacion.comentarios.split('\n\n--- Comentarios para Mejoras ---\n\n')
              form.setValue('comentarios_generales', partes[0] || '')
              form.setValue('comentarios_mejoras', partes[1] || '')
            }
          }
        } catch (evaluacionError) {
          // Es normal que no exista evaluación aún
          console.log('No hay evaluación previa')
        }

      } catch (error) {
        console.error('Error al cargar datos:', error)
        setError('Error al cargar los datos de la práctica')
      } finally {
        setLoading(false)
      }
    }

    if (practicaId) {
      fetchData()
    }
  }, [practicaId, form])

  // Calcular nota promedio en tiempo real
  const calcularNotaPromedio = () => {
    const valores = form.watch()
    const criteriosNumericos = criteriosEvaluacion.map(c => valores[c.key] as number).filter(Boolean)
    
    if (criteriosNumericos.length === 0) return 0
    
    const promedio = criteriosNumericos.reduce((sum, val) => sum + val, 0) / criteriosNumericos.length
    return Math.round(promedio * 10) / 10
  }

  const onSubmit = async (data: EvaluacionFormValues) => {
    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/practicas/${practicaId}/evaluaciones/informe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar la evaluación')
      }

      const result = await response.json()
      
      toast.success('Evaluación guardada exitosamente', {
        description: `Nota final: ${result.evaluacion.nota}`
      })

      // Redirigir a la lista de prácticas
      router.push('/docente/practicas-pendientes')
      
    } catch (error) {
      console.error('Error al guardar evaluación:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      toast.error('Error al guardar la evaluación')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos de la práctica...</p>
        </div>
      </div>
    )
  }

  if (error || !practicaData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="max-w-md mx-auto">
          <AlertDescription>{error || 'No se encontraron datos de la práctica'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs />
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Evaluación de Informe de Práctica</h1>
          {evaluacionExistente && (
            <Badge variant="secondary" className="text-sm">
              <CheckCircle className="h-4 w-4 mr-1" />
              Evaluación Existente
            </Badge>
          )}
        </div>
        
        {/* Información del alumno y práctica */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center">
              <User className="h-5 w-5 mr-2" />
              Información de la Práctica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Estudiante</p>
                <p className="font-medium">
                  {practicaData.alumno.usuario.nombre} {practicaData.alumno.usuario.apellido}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge variant="outline">{practicaData.estado}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Informe</p>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  <span className="text-sm">Subido</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulario de evaluación */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Criterios de evaluación */}
          <Card>
            <CardHeader>
              <CardTitle>Criterios de Evaluación</CardTitle>
              <CardDescription>
                Evalúe cada criterio en una escala del 1 al 7, donde 1 es muy deficiente y 7 es excelente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {criteriosEvaluacion.map((criterio, index) => (
                <div key={criterio.key}>
                  <FormField
                    control={form.control}
                    name={criterio.key}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          {index + 1}. {criterio.titulo}
                        </FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          {criterio.descripcion}
                        </FormDescription>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full md:w-64">
                              <SelectValue placeholder="Seleccionar puntaje" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {opcionesCalificacion.map((opcion) => (
                              <SelectItem key={opcion.value} value={opcion.value.toString()}>
                                {opcion.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {index < criteriosEvaluacion.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Comentarios */}
          <Card>
            <CardHeader>
              <CardTitle>Comentarios y Observaciones</CardTitle>
              <CardDescription>
                Proporcione retroalimentación adicional al estudiante (opcional).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="comentarios_generales"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comentarios Generales</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Escriba comentarios generales sobre el informe..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comentarios_mejoras"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sugerencias de Mejora</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Escriba sugerencias específicas para mejorar..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Resumen de calificación */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Calificación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Nota Promedio Calculada</p>
                  <p className="text-2xl font-bold">{calcularNotaPromedio().toFixed(1)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Escala de Evaluación</p>
                  <p className="text-sm">1.0 - 7.0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error display */}
          {error && (
            <Alert className="border-destructive">
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={submitting}
              className="min-w-[140px]"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {evaluacionExistente ? 'Actualizar Evaluación' : 'Guardar Evaluación'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}