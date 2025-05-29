import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { authorizeCoordinadorOrDirectorCarrera } from "@/lib/auth/checkRole";
import { PracticaConDetalles } from "@/lib/validators/practica";
import { Terminal } from "lucide-react";
import { redirect } from "next/navigation";
import { ActionResponse, getPracticaParaEditarAction } from "../../../actions";
import { EditarPracticaForm } from "./editar-practica-form";

interface PageProps {
  params: {
    practicaId: string;
  };
}

export default async function EditarPracticaPage({ params }: PageProps) {
  let userPayload;
  try {
    userPayload = await authorizeCoordinadorOrDirectorCarrera();
  } catch (error) {
    const redirectUrl = error instanceof Error && error.message.includes("No estás autenticado") 
      ? '/login' 
      : '/dashboard';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    redirect(new URL(redirectUrl, baseUrl).toString());
  }

  const practicaId = parseInt(params.practicaId, 10);
  if (isNaN(practicaId)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>ID de práctica inválido.</AlertDescription></Alert>
      </div>
    );
  }

  const result: ActionResponse<PracticaConDetalles> = await getPracticaParaEditarAction(practicaId);
  
  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8"><h1 className="text-2xl font-bold">Editar Práctica</h1></header>
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error al Cargar Práctica</AlertTitle>
          <AlertDescription>{result.error || "No se pudo cargar la información de la práctica para edición."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const practica = result.data;

  // Si la práctica está en un estado que no debería ser editable por Coord/DC (ej. CERRADA, ANULADA), podrías mostrar un mensaje.
  // Por ahora, el formulario manejará la habilitación de campos.

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Editar Registro de Práctica
        </h1>
        <p className="mt-1 text-muted-foreground">
          Alumno: {practica.alumno?.usuario.nombre} {practica.alumno?.usuario.apellido} ({practica.alumno?.usuario.rut})
          <br/>
          Carrera: {practica.carrera?.nombre} (Sede: {practica.carrera?.sede?.nombre || 'N/A'})
        </p>
      </header>
      <EditarPracticaForm practicaOriginal={practica} />
    </div>
  );
}