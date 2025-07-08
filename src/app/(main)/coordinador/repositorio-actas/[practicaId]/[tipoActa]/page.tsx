import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ActaVisualizadorClient } from './acta-visualizador-client';

interface PageProps {
  params: Promise<{
    practicaId: string;
    tipoActa: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const tipoActa = resolvedParams.tipoActa.toUpperCase();
  
  const titulos = {
    'ACTA1': 'Acta 1 - Supervisión de Práctica',
    'EVALUACION_INFORME': 'Evaluación de Informe de Práctica',
    'EVALUACION_EMPLEADOR': 'Acta 2 - Evaluación por Empleador',
    'ACTA_FINAL': 'Acta Final de Evaluación'
  };

  return {
    title: titulos[tipoActa as keyof typeof titulos] || 'Visualizar Acta',
    description: 'Visualización detallada del acta seleccionada'
  };
}

function ActaVisualizadorLoading() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function VisualizarActaPage({ params }: PageProps) {
  const resolvedParams = await params;
  const practicaId = parseInt(resolvedParams.practicaId);
  const tipoActa = resolvedParams.tipoActa.toUpperCase();

  // Validar parámetros
  if (isNaN(practicaId) || practicaId <= 0) {
    notFound();
  }

  const tiposValidos = ['ACTA1', 'EVALUACION_INFORME', 'EVALUACION_EMPLEADOR', 'ACTA_FINAL'];
  if (!tiposValidos.includes(tipoActa)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={<ActaVisualizadorLoading />}>
        <ActaVisualizadorClient 
          practicaId={practicaId}
          tipoActa={tipoActa as 'ACTA1' | 'EVALUACION_INFORME' | 'EVALUACION_EMPLEADOR' | 'ACTA_FINAL'}
        />
      </Suspense>
    </div>
  );
}
