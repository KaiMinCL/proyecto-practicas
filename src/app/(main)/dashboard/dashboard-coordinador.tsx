'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Users, 
  GraduationCap, 
  FileText, 
  Building,
  Eye,
  Plus,
  Archive,
  BookOpen,
  Briefcase
} from 'lucide-react';

import type { UserJwtPayload } from '@/lib/auth-utils';
import { CreateCentroDialog } from '@/components/custom/create-centro-dialog';
import { CreateAlumnoDialog } from '../coordinador/alumnos/create-alumno-dialog';
import { CreateEmpleadorDialog } from '../coordinador/empleadores/create-empleador-dialog';
import { IniciarPracticaDialog } from '../coordinador/practicas/iniciar/iniciar-practica-dialog';


// 1. Interfaz de estadísticas que coincide con tu API /api/coordinador/stats
interface DashboardStats {
  totalAlumnos: number;
  alumnosConPracticaActiva: number;
  totalEmpleadores: number;
  practicasPendientesRevision: number;
  totalCentros: number;
  documentosSubidos: number;
}

interface DashboardCoordinadorProps {
  user: UserJwtPayload;
}

// 2. Componente de tarjeta de acción reutilizable
const ActionCard = ({ icon: Icon, title, description, link, children }: { icon: React.ElementType, title: string, description: string, link: string, children?: React.ReactNode }) => (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Icon className="w-5 h-5 text-primary" />
                        {title}
                    </CardTitle>
                    <CardDescription className="mt-1">{description}</CardDescription>
                </div>
                <Button asChild variant="ghost" size="icon">
                    <Link href={link}><Eye className="w-5 h-5 text-muted-foreground" /></Link>
                </Button>
            </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col justify-end">
            {children}
        </CardContent>
    </Card>
);

// 3. Componente principal del Dashboard del Coordinador
export function DashboardCoordinador({ user }: DashboardCoordinadorProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/coordinador/stats');
      if (!response.ok) throw new Error('No se pudieron cargar las estadísticas.');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSuccess = () => {
    toast.success("Operación exitosa", { description: "Refrescando datos del dashboard..." });
    fetchDashboardData();
  };

  if (loading || !stats) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Encabezado de Bienvenida */}
      <Card className="bg-gradient-to-r from-primary to-secondary text-primary-foreground border-none">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">¡Bienvenido, {user.nombre}!</CardTitle>
          <CardDescription className="text-primary-foreground/80 text-lg">
            Gestiona las prácticas de la sede **{user.sedeNombre || 'asignada'}**.
          </CardDescription>
        </CardHeader>
      </Card>
      
      {/* Grid principal de acciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <ActionCard
            icon={Briefcase}
            title="Gestión de Prácticas"
            description="Inicia, supervisa y gestiona todas las prácticas."
            link="/coordinador/practicas/gestion"
        >
            <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">En Curso</span><span className="font-semibold">{stats.alumnosConPracticaActiva}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pendientes de Revisión</span><span className="font-semibold text-amber-600">{stats.practicasPendientesRevision}</span></div>
                <div className="pt-2">
                     <IniciarPracticaDialog onPracticaIniciada={handleSuccess}>
                        <Button className="w-full"><Plus className="mr-2 h-4 w-4" /> Iniciar Nueva Práctica</Button>
                     </IniciarPracticaDialog>
                </div>
            </div>
        </ActionCard>


        <ActionCard
            icon={GraduationCap}
            title="Gestión de Alumnos"
            description="Administra los perfiles de los estudiantes."
            link="/coordinador/alumnos"
        >
             <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Alumnos</span><span className="font-semibold">{stats.totalAlumnos}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Con Práctica Activa</span><span className="font-semibold">{stats.alumnosConPracticaActiva}</span></div>
                <div className="pt-2">
                    <CreateAlumnoDialog />
                </div>
            </div>
        </ActionCard>

        <ActionCard
            icon={Building}
            title="Centros y Empleadores"
            description="Administra empresas y contactos."
            link="/coordinador/centros"
        >
            <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Centros</span><span className="font-semibold">{stats.totalCentros}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Empleadores</span><span className="font-semibold">{stats.totalEmpleadores}</span></div>
                 <div className="flex gap-2 pt-2">
                    {/* Botones con estilo unificado */}
                    <CreateCentroDialog onSuccess={handleSuccess}>
                        <Button variant="outline" className="flex-1"><Plus className="mr-2 h-4 w-4" /> Centro</Button>
                    </CreateCentroDialog>
                    <CreateEmpleadorDialog />
                </div>
            </div>
        </ActionCard>

        <ActionCard
            icon={BookOpen}
            title="Documentos de Apoyo"
            description="Gestiona reglamentos, guías y formatos."
            link="/coordinador/documentos"
        >
             <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Documentos Subidos</span><span className="font-semibold">{stats.documentosSubidos}</span></div>
             </div>
        </ActionCard>

        <ActionCard
            icon={Archive}
            title="Repositorio de Informes"
            description="Consulta el historial de informes de prácticas."
            link="/coordinador/repositorio-informes"
        />

        <ActionCard
            icon={Users}
            title="Gestión de Usuarios"
            description="Consulta usuarios y sus claves iniciales."
            link="/coordinador/usuarios"
        />
      </div>
    </div>
  );
}


// Componente Skeleton para el estado de carga
const DashboardSkeleton = () => (
    <div className="space-y-8">
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-56 w-full rounded-lg" />
            <Skeleton className="h-56 w-full rounded-lg" />
            <Skeleton className="h-56 w-full rounded-lg" />
            <Skeleton className="h-56 w-full rounded-lg" />
            <Skeleton className="h-56 w-full rounded-lg" />
            <Skeleton className="h-56 w-full rounded-lg" />
        </div>
    </div>
);