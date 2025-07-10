import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Practica {
  id: number;
  estado: string;
  alumno: {
    usuario: {
      nombre: string;
      apellido: string;
      rut: string;
      email: string;
      estado: string;
    };
    carrera: {
      nombre: string;
    };
  };
}

interface DashboardDocenteProps {
  user: any;
}

export function DashboardDocente({ user }: DashboardDocenteProps) {
  const [practicas, setPracticas] = useState<Practica[]>([]);
  const [pendientes, setPendientes] = useState<Practica[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPracticas = async () => {
      setLoading(true);
      const res = await fetch('/api/docente/practicas');
      const data = await res.json();
      if (data.success) {
        setPracticas(data.data);
        setPendientes(data.data.filter((p: Practica) => p.estado === 'PENDIENTE_ACEPTACION_DOCENTE'));
      }
      setLoading(false);
    };
    fetchPracticas();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">¡Bienvenido, {user.nombre} {user.apellido}!</h1>
        <p className="text-white/90">Panel de gestión de prácticas asignadas y estudiantes</p>
      </div>

      {pendientes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Prácticas pendientes de aceptación
            </CardTitle>
            <CardDescription>
              Tienes {pendientes.length} práctica(s) que requieren tu aceptación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-6">
              {pendientes.map((p) => (
                <li key={p.id}>
                  {p.alumno.usuario.nombre} {p.alumno.usuario.apellido} ({p.alumno.usuario.rut}) - {p.alumno.carrera.nombre}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Prácticas asignadas y mis estudiantes
            </CardTitle>
            <CardDescription>
              Gestiona y evalúa a tus estudiantes desde aquí
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/docente/practicas">Ver prácticas y estudiantes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
