import { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificacionesContent } from './components/NotificacionesContent';

export const metadata: Metadata = {
  title: 'Notificaciones - Coordinador',
  description: 'Estado de las notificaciones por correo electrónico enviadas',
};

function NotificacionesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 border rounded-lg">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      
      <div className="p-6 border rounded-lg">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NotificacionesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Notificaciones por Email
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Estado de las notificaciones automáticas enviadas a los alumnos
        </p>
      </div>

      <Suspense fallback={<NotificacionesLoading />}>
        <NotificacionesContent />
      </Suspense>
    </div>
  );
}
