import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Users, GraduationCap, Building, Calendar, BadgeCheck, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DocumentosView } from '@/components/custom/DocumentosView';

interface Estudiante {
  id: number;
  usuario: {
    nombre: string;
    apellido: string;
    rut: string;
    email: string;
  };
  carrera: {
    nombre: string;
    sede: { nombre: string };
  };
  practicas: Practica[];
  estadoActual: string;
  fechaUltimaPractica: string;
  totalPracticas: number;
}

interface Practica {
  id: number;
  tipo: string;
  estado: string;
  fechaInicio: string;
  fechaTermino: string;
  centroPractica?: { nombreEmpresa?: string };
}

interface Estadisticas {
  totalEstudiantes: number;
  estudiantesActivos: number;
  estudiantesFinalizados: number;
  totalPracticas: number;
  practicasEnCurso: number;
  practicasPendientes: number;
}

interface DashboardDocenteProps {
  user: any;
}

export function DashboardDocente({ user }: DashboardDocenteProps) {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEstudiantes = async () => {
      setLoading(true);
      const res = await fetch('/api/docente/estudiantes');
      const data = await res.json();
      if (data.success) {
        setEstudiantes(data.data.estudiantes);
        setEstadisticas(data.data.estadisticas);
      }
      setLoading(false);
    };
    fetchEstudiantes();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">¡Bienvenido, {user.nombre} {user.apellido}!</h1>
        <p className="text-white/90">Panel de gestión de prácticas y estudiantes supervisados</p>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Estudiantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{estadisticas.totalEstudiantes}</div>
              <p className="text-xs text-muted-foreground mt-1">Supervisados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{estadisticas.estudiantesActivos}</div>
              <p className="text-xs text-muted-foreground mt-1">En curso o pendientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Finalizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{estadisticas.estudiantesFinalizados}</div>
              <p className="text-xs text-muted-foreground mt-1">Prácticas cerradas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Prácticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{estadisticas.totalPracticas}</div>
              <p className="text-xs text-muted-foreground mt-1">Total asignadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">En Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{estadisticas.practicasEnCurso}</div>
              <p className="text-xs text-muted-foreground mt-1">Actualmente en curso</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{estadisticas.practicasPendientes}</div>
              <p className="text-xs text-muted-foreground mt-1">Por aceptar o iniciar</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de estudiantes y prácticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Estudiantes y Prácticas Asignadas
          </CardTitle>
          <CardDescription>
            Gestiona y evalúa a tus estudiantes directamente desde aquí
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground">Cargando estudiantes...</div>
          ) : estudiantes.length === 0 ? (
            <div className="text-center text-muted-foreground">No tienes estudiantes asignados actualmente.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Estudiante</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Carrera</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Centro de Práctica</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Estado</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantes.map(est => {
                    // Mostrar solo la práctica más reciente
                    const practica = est.practicas[0];
                    return (
                      <tr key={est.id} className="border-b">
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="font-medium">{est.usuario.nombre} {est.usuario.apellido}</div>
                          <div className="text-xs text-muted-foreground">{est.usuario.rut}</div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">{est.carrera.nombre}</td>
                        <td className="px-2 py-2 whitespace-nowrap">{practica?.centroPractica?.nombreEmpresa || 'Sin asignar'}</td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-muted text-foreground">
                            {practica?.estado}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/docente/practicas/${practica?.id}`}>Ver Detalle</Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentos de apoyo */}
      <div>
        <DocumentosView 
          filterByUserCarrera={true}
          maxItems={3}
          showViewAllButton={true}
        />
        <div className="mt-2 flex justify-end">
          <Button asChild size="sm" variant="link">
            <Link href="/docente/documentos">Ver todos los documentos</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
