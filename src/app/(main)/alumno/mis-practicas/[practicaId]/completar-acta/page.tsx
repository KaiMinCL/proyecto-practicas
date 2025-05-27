// src/app/(main)/alumno/mis-practicas/[practicaId]/completar-acta/page.tsx
import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';
import type { PracticaConDetalles } from '@/lib/validators/practica';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { ActionResponse, getDetallesPracticaParaCompletarAction } from '../../../practicas/actions';
import { CompletarActaAlumnoForm } from './completar-acta-alumno-form';

const REQUIRED_ROLE: RoleName = 'ALUMNO';

interface PageProps {
  params: {
    practicaId: string;
  };
}

export default async function CompletarActaPage({ params }: PageProps) {
  const userPayload = await getUserSession();

  if (!userPayload) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const loginUrl = new URL('/login', baseUrl);
    redirect(loginUrl.toString());
  }

  if (userPayload.rol !== REQUIRED_ROLE) {
    console.warn(
      `Acceso no autorizado a completar acta. Usuario RUT: ${userPayload.rut}, Rol: ${userPayload.rol}.`
    );
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const dashboardUrl = new URL('/dashboard', baseUrl);
    redirect(dashboardUrl.toString());
  }

  const practicaId = parseInt(params.practicaId, 10);
  if (isNaN(practicaId)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>ID de práctica inválido.</AlertDescription></Alert>
      </div>
    );
  }

  // Llama a la action para obtener los detalles de la práctica
  const result: ActionResponse<PracticaConDetalles & {fueraDePlazo?: boolean}> = await getDetallesPracticaParaCompletarAction(practicaId);

  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Completar Acta de Práctica</h1>
        </header>
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error al Cargar Práctica</AlertTitle>
          <AlertDescription>{result.error || "No se pudo cargar la información de la práctica."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const practica = result.data;

  // CA13: Si el formulario está bloqueado (fuera de plazo), mostrar mensaje.
  // La lógica de bloqueo real del formulario (deshabilitar campos) estará en el Client Component.
  // Aquí solo mostramos una alerta si la data del servicio indica que está fuera de plazo.
  // El servicio getDetallesPracticaParaCompletarAlumno ya incluye el flag `fueraDePlazo`.

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Completar Acta 1: {practica.carrera?.nombre || 'Práctica'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Alumno: {practica.alumno?.usuario.nombre} {practica.alumno?.usuario.apellido} ({practica.alumno?.usuario.rut})
        </p>
      </header>
      
      {practica.fueraDePlazo && (
        <Alert variant="destructive" className="mb-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Plazo Vencido</AlertTitle>
          <AlertDescription>
            El plazo para completar esta acta ha vencido. Por favor, contacta a tu Coordinador de Carrera para más información. El formulario estará bloqueado.
          </AlertDescription>
        </Alert>
      )}

      <CompletarActaAlumnoForm practica={practica} />
    </div>
  );
}