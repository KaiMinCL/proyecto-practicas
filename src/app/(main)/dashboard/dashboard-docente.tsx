import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DocumentosView } from '@/components/custom/DocumentosView';

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
  centroPractica?: {
    nombreEmpresa?: string;
  };
}

interface DashboardDocenteProps {
  user: any;
}

export function DashboardDocente({ user }: DashboardDocenteProps) {
  const [practicas, setPracticas] = useState<Practica[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPracticas = async () => {
      setLoading(true);
      const res = await fetch('/api/docente/practicas');
      const data = await res.json();
      if (data.success) {
        setPracticas(data.data);
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

      {/* Manejo de estudiantes y prácticas */}
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
