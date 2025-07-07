import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';
// Asegúrate que la ruta a las actions del docente sea correcta
import { getDetallesPracticaParaRevisionDocenteAction, type ActionResponse } from '../../../practicas/actions'; 
import type { PracticaConDetalles } from '@/lib/validators/practica';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, FileCheck, User, GraduationCap } from "lucide-react";
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
          <FileCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-3">
          Revisión de Acta 1
        </h1>
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-center space-x-4 mb-3">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {practica.alumno?.usuario.nombre} {practica.alumno?.usuario.apellido}
              </span>
            </div>
            <span className="text-gray-400">•</span>
            <span className="text-purple-600 dark:text-purple-400 font-medium">
              {practica.alumno?.usuario.rut}
            </span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-gray-700 dark:text-gray-300">
              {practica.carrera?.nombre} • {practica.carrera?.sede?.nombre || 'N/A'}
            </span>
          </div>
        </div>
      </header>
      <RevisarActaDocenteCliente practica={practica} />
    </div>
  );
}