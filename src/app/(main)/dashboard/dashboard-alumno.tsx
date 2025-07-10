'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  GraduationCap, 
  FileText, 
  BookOpen,
  AlertCircle
} from 'lucide-react';

import type { PracticaConDetalles } from '@/lib/validators/practica';
import type { UserJwtPayload } from '@/lib/auth-utils';
import { DocumentosView } from '@/components/custom/DocumentosView';
import { PracticaCard } from '@/components/custom/PracticaCard';

interface DashboardAlumnoProps {
  user: UserJwtPayload;
}

export function DashboardAlumno({ user }: DashboardAlumnoProps) {
  const [practicaActiva, setPracticaActiva] = useState<PracticaConDetalles | null>(null);
  const [todasPracticas, setTodasPracticas] = useState<PracticaConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPracticas = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/alumno/mis-practicas');
        const data = await response.json();

        if (data.success) {
          setTodasPracticas(data.data);
          // Buscar práctica activa (solo estados activos, no finalizadas)
          const activa = data.data.find((p: PracticaConDetalles) => 
            ['PENDIENTE', 'PENDIENTE_ACEPTACION_DOCENTE', 'EN_CURSO'].includes(p.estado)
          );
          setPracticaActiva(activa || null);
        } else {
          setError(data.error || 'Error al cargar las prácticas');
        }
      } catch (error) {
        console.error('Error fetching practicas:', error);
        setError('Error al cargar las prácticas');
      } finally {
        setLoading(false);
      }
    };

    fetchPracticas();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de bienvenida */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">¡Bienvenido, {user.nombre}!</h1>
            <p className="text-white/90 mt-1">
              Sistema de Gestión de Prácticas Profesionales
            </p>
            <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-white/30">
              Alumno
            </Badge>
          </div>
          <GraduationCap className="h-16 w-16 text-white/30" />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Práctica Activa */}
        <div className="lg:col-span-2">
          {practicaActiva ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Mi Práctica Activa</h2>
                <Button asChild variant="outline" size="sm">
                  <Link href="/alumno/mis-practicas">
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Todas las Prácticas
                  </Link>
                </Button>
              </div>
              <PracticaCard practica={practicaActiva} />
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tienes práctica activa</h3>
                <p className="text-muted-foreground mb-4">
                  Cuando tengas una práctica asignada, aparecerá aquí con todas las opciones disponibles.
                </p>
                <Button asChild variant="outline">
                  <Link href="/alumno/mis-practicas">
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Todas las Prácticas
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Documentos de apoyo compactos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Documentos de Apoyo
              </CardTitle>
              <CardDescription>
                Accede rápidamente a los documentos más importantes para tu carrera
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/documentos">
                <BookOpen className="w-4 h-4 mr-2" />
                Ver Todos los Documentos
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DocumentosView 
            title=""
            filterByUserCarrera={true}
            maxItems={6}
            showViewAllButton={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
