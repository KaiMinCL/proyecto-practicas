import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyUserSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 1. Verificar autenticación
    const user = await verifyUserSession();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = parseInt(params.userId);

    // 2. Verificar que el usuario solo pueda acceder a su propia información o que sea admin
    if (user.userId !== userId && user.rol !== 'SA' && user.rol !== 'Coordinador') {
      return NextResponse.json(
        { error: 'No autorizado para acceder a esta información' },
        { status: 403 }
      );
    }

    // 3. Buscar el empleador asociado al usuario
    const empleador = await prisma.empleador.findUnique({
      where: {
        usuarioId: userId
      },
      select: {
        id: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        }
      }
    });

    if (!empleador) {
      return NextResponse.json(
        { error: 'Empleador no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(empleador);

  } catch (error) {
    console.error('Error al obtener empleador por userId:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
