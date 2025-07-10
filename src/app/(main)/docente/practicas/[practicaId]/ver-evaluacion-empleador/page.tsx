'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Building, User, Calendar, Star, MessageSquare, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

interface EvaluacionData {
  id: number
  nota: number
  comentarios: string | null
  fecha: Date
}

interface PracticaData {
  id: number
  alumno: {
    usuario: {
      nombre: string
      apellido: string
    }
  }
  centroPractica: {
    nombreEmpresa: string
  } | null
  estado: string
}

export default function VerEvaluacionEmpleadorPage() {
  const params = useParams()
  const router = useRouter()
  const practicaId = parseInt(params.practicaId as string)

  const [evaluacionData, setEvaluacionData] = useState<EvaluacionData | null>(null)
  const [practicaData, setPracticaData] = useState<PracticaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        const response = await fetch(`/api/practicas/${practicaId}/evaluaciones/empleador`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al cargar la evaluación')
        }

        const { evaluacion, practica } = await response.json()
        setEvaluacionData(evaluacion)
        setPracticaData(practica)

      } catch (error) {
        console.error('Error al cargar datos:', error)
        setError(error instanceof Error ? error.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    if (practicaId) {
      fetchData()
    }
  }, [practicaId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando evaluación del empleador...</p>
        </div>
      </div>
    )
  }

  if (error || !evaluacionData || !practicaData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Breadcrumbs />
        </div>
        <Alert className="max-w-md mx-auto border-destructive">
          <AlertDescription className="text-destructive">
            {error || 'No se encontró la evaluación del empleador'}
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    )
  }

  // Obtener el color de la nota
  const getNotaColor = (nota: number) => {
    if (nota >= 6.0) return 'text-green-600 bg-green-50 border-green-200'
    if (nota >= 4.0) return 'text-blue-600 bg-blue-50 border-blue-200'
    return 'text-red-600 bg-red-50 border-red-200'
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
          <h1 className="text-3xl font-bold">Evaluación del Empleador</h1>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
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
                <p className="text-sm text-muted-foreground">Centro de Práctica</p>
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">
                    {practicaData.centroPractica?.nombreEmpresa || 'No especificado'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge variant="outline">{practicaData.estado}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalles de la evaluación */}
      <div className="space-y-6">
        {/* Información general de la evaluación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Resumen de la Evaluación
            </CardTitle>
            <CardDescription>
              Evaluación completada por el empleador del centro de práctica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Fecha de Evaluación</p>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">
                    {format(new Date(evaluacionData.fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Nota Final</p>
                <div className={`inline-flex items-center px-3 py-2 rounded-lg border font-bold text-lg ${getNotaColor(evaluacionData.nota)}`}>
                  <Star className="h-5 w-5 mr-2" />
                  {evaluacionData.nota.toFixed(1)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comentarios del empleador */}
        {evaluacionData.comentarios && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Comentarios del Empleador
              </CardTitle>
              <CardDescription>
                Observaciones y retroalimentación del supervisor directo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {evaluacionData.comentarios}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Evaluación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ID de Evaluación</span>
                <span className="font-mono text-sm">{evaluacionData.id}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Escala de Evaluación</span>
                <span className="text-sm">1.0 - 7.0</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tipo de Evaluación</span>
                <span className="text-sm">Acta 2 - Evaluación Empleador</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botón de acción */}
      <div className="flex justify-end mt-8">
        <Button onClick={() => router.push('/dashboard')}>
          Ver Todas las Prácticas
        </Button>
      </div>
    </div>
  )
}