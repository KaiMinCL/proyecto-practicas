import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyUserSession } from '@/lib/auth';

export async function GET() {
  try {
    // 1. Verificar autenticación
    const user = await verifyUserSession();
    if (!user || user.rol !== 'Coordinador') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 2. Obtener carreras activas
    const carreras = await prisma.carrera.findMany({
      where: {
        estado: 'ACTIVO'
      },
      select: {
        id: true,
        nombre: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return NextResponse.json(carreras);

  } catch (error) {
    console.error('Error al obtener carreras:', error);
    return NextResponse.json(
      { error: 'Error al obtener carreras' },
      { status: 500 }
    );
  }
}
