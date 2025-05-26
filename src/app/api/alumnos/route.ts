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
    type AlumnoResponse = {
      id: number;
      rut: string;
      nombre: string;
      apellido: string;
      email: string;
      carrera: {
        nombre: string;
      };
    };

    // 2. Obtener alumnos con sus relaciones
    const alumnos = await prisma.alumno.findMany({
      select: {
        id: true,
        usuario: {
          select: {
            rut: true,
            nombre: true,
            apellido: true,
            email: true,
          }
        },
        carrera: {
          select: {
            nombre: true,
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
    const transformedAlumnos: AlumnoResponse[] = alumnos.map(alumno => ({
      id: alumno.id,
      rut: alumno.usuario.rut,
      nombre: alumno.usuario.nombre,
      apellido: alumno.usuario.apellido,
      email: alumno.usuario.email,
      carrera: alumno.carrera,
    }));

    return NextResponse.json(transformedAlumnos);

  } catch (error) {
    console.error('Error al obtener alumnos:', error);
    return NextResponse.json(
      { error: 'Error al obtener alumnos' },
      { status: 500 }
    );
  }
}
