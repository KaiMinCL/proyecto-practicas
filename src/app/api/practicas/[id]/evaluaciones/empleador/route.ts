import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getUserSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const practicaId = parseInt(id);
    if (isNaN(practicaId)) {
      return NextResponse.json(
        { error: 'ID de práctica inválido' }, 
        { status: 400 }
      );
    }

    // Verificar que la práctica existe
    const practica = await prisma.practica.findUnique({
      where: { id: practicaId },
      include: {
        alumno: {
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
            nombreEmpresa: true
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
    if (session.rol === 'DOCENTE' && practica.docenteId !== session.userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta evaluación' }, 
        { status: 403 }
      );
    }

    // Buscar la evaluación del empleador
    const evaluacion = await prisma.evaluacionEmpleador.findUnique({
      where: { practicaId }
    });

    if (!evaluacion) {
      return NextResponse.json(
        { error: 'Evaluación del empleador no encontrada' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({
      evaluacion,
      practica: {
        id: practica.id,
        alumno: practica.alumno,
        centroPractica: practica.centroPractica,
        estado: practica.estado
      }
    });

  } catch (error) {
    console.error('Error al obtener evaluación del empleador:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}