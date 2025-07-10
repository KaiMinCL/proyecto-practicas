import { redirect } from 'next/navigation';
import { getUserSession } from '@/lib/auth';
import type { RoleName } from '@/types/roles';
import { getMisPracticasAction, type ActionResponse } from '../practicas/actions'; 
import type { PracticaConDetalles } from '@/lib/validators/practica';
import { PracticasDocenteCliente } from './practicas-docente-client';
import { BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const REQUIRED_ROLE: RoleName = 'DOCENTE';

interface Practica {
  id: number;
  estado: string;
  alumno?: {
    usuario?: {
      nombre?: string;
      apellido?: string;
      rut?: string;
      email?: string;
      estado?: string;
    };
    carrera?: {
      nombre?: string;
    };
  };
  carrera?: {
    nombre?: string;
  };
  fechaInicio?: string;
  fechaTermino?: string;
}

export default async function PracticasDocentePage() {
  const userPayload = await getUserSession();

  if (!userPayload) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const loginUrl = new URL('/login', baseUrl);
    redirect(loginUrl.toString());
  }

  if (userPayload.rol !== REQUIRED_ROLE) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const dashboardUrl = new URL('/dashboard', baseUrl);
    redirect(dashboardUrl.toString());
  }

  const result: ActionResponse<PracticaConDetalles[]> = await getMisPracticasAction();

  return <PracticasDocenteCliente initialActionResponse={result} user={userPayload} />;
}
