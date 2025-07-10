"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Info, User, GraduationCap, BookOpen, Calendar, Building, FileText, ClipboardCheck, Star, CheckCircle2 } from 'lucide-react';
import type { PracticaConDetalles } from '@/lib/validators/practica';
import Link from 'next/link';

interface PracticaDetalleDocenteProps {
  practica: PracticaConDetalles;
}

export function PracticaDetalleDocente({ practica }: PracticaDetalleDocenteProps) {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <User className="w-6 h-6 text-primary" />
            {practica.alumno?.usuario.nombre} {practica.alumno?.usuario.apellido}
            <Badge className="ml-2">{practica.alumno?.usuario.rut}</Badge>
          </CardTitle>
          <CardDescription>
            <div className="flex flex-wrap gap-4 mt-2">
              <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4" />{practica.carrera?.nombre}</span>
              <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" />{practica.tipo === 'LABORAL' ? 'Laboral' : 'Profesional'}</span>
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4" />{format(new Date(practica.fechaInicio), 'dd/MM/yyyy', { locale: es })}</span>
              {practica.centroPractica?.nombreEmpresa && (
                <span className="flex items-center gap-2"><Building className="w-4 h-4" />{practica.centroPractica.nombreEmpresa}</span>
              )}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado y acciones principales */}
          <div className="flex items-center gap-3">
            <Badge variant="outline">Estado: {practica.estado}</Badge>
            {/* Acciones según estado */}
            {practica.estado === 'PENDIENTE_ACEPTACION_DOCENTE' && (
              <Button asChild variant="default">
                <Link href={`/docente/practicas-pendientes/${practica.id}/revisar-acta`}><ClipboardCheck className="mr-2 h-4 w-4" />Revisar y Decidir Acta 1</Link>
              </Button>
            )}
            {practica.estado === 'EN_CURSO' && practica.informeUrl && (
              <Button asChild variant="default">
                <Link href={`/docente/practicas/${practica.id}/evaluar-informe`}><FileText className="mr-2 h-4 w-4" />Evaluar Informe</Link>
              </Button>
            )}
            {practica.estado === 'FINALIZADA_PENDIENTE_EVAL' && (
              <Button asChild variant="default">
                <Link href={`/docente/practicas/${practica.id}/evaluar-informe`}><FileText className="mr-2 h-4 w-4" />Evaluar Informe</Link>
              </Button>
            )}
            {practica.estado === 'EVALUACION_COMPLETA' && practica.evaluacionDocente && practica.evaluacionEmpleador && (
              <Button asChild variant="default">
                <Link href={`/docente/practicas/${practica.id}/acta-final`}><CheckCircle2 className="mr-2 h-4 w-4" />Generar Acta Final</Link>
              </Button>
            )}
          </div>

          {/* Información detallada */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Info className="w-4 h-4" />
              <span>RUT: {practica.alumno?.usuario.rut}</span>
            </div>
            {practica.centroPractica?.nombreEmpresa && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building className="w-4 h-4" />
                <span>Empresa: {practica.centroPractica.nombreEmpresa}</span>
              </div>
            )}
            {practica.informeUrl && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="w-4 h-4" />
                <a href={practica.informeUrl} target="_blank" rel="noopener noreferrer" className="underline">Descargar informe</a>
              </div>
            )}
            {practica.evaluacionDocente && (
              <div className="flex items-center gap-2 text-green-700">
                <Star className="w-4 h-4" />
                <span>Evaluación Docente: {practica.evaluacionDocente.nota}</span>
              </div>
            )}
            {practica.evaluacionEmpleador && (
              <div className="flex items-center gap-2 text-purple-700">
                <Building className="w-4 h-4" />
                <span>Evaluación Empleador: {practica.evaluacionEmpleador.nota}</span>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/docente/practicas/${practica.id}/ver-evaluacion-empleador`}>Ver Detalle</Link>
                </Button>
              </div>
            )}
            {practica.actaFinal && (
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>Acta Final: Nota {practica.actaFinal.notaFinal.toFixed(1)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
