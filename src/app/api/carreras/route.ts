import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyUserSession } from '@/lib/auth';

export async function GET() {
  try {
    // 1. Verificar autenticación
    const user = await verifyUserSession();
    if (!user || !['COORDINADOR', 'DIRECTOR_CARRERA', 'SUPER_ADMIN'].includes(user.rol)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Aplicar restricciones por sede para DC y Coordinador
    const aplicarFiltroSede = ['COORDINADOR', 'DIRECTOR_CARRERA'].includes(user.rol) && user.sedeId !== null && user.sedeId !== undefined;
    const whereClause = {
      estado: 'ACTIVO' as const,
      ...(aplicarFiltroSede ? { sedeId: user.sedeId! } : {})
    };

    // 2. Obtener carreras activas - Restringidas por sede si corresponde
    const carreras = await prisma.carrera.findMany({
      where: whereClause,
      select: {
        id: true,
        nombre: true,
        sedeId: true,
        sede: {
          select: {
            nombre: true
          }
        }
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
