import { redirect } from 'next/navigation';
import { authorizeSuperAdminOrDirectorCarrera } from '@/lib/auth/checkRole';
import { getConfiguracionEvaluacionAction, type ActionResponse } from './actions';
import type { ConfiguracionEvaluacion as ConfiguracionEvaluacionType } from '@/lib/validators/configuracion';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { ConfiguracionEvaluacionForm } from './configuracion-evaluacion-form';

export default async function ConfiguracionEvaluacionPage() {
  try {
    await authorizeSuperAdminOrDirectorCarrera(); // Protege la página
  } catch (error) {
    // Si la autorización falla, redirige.
    const redirectUrl = error instanceof Error && error.message.includes("No estás autenticado") 
      ? '/login' 
      : '/dashboard'; // O una página de "no autorizado"
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    redirect(new URL(redirectUrl, baseUrl).toString());
  }

  const result: ActionResponse<ConfiguracionEvaluacionType> = await getConfiguracionEvaluacionAction();


  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 rounded-lg bg-card p-6 shadow-lg">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Configuración de Ponderación de Evaluaciones
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Define los porcentajes para la Nota de Informe del Docente y la Nota de Evaluación del Empleador.
          La suma de ambos debe ser exactamente 100%.
        </p>
      </header>
      <section className="max-w-lg"> {/* Limita el ancho para mejor legibilidad del formulario */}
        {result.error && !result.data && ( 
          <Alert variant="destructive" className="mb-6">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error al Cargar Configuración</AlertTitle>
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
        )}
        <ConfiguracionEvaluacionForm initialConfig={result.data} />
      </section>
    </div>
  );
}