'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  GraduationCap, 
  FileText, 
  Calendar, 
  MapPin, 
  User, 
  Building, 
  Clock, 
  BookOpen,
  CheckCircle,
  AlertCircle,
  Eye,
  Upload,
  MessageSquare,
  Star
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import type { PracticaConDetalles } from '@/lib/validators/practica';
import type { UserJwtPayload } from '@/lib/auth-utils';
import { DocumentosView } from '@/components/custom/DocumentosView';

interface DashboardAlumnoProps {
  user: UserJwtPayload;
}

interface InfoItemProps {
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value, className }) => (
  <div className={`flex items-center space-x-2 ${className}`}>
    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    <div className="min-w-0 flex-1">
      <span className="text-sm font-medium text-muted-foreground">{label}:</span>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  </div>
);

const getEstadoBadge = (estado: string) => {
  const variants = {
    'PENDIENTE': { variant: 'outline' as const, label: 'Pendiente' },
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

export function DashboardAlumno({ user }: DashboardAlumnoProps) {
  const [practicaActiva, setPracticaActiva] = useState<PracticaConDetalles | null>(null);
  const [todasPracticas, setTodasPracticas] = useState<PracticaConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPracticas = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/alumno/mis-practicas');
        const data = await response.json();

        if (data.success) {
          setTodasPracticas(data.data);
          // Buscar práctica activa (EN_CURSO o FINALIZADA_PENDIENTE_EVAL)
          const activa = data.data.find((p: PracticaConDetalles) => 
            ['EN_CURSO', 'FINALIZADA_PENDIENTE_EVAL', 'PENDIENTE_ACEPTACION_DOCENTE'].includes(p.estado)
          );
          setPracticaActiva(activa || null);
        } else {
          setError(data.error || 'Error al cargar las prácticas');
        }
      } catch (error) {
        console.error('Error fetching practicas:', error);
        setError('Error al cargar las prácticas');
      } finally {
        setLoading(false);
      }
    };

    fetchPracticas();
  }, []);

  const calcularProgreso = (practica: PracticaConDetalles): number => {
    let progreso = 0;
    
    // Información básica completada
    if (practica.direccionCentro && practica.nombreJefeDirecto) progreso += 30;
    
    // Estado de la práctica
    if (practica.estado === 'EN_CURSO') progreso += 40;
    if (practica.estado === 'FINALIZADA_PENDIENTE_EVAL') progreso += 70;
    if (practica.estado === 'EVALUACION_COMPLETA') progreso += 90;
    if (practica.estado === 'CERRADA') progreso = 100;
    
    return Math.min(progreso, 100);
  };

  const getAccionesDisponibles = (practica: PracticaConDetalles) => {
    const acciones = [];
    
    if (practica.estado === 'PENDIENTE') {
      acciones.push({
        label: 'Completar Acta 1',
        href: `/alumno/mis-practicas/${practica.id}/completar-acta`,
        variant: 'default' as const,
        icon: FileText
      });
    }
    
    if (['EN_CURSO', 'FINALIZADA_PENDIENTE_EVAL'].includes(practica.estado)) {
      acciones.push({
        label: 'Subir Informe',
        href: `/alumno/subir-informe?practicaId=${practica.id}`,
        variant: 'outline' as const,
        icon: Upload
      });
    }
    
    if (practica.estado === 'EVALUACION_COMPLETA') {
      acciones.push({
        label: 'Ver Evaluaciones',
        href: `/alumno/evaluaciones-empleador?practicaId=${practica.id}`,
        variant: 'outline' as const,
        icon: Star
      });
    }
    
    return acciones;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de bienvenida */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">¡Bienvenido, {user.nombre}!</h1>
            <p className="text-white/90 mt-1">
              Sistema de Gestión de Prácticas Profesionales
            </p>
            <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-white/30">
              Alumno
            </Badge>
          </div>
          <GraduationCap className="h-16 w-16 text-white/30" />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Práctica Activa */}
        <div className="lg:col-span-2">
          {practicaActiva ? (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="bg-card border-b border-border">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary text-primary-foreground shadow-md">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2 text-foreground">
                        Práctica {practicaActiva.tipo === 'LABORAL' ? 'Laboral' : 'Profesional'}
                      </CardTitle>
                      <CardDescription className="text-base font-medium text-muted-foreground">
                        Mi práctica actual en progreso
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={getEstadoBadge(practicaActiva.estado).variant} className="shadow-sm">
                    {getEstadoBadge(practicaActiva.estado).label}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Información básica */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <InfoItem icon={MapPin} label="Sede" value={practicaActiva.carrera?.sede?.nombre || 'N/A'} />
                    <InfoItem icon={User} label="Docente Tutor" value={`${practicaActiva.docente?.usuario?.nombre || ''} ${practicaActiva.docente?.usuario?.apellido || 'No asignado'}`} />
                  </div>
                  
                  <div className="space-y-2">
                    <InfoItem icon={Calendar} label="Fecha Inicio" value={format(new Date(practicaActiva.fechaInicio), "PPP", { locale: es })} />
                    <InfoItem icon={Clock} label="Fecha Término" value={format(new Date(practicaActiva.fechaTermino), "PPP", { locale: es })} />
                  </div>
                </div>

                {/* Progreso */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progreso de la Práctica</span>
                    <span className="text-sm text-muted-foreground">{calcularProgreso(practicaActiva)}%</span>
                  </div>
                  <Progress value={calcularProgreso(practicaActiva)} className="h-2" />
                </div>

                {/* Acciones disponibles */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/alumno/mis-practicas/${practicaActiva.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Link>
                  </Button>
                  
                  {getAccionesDisponibles(practicaActiva).map((accion, index) => (
                    <Button key={index} asChild size="sm" variant={accion.variant}>
                      <Link href={accion.href}>
                        <accion.icon className="w-4 h-4 mr-2" />
                        {accion.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tienes práctica activa</h3>
                <p className="text-muted-foreground mb-4">
                  Cuando tengas una práctica asignada, aparecerá aquí con todas las opciones disponibles.
                </p>
                <Button asChild variant="outline">
                  <Link href="/alumno/mis-practicas">
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Todas las Prácticas
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Accesos rápidos */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Accesos Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/alumno/mis-practicas">
                  <FileText className="w-4 h-4 mr-2" />
                  Mis Prácticas
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/documentos">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Documentos de Apoyo
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/alumno/evaluaciones-empleador">
                  <Star className="w-4 h-4 mr-2" />
                  Evaluaciones Empleador
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/alumno/evaluaciones-informe">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Evaluaciones Informe
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Resumen de prácticas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total prácticas:</span>
                  <span className="text-sm font-semibold">{todasPracticas.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completadas:</span>
                  <span className="text-sm font-semibold">
                    {todasPracticas.filter(p => p.estado === 'CERRADA').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">En progreso:</span>
                  <span className="text-sm font-semibold">
                    {todasPracticas.filter(p => ['EN_CURSO', 'FINALIZADA_PENDIENTE_EVAL'].includes(p.estado)).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Documentos de apoyo compactos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Documentos de Apoyo
          </CardTitle>
          <CardDescription>
            Accede rápidamente a los documentos más importantes para tu carrera
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentosView 
            title=""
            filterByUserCarrera={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
