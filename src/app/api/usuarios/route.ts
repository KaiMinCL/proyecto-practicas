import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyUserSession } from '@/lib/auth';

export async function GET() {
  try {
    // 1. Verificar autenticación
    const user = await verifyUserSession();
    if (!user || user.rol !== 'SA') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 2. Obtener usuarios con sus relaciones
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,        
        rut: true,
        nombre: true,
        apellido: true,
        email: true,
        estado: true,
        rol: {
          select: {
            nombre: true,
          },
        },
        sede: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        apellido: 'asc',
      },
    });

    return NextResponse.json(usuarios);

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}