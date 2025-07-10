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
    const count = await prismaClient.practica.count({
      where: {
        docenteId: docente.id,
        estado: PrismaEstadoPracticaEnum.PENDIENTE_ACEPTACION_DOCENTE
      }
    });
    const alertas = count > 0 ? [{
      id: '1',
      type: 'warning',
      title: 'Prácticas por aceptar o cancelar',
      description: `Tienes ${count} prácticas que requieren tu decisión`,
      count
    }] : [];
    return NextResponse.json({ alertas, practicasPendientesAceptar: count });
  } catch (error) {
    return NextResponse.json({ alertas: [], practicasPendientesAceptar: 0 }, { status: 401 });
  }
}
