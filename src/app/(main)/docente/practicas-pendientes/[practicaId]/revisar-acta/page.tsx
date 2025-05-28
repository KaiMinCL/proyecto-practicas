// src/app/(main)/docente/practicas-pendientes/[practicaId]/revisar-acta/page.tsx
import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';
// Asegúrate que la ruta a las actions del docente sea correcta
import { getDetallesPracticaParaRevisionDocenteAction, type ActionResponse } from '../../../practicas/actions'; 
import type { PracticaConDetalles } from '@/lib/validators/practica';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { RevisarActaDocenteCliente } from './revisar-acta-docente-client';

const REQUIRED_ROLE: RoleName = 'DOCENTE';

interface PageProps {
  params: Promise<{practicaId: string}>
}

export default async function RevisarActaPage({ params: paramsPromise }: PageProps) {

  const params = await paramsPromise;

  const userPayload = await getUserSession();

  if (!userPayload) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const loginUrl = new URL('/login', baseUrl);
    redirect(loginUrl.toString());
  }

  if (userPayload.rol !== REQUIRED_ROLE) {
    console.warn(
      `Acceso no autorizado a /docente/practicas-pendientes/.../revisar-acta. Usuario RUT: ${userPayload.rut}, Rol: ${userPayload.rol}.`
    );
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const dashboardUrl = new URL('/dashboard', baseUrl);
    redirect(dashboardUrl.toString());
  }

  const practicaId = parseInt(params.practicaId, 10);
  if (isNaN(practicaId)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error de Navegación</AlertTitle>
          <AlertDescription>El ID de la práctica proporcionado no es válido.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const result: ActionResponse<PracticaConDetalles> = await getDetallesPracticaParaRevisionDocenteAction(practicaId);
  
  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Revisión de Acta de Práctica
          </h1>
        </header>
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error al Cargar Práctica</AlertTitle>
          <AlertDescription>{result.error || "No se pudo cargar la información de la práctica para revisión."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const practica = result.data;

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Revisión Acta 1: Práctica de {practica.alumno?.usuario.nombre} {practica.alumno?.usuario.apellido}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          RUT Alumno: {practica.alumno?.usuario.rut} <br/>
          Carrera: {practica.carrera?.nombre} (Sede: {practica.carrera?.sede?.nombre || 'N/A'})
        </p>
      </header>
      <RevisarActaDocenteCliente practica={practica} />
    </div>
  );
}