import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getUserSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const practicaId = parseInt(params.id);
    if (isNaN(practicaId)) {
      return NextResponse.json(
        { error: 'ID de práctica inválido' }, 
        { status: 400 }
      );
    }

    // Obtener la práctica con información relacionada
    const practica = await prisma.practica.findUnique({
      where: { id: practicaId },
      include: {
        alumno: {
          include: {
            usuario: {
              select: {
                nombre: true,
                apellido: true,
                email: true
              }
            },
            carrera: {
              select: {
                nombre: true
              }
            }
          }
        },
        docente: {
          include: {
            usuario: {
              select: {
                nombre: true,
                apellido: true
              }
            }
          }
        },
        centroPractica: {
          select: {
            nombreEmpresa: true,
            direccion: true
          }
        }
      }
    });

    if (!practica) {
      return NextResponse.json(
        { error: 'Práctica no encontrada' }, 
        { status: 404 }
      );
    }

    // Verificar permisos según rol
    switch (session.rol) {
      case 'DOCENTE':
        if (practica.docenteId !== session.userId) {
          return NextResponse.json(
            { error: 'No tienes permisos para ver esta práctica' }, 
            { status: 403 }
          );
        }
        break;
      case 'ALUMNO':
        if (practica.alumnoId !== session.userId) {
          return NextResponse.json(
            { error: 'No tienes permisos para ver esta práctica' }, 
            { status: 403 }
          );
        }
        break;
      case 'COORDINADOR':
      case 'DIRECTOR':
        // Los coordinadores y directores pueden ver todas las prácticas de su sede
        // Esta lógica se puede expandir según sea necesario
        break;
      default:
        return NextResponse.json(
          { error: 'Rol no autorizado' }, 
          { status: 403 }
        );
    }

    return NextResponse.json(practica);

  } catch (error) {
    console.error('Error al obtener práctica:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}