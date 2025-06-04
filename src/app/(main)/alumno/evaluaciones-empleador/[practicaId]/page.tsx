// src/app/(main)/alumno/evaluaciones-empleador/[practicaId]/page.tsx
import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EvaluacionEmpleadorDetalleClient } from './evaluacion-detalle-client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Detalle Evaluación Empleador | Sistema de Prácticas',
  description: 'Ver el detalle completo de la evaluación de empleador (Acta 2)',
};

interface PageProps {
  params: {
    practicaId: string;
  };
}

function EvaluacionDetalleSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-96" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function EvaluacionEmpleadorDetallePage({ params }: PageProps) {
  const practicaId = parseInt(params.practicaId);
  
  if (isNaN(practicaId)) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Suspense fallback={<EvaluacionDetalleSkeleton />}>
        <EvaluacionEmpleadorDetalleClient practicaId={practicaId} />
      </Suspense>
    </div>
  );
}
