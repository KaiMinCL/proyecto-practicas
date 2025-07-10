import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getUserSession();
    if (!session || !['SUPER_ADMIN', 'DIRECTOR_CARRERA'].includes(session.rol)) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
    }

    const sedesPromise = prisma.sede.findMany({
      where: { estado: 'ACTIVO' },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });

    const carrerasPromise = prisma.carrera.findMany({
      where: { estado: 'ACTIVO' },
      select: { id: true, nombre: true, sedeId: true },
      orderBy: { nombre: 'asc' },
    });

    const aniosResultPromise = prisma.practica.findMany({
      where: { fechaTermino: { not: undefined } },
      select: { fechaTermino: true },
      distinct: ['fechaTermino'],
    });

    const [sedes, carreras, aniosResult] = await Promise.all([sedesPromise, carrerasPromise, aniosResultPromise]);

    const aniosDisponibles = [
        ...new Set(aniosResult.map(p => new Date(p.fechaTermino!).getFullYear()))
    ].sort((a, b) => b - a);

    return NextResponse.json({
      success: true,
      data: { sedes, carreras, aniosDisponibles },
    });

  } catch (error) {
    console.error('Error fetching repository options:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}