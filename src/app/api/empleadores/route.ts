import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyUserSession } from '@/lib/auth';

export async function GET() {
  try {
    // 1. Verificar autenticación
    const user = await verifyUserSession();
    if (!user || user.rol !== 'COORDINADOR') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }    

    // 2. Obtener empleadores con sus relaciones
    const empleadores = await prisma.empleador.findMany({
      select: {
        id: true,
        usuario: {
          select: {
            rut: true,
            nombre: true,
            apellido: true,
            email: true,
            estado: true,
            claveInicialVisible: true
          }
        },
        centros: {
          select: {
            centroPractica: {
              select: {
                nombreEmpresa: true,
                direccion: true
              }
            }
          }
        }
      },
      orderBy: {
        usuario: {
          apellido: 'asc',
        }
      },
    });

    // 3. Transformar datos para el frontend
    const transformedEmpleadores = empleadores.map(empleador => ({
      id: empleador.id,
      rut: empleador.usuario.rut,
      nombre: empleador.usuario.nombre,
      apellido: empleador.usuario.apellido,
      email: empleador.usuario.email,
      estado: empleador.usuario.estado,
      claveInicialVisible: empleador.usuario.claveInicialVisible,
      centros: empleador.centros.map(c => ({
        nombreEmpresa: c.centroPractica.nombreEmpresa,
        direccion: c.centroPractica.direccion
      }))
    }));

    return NextResponse.json(transformedEmpleadores);

  } catch (error) {
    console.error('Error al obtener empleadores:', error);
    return NextResponse.json(
      { error: 'Error al obtener empleadores' },
      { status: 500 }
    );
  }
}
