'use client';

import { useAuth } from '@/hooks';
import { Sidebar } from '@/components/layout/Sidebar';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/layout/Navbar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <Skeleton className="h-16 w-full" />
        <div className="flex flex-1">
          <Skeleton className="w-64 h-full" />
          <div className="flex-1 p-6">
            <Skeleton className="h-8 w-full mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
       
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-6 py-6">
              <Breadcrumbs />
              <div className="mt-4">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}