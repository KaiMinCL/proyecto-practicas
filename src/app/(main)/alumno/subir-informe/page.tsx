import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';
import type { PracticaConDetalles } from '@/lib/validators/practica';
import { ActionResponse, getMisPracticasParaInformeAction } from '../practicas/actions';
import { SubirInformeCliente } from './subir-informe-client';
import { Upload } from 'lucide-react';

const REQUIRED_ROLE: RoleName = 'ALUMNO';

export default async function SubirInformePage() {
  const userPayload = await getUserSession();

  if (!userPayload) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const loginUrl = new URL('/login', baseUrl);
    redirect(loginUrl.toString());
  }

  if (userPayload.rol !== REQUIRED_ROLE) {
    console.warn(
      `Acceso no autorizado a /alumno/subir-informe. Usuario RUT: ${userPayload.rut}, Rol: ${userPayload.rol}. Rol requerido: ${REQUIRED_ROLE}`
    );
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const dashboardUrl = new URL('/dashboard', baseUrl);
    redirect(dashboardUrl.toString());
  }

  // Llama a la action para obtener las prácticas que pueden subir informe
  const result: ActionResponse<PracticaConDetalles[]> = await getMisPracticasParaInformeAction();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
          <Upload className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
          Subir Informe de Práctica
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Sube los informes finales de tus prácticas en curso o finalizadas. Los documentos deben estar en formato PDF, DOC o DOCX.
        </p>
      </header>
      <SubirInformeCliente initialActionResponse={result} />
    </div>
  );
}
