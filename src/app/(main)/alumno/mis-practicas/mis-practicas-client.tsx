"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Info, GraduationCap, User } from 'lucide-react';

import type { PracticaConDetalles } from '@/lib/validators/practica';
import { ActionResponse } from '../practicas/actions';
import { PracticaCard } from '@/components/custom/PracticaCard';

interface MisPracticasClienteProps {
  initialActionResponse: ActionResponse<PracticaConDetalles[]>;
}

export function MisPracticasCliente({ initialActionResponse }: MisPracticasClienteProps) {
  const [practicas] = React.useState<PracticaConDetalles[]>(initialActionResponse.data || []);
  const [error] = React.useState<string | null>(initialActionResponse.error || null);

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error al Cargar Prácticas</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (practicas.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="w-12 h-12 text-primary" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-3">
          No tienes prácticas asignadas
        </h3>
        <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed mb-6">
          Cuando tu coordinador inicie el registro de una práctica para ti, aparecerá aquí para que puedas completar la información requerida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          <Button asChild>
            <Link href="/dashboard">
              <Info className="mr-2 h-4 w-4" />
              Ir al Dashboard
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/perfil">
              <User className="mr-2 h-4 w-4" />
              Ver Mi Perfil
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {practicas.map((practica) => (
        <PracticaCard key={practica.id} practica={practica} />
      ))}
    </div>
  );
}