import { redirect } from 'next/navigation';
import { authorizeCoordinadorOrDirectorCarrera } from '@/lib/auth/checkRole';
import { listPracticasGestionAction, type ActionResponse } from '../actions'; 
import type { PracticaConDetalles } from '@/lib/validators/practica';
import { PracticasGestionCliente } from './practicas-gestion-client';

export default async function GestionPracticasPage() {
  try {
    await authorizeCoordinadorOrDirectorCarrera();
  } catch (error) {
    const redirectUrl = error instanceof Error && error.message.includes("No estás autenticado") 
      ? '/login' 
      : '/dashboard';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    redirect(new URL(redirectUrl, baseUrl).toString());
  }
  
  const result: ActionResponse<PracticaConDetalles[]> = await listPracticasGestionAction();
    
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Gestión de Prácticas
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Visualiza y administra todas las prácticas de los alumnos.
        </p>
      </header>
      <PracticasGestionCliente initialActionResponse={result} />
    </div>
  );
}