import { NextResponse } from 'next/server';
import { authorizeDocente } from '@/lib/auth/checkRole';
import prismaClient from '@/lib/prisma';
import { EstadoPractica as PrismaEstadoPracticaEnum } from '@prisma/client';

export async function GET() {
  try {
    const userPayload = await authorizeDocente();
    const docente = await prismaClient.docente.findUnique({
      where: { usuarioId: userPayload.userId },
      select: { id: true }
    });
    if (!docente) {
      return NextResponse.json({ alertas: [], practicasPendientesAceptar: 0 });
    }

    // Prácticas pendientes de aceptación
    const countPendientes = await prismaClient.practica.count({
      where: {
        docenteId: docente.id,
        estado: PrismaEstadoPracticaEnum.PENDIENTE_ACEPTACION_DOCENTE
      }
    });
    // Prácticas en curso sin informe evaluado
    const practicasEnCurso = await prismaClient.practica.findMany({
      where: {
        docenteId: docente.id,
        estado: PrismaEstadoPracticaEnum.EN_CURSO,
        informeUrl: { not: null },
        evaluacionDocente: null
      }
    });
    // Prácticas finalizadas pendientes de evaluación
    const practicasFinalizadasPendEval = await prismaClient.practica.findMany({
      where: {
        docenteId: docente.id,
        estado: PrismaEstadoPracticaEnum.FINALIZADA_PENDIENTE_EVAL,
        evaluacionDocente: null
      }
    });
    // Notificaciones
    const alertas = [];
    if (countPendientes > 0) {
      alertas.push({
        id: 'pendientes',
        type: 'warning',
        title: 'Prácticas por aceptar o cancelar',
        description: `Tienes ${countPendientes} prácticas que requieren tu decisión`,
        count: countPendientes
      });
    }
    if (practicasEnCurso.length > 0) {
      alertas.push({
        id: 'en-curso',
        type: 'info',
        title: 'Informes para evaluar',
        description: `Tienes ${practicasEnCurso.length} prácticas en curso con informe para evaluar`,
        count: practicasEnCurso.length
      });
    }
    if (practicasFinalizadasPendEval.length > 0) {
      alertas.push({
        id: 'finalizadas',
        type: 'info',
        title: 'Prácticas finalizadas pendientes de evaluación',
        description: `Tienes ${practicasFinalizadasPendEval.length} prácticas finalizadas que requieren evaluación`,
        count: practicasFinalizadasPendEval.length
      });
    }
    return NextResponse.json({ alertas });
  } catch (error) {
    return NextResponse.json({ alertas: [], practicasPendientesAceptar: 0 }, { status: 401 });
  }
}
