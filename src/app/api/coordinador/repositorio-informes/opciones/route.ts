import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (user.rol !== 'COORDINADOR') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener sedes disponibles para el coordinador
    const sedesWhere = user.sedeId ? { id: user.sedeId } : {};
    
    const sedes = await prisma.sede.findMany({
      where: sedesWhere,
      select: {
        id: true,
        nombre: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // Obtener carreras disponibles para el coordinador
    const carreras = await prisma.carrera.findMany({
      where: {
        ...(user.sedeId && { sedeId: user.sedeId })
      },
      select: {
        id: true,
        nombre: true,
        sedeId: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // Obtener años académicos disponibles basados en las prácticas con informes
    const practicasConInformes = await prisma.practica.findMany({
      where: {
        informeUrl: {
          not: null
        },
        ...(user.sedeId && {
          alumno: {
            carrera: {
              sedeId: user.sedeId
            }
          }
        })
      },
      select: {
        fechaTermino: true
      }
    });

    const aniosDisponibles = Array.from(
      new Set(
        practicasConInformes.map(practica => 
          new Date(practica.fechaTermino).getFullYear()
        )
      )
    ).sort((a, b) => b - a);

    return NextResponse.json({
      sedes,
      carreras,
      aniosDisponibles
    });

  } catch (error) {
    console.error('Error al obtener opciones de filtros:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
