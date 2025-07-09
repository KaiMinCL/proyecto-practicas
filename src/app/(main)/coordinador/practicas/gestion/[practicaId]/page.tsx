import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { authorizeCoordinadorOrDirectorCarrera } from "@/lib/auth/checkRole";
import { PracticaConDetalles } from "@/lib/validators/practica";
import { Terminal, ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ActionResponse, getPracticaParaEditarAction } from "../../actions";
import { EnviarAlertaManualDialog } from "@/components/custom/EnviarAlertaManualDialog";
import { HistorialAlertasManuales } from "@/components/custom/HistorialAlertasManuales";

interface PageProps {
  params: Promise<{practicaId: string}>
}

// Helper para capitalizar y reemplazar guiones bajos
const formatEstado = (estado: string) => {
  if (!estado) return 'N/A';
  return estado.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
};

export default async function DetallePracticaPage({ params: paramsPromise }: PageProps) {
  const params = await paramsPromise;

  try {
    await authorizeCoordinadorOrDirectorCarrera();
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
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>ID de práctica inválido.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const result: ActionResponse<PracticaConDetalles> = await getPracticaParaEditarAction(practicaId);
  
  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-4">
            <Link href="/coordinador/practicas/gestion">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Gestión
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Detalle de Práctica</h1>
          </div>
        </header>
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error al Cargar Práctica</AlertTitle>
          <AlertDescription>{result.error || "No se pudo cargar la información de la práctica."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const practica = result.data as PracticaConDetalles & {
    alumno?: {
      usuario: {
        id: number;
        email?: string;
        rut: string;
        nombre: string;
        apellido: string;
      };
    };
    docente?: {
      usuario: {
        nombre: string;
        apellido: string;
      };
    };
    horario?: string;
    centroPractica?: {
      nombreEmpresa: string | null;
      nombre?: string;
      direccion?: string;
    };
  };
  const alumno = practica.alumno?.usuario;
  const docente = practica.docente?.usuario;
  const centroPractica = practica.centroPractica;

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/coordinador/practicas/gestion">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Gestión
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Detalle de Práctica</h1>
              <p className="text-muted-foreground">
                {alumno ? `${alumno.apellido}, ${alumno.nombre}` : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={practica.estado === 'TERMINADA' ? 'default' : 'secondary'}>
              {formatEstado(practica.estado)}
            </Badge>
            <Link href={`/coordinador/practicas/gestion/${practica.id}/editar`}>
              <Button variant="outline" size="sm">
                Editar Práctica
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información del Estudiante */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Estudiante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nombre Completo</label>
              <p className="text-sm">{alumno ? `${alumno.nombre} ${alumno.apellido}` : 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">RUT</label>
              <p className="text-sm">{alumno?.rut || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Foto</label>
              <p className="text-sm">{practica.alumno?.fotoUrl ? 'Disponible' : 'No disponible'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Carrera</label>
              <p className="text-sm">{practica.carrera?.nombre || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Información del Docente */}
        <Card>
          <CardHeader>
            <CardTitle>Docente Supervisor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nombre Completo</label>
              <p className="text-sm">{docente ? `${docente.nombre} ${docente.apellido}` : 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Información de la Práctica */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Práctica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Estado</label>
              <p className="text-sm">
                <Badge variant={practica.estado === 'TERMINADA' ? 'default' : 'secondary'}>
                  {formatEstado(practica.estado)}
                </Badge>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tipo de Práctica</label>
              <p className="text-sm">{practica.tipo || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fecha de Inicio</label>
              <p className="text-sm">
                {practica.fechaInicio ? format(new Date(practica.fechaInicio), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fecha de Término</label>
              <p className="text-sm">
                {practica.fechaTermino ? format(new Date(practica.fechaTermino), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Horario</label>
              <p className="text-sm">{practica.horario || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Información del Centro de Práctica */}
        <Card>
          <CardHeader>
            <CardTitle>Centro de Práctica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nombre</label>
              <p className="text-sm">{centroPractica?.nombre || centroPractica?.nombreEmpresa || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Dirección</label>
              <p className="text-sm">{centroPractica?.direccion || practica.direccionCentro || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Departamento</label>
              <p className="text-sm">{practica.departamento || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección de Alertas Manuales */}
      <div className="mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Alertas Manuales</h2>
          <EnviarAlertaManualDialog 
            practicaId={practica.id}
            alumnoNombre={alumno ? `${alumno.nombre} ${alumno.apellido}` : 'N/A'}
            alumnoEmail={alumno?.email || ''}
          />
        </div>
        
        <HistorialAlertasManuales practicaId={practica.id} />
      </div>
    </div>
  );
}
