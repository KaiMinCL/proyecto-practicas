import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyUserSession } from '@/lib/auth';

export async function GET() {
  try {
    // 1. Verificar autenticación
    const user = await verifyUserSession();
    if (!user || user.rol !== 'SUPER_ADMIN') {
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

export async function PATCH(request: Request) {
  try {
    const user = await verifyUserSession();
    if (!user || user.rol !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id, estado } = await request.json();
    if (!id || !['ACTIVO', 'INACTIVO'].includes(estado)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    await prisma.usuario.update({
      where: { id },
      data: { estado },
    });

    return NextResponse.json({ success: true, message: `Usuario ${estado === 'ACTIVO' ? 'activado' : 'desactivado'} exitosamente.` });
  } catch (error) {
    console.error('Error al actualizar estado de usuario:', error);
    return NextResponse.json({ error: 'Error al actualizar estado de usuario' }, { status: 500 });
  }
}