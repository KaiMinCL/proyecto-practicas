// src/app/(main)/alumno/evaluaciones-empleador/page.tsx
import { Suspense } from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EvaluacionesEmpleadorClient } from './evaluaciones-empleador-client';

export const metadata: Metadata = {
  title: 'Evaluaciones de Empleador | Sistema de Prácticas',
  description: 'Ver las evaluaciones de empleador (Acta 2) de tus prácticas completadas',
};

function EvaluacionesEmpleadorSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-96" />
      <Skeleton className="h-4 w-full" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-9 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function EvaluacionesEmpleadorPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Evaluaciones de Empleador
        </h1>
        <p className="text-gray-600">
          Aquí puedes consultar las evaluaciones (Acta 2) que los empleadores han realizado sobre tu desempeño en las prácticas profesionales.
        </p>
      </div>

      <Suspense fallback={<EvaluacionesEmpleadorSkeleton />}>
        <EvaluacionesEmpleadorClient />
      </Suspense>
    </div>
  );
}
