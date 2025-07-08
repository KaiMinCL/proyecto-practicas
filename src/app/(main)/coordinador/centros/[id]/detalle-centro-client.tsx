"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Terminal, 
  Info, 
  Building, 
  Users, 
  Phone, 
  Mail, 
  MapPin,
  ArrowLeft,
  User,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { MapComponent } from '@/components/custom';
import { toast } from 'sonner';

interface CentroDetalle {
  id: number;
  nombreEmpresa: string;
  giro?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  emailGerente?: string | null;
  empleadores: Array<{
    id: number;
    nombre: string;
    email: string;
  }>;
  practicas: Array<{
    id: number;
    estado: string;
    alumno: string;
  }>;
}

interface DetalleCentroClientProps {
  centroId: number;
}

const getEstadoPracticaBadge = (estado: string) => {
  const variants = {
    'PENDIENTE': { variant: 'secondary' as const, label: 'Pendiente' },
    'PENDIENTE_ACEPTACION_DOCENTE': { variant: 'default' as const, label: 'Pendiente Aprobación' },
    'RECHAZADA_DOCENTE': { variant: 'destructive' as const, label: 'Rechazada' },
    'EN_CURSO': { variant: 'default' as const, label: 'En Curso' },
    'FINALIZADA_PENDIENTE_EVAL': { variant: 'default' as const, label: 'Finalizada' },
    'EVALUACION_COMPLETA': { variant: 'success' as const, label: 'Evaluada' },
    'CERRADA': { variant: 'outline' as const, label: 'Cerrada' },
    'ANULADA': { variant: 'destructive' as const, label: 'Anulada' },
  };
  
  return variants[estado as keyof typeof variants] || variants['PENDIENTE'];
};

export function DetalleCentroClient({ centroId }: DetalleCentroClientProps) {
  const [centro, setCentro] = React.useState<CentroDetalle | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchCentro = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/centros/${centroId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Centro de práctica no encontrado');
          }
          throw new Error('Error al cargar el centro de práctica');
        }
        
        const data = await response.json();
        setCentro(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCentro();
  }, [centroId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-muted rounded mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !centro) {
    return (
      <div className="max-w-6xl mx-auto">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error al Cargar Centro</AlertTitle>
          <AlertDescription>{error || 'Centro no encontrado'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/coordinador/centros">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Centros
            </Link>
          </Button>
        </div>
      </div>

      {/* Información general del centro */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary text-primary-foreground">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">{centro.nombreEmpresa}</CardTitle>
                <CardDescription className="text-lg">
                  {centro.giro || 'Giro no especificado'}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1">
              Centro de Práctica
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Información de contacto */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center">
                <Info className="w-5 h-5 mr-2" />
                Información de Contacto
              </h3>
              <div className="space-y-3 pl-7">
                {centro.direccion && (
                  <InfoItem 
                    icon={MapPin} 
                    label="Dirección" 
                    value={centro.direccion} 
                  />
                )}
                {centro.telefono && (
                  <InfoItem 
                    icon={Phone} 
                    label="Teléfono" 
                    value={centro.telefono} 
                  />
                )}
                {centro.emailGerente && (
                  <InfoItem 
                    icon={Mail} 
                    label="Email Gerente" 
                    value={centro.emailGerente} 
                  />
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Estadísticas
              </h3>
              <div className="space-y-3 pl-7">
                <InfoItem 
                  icon={Users} 
                  label="Empleadores Registrados" 
                  value={`${centro.empleadores.length} empleador${centro.empleadores.length !== 1 ? 'es' : ''}`} 
                />
                <InfoItem 
                  icon={Briefcase} 
                  label="Prácticas Totales" 
                  value={`${centro.practicas.length} práctica${centro.practicas.length !== 1 ? 's' : ''}`} 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapa del centro */}
      {centro.direccion && (
        <MapComponent 
          address={centro.direccion}
          title={`Ubicación de ${centro.nombreEmpresa}`}
          height="450px"
        />
      )}

      {/* Lista de empleadores */}
      {centro.empleadores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Empleadores Registrados
            </CardTitle>
            <CardDescription>
              Personal de la empresa que puede evaluar prácticas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {centro.empleadores.map((empleador) => (
                <div key={empleador.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary text-secondary-foreground">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{empleador.nombre}</p>
                      <p className="text-xs text-muted-foreground truncate">{empleador.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de prácticas */}
      {centro.practicas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Prácticas en este Centro
            </CardTitle>
            <CardDescription>
              Historial de prácticas realizadas en esta empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {centro.practicas.map((practica) => {
                const estadoBadge = getEstadoPracticaBadge(practica.estado);
                return (
                  <div key={practica.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{practica.alumno}</p>
                        <p className="text-xs text-muted-foreground">Práctica #{practica.id}</p>
                      </div>
                    </div>
                    <Badge variant={estadoBadge.variant} className="text-xs">
                      {estadoBadge.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado sin información */}
      {centro.empleadores.length === 0 && centro.practicas.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Centro sin actividad</h3>
            <p className="text-muted-foreground">
              Este centro aún no tiene empleadores registrados ni prácticas asignadas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start space-x-3">
      <Icon className="w-4 h-4 mt-0.5 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
