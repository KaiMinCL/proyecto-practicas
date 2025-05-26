import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyUserSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verificar autenticación
    const user = await verifyUserSession();
    if (!user || user.rol !== 'SA') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 2. Obtener usuario por ID con sus relaciones
    const usuario = await prisma.usuario.findUnique({
      where: {
        id: parseInt(params.id),
      },
      select: {
        id: true,
        rut: true,
        nombre: true,
        apellido: true,
        email: true,
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
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(usuario);

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {    
    // 1. Verificar autenticación
    const user = await verifyUserSession();
    if (!user || user.rol !== 'SA') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 2. Obtener datos del body
    const data = await req.json();

    // 3. Actualizar usuario
    const usuario = await prisma.usuario.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        rol: {
          connect: {
            nombre: data.rol
          }
        },
        sede: {
          connect: {
            id: data.sedeId
          }
        }
      },
      include: {
        rol: true,
        sede: true,
      }
    });

    return NextResponse.json(usuario);

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}