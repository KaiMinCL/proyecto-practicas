import { Suspense } from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RepositorioActasClient } from './repositorio-actas-client';

export const metadata: Metadata = {
  title: 'Repositorio de Actas Históricas',
  description: 'Consulta y descarga de actas digitales históricas del sistema de prácticas'
};

function RepositorioActasLoading() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RepositorioActasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Repositorio de Actas Históricas</h1>
        <p className="text-muted-foreground mt-2">
          Consulta, visualiza y descarga actas digitales generadas en el sistema de prácticas
        </p>
      </div>

      <Suspense fallback={<RepositorioActasLoading />}>
        <RepositorioActasClient />
      </Suspense>
    </div>
  );
}
