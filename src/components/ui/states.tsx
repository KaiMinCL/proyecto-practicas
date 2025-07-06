'use client';

import { AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  message?: string;
  rows?: number;
}

export function LoadingState({ message = "Cargando...", rows = 3 }: LoadingStateProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {message}
          </span>
        </div>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  action?: React.ReactNode;
}

export function ErrorState({ 
  title = "Error", 
  message, 
  action 
}: ErrorStateProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        {message}
        {action && (
          <div className="mt-3">
            {action}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface EmptyStateProps {
  icon?: React.ComponentType<any>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ 
  icon: Icon = Info, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
            {description}
          </p>
        )}
        {action && action}
      </CardContent>
    </Card>
  );
}

interface SuccessStateProps {
  title?: string;
  message: string;
  action?: React.ReactNode;
}

export function SuccessState({ 
  title = "Éxito", 
  message, 
  action 
}: SuccessStateProps) {
  return (
    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertTitle className="text-green-800 dark:text-green-300">{title}</AlertTitle>
      <AlertDescription className="text-green-700 dark:text-green-200 mt-2">
        {message}
        {action && (
          <div className="mt-3">
            {action}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
