import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyUserSession } from '@/lib/auth';

export async function GET() {
  try {
    // 1. Verificar autenticación
    const user = await verifyUserSession();
    if (!user || (user.rol !== 'COORDINADOR' && user.rol !== 'DIRECTOR_CARRERA' && user.rol !== 'DIRECTOR')) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Determinar filtro: si es director, filtrar por carrera; si es coordinador, por sede
    let where = {};
    if (user.rol === 'DIRECTOR_CARRERA' || user.rol === 'DIRECTOR') {
      if (!user.carreraId) {
        return NextResponse.json(
          { success: false, error: 'Director sin carrera asignada' },
          { status: 400 }
        );
      }
      where = { carreraId: user.carreraId };
    } else if (user.rol === 'COORDINADOR') {
      if (!user.sedeId) {
        return NextResponse.json(
          { success: false, error: 'Coordinador sin sede asignada' },
          { status: 400 }
        );
      }
      where = { carrera: { sedeId: user.sedeId } };
    }

    // 2. Obtener alumnos con sus relaciones
    const alumnos = await prisma.alumno.findMany({
      where,
      select: {
        id: true,
        fotoUrl: true,
        usuario: {
          select: {
            rut: true,
            nombre: true,
            apellido: true,
            email: true,
            estado: true,
          }
        },
        carrera: {
          select: {
            id: true,
            nombre: true,
            sede: { select: { nombre: true } },
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
    const data = alumnos.map(alumno => ({
      value: alumno.id,
      rut: alumno.usuario.rut,
      nombreCompleto: `${alumno.usuario.nombre} ${alumno.usuario.apellido}`,
      carreraId: alumno.carrera.id,
      carreraNombre: alumno.carrera.nombre,
      sedeNombreDeCarrera: alumno.carrera.sede.nombre,
      fotoUrl: alumno.fotoUrl || undefined,
      estado: alumno.usuario.estado,
    }));

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Error al obtener alumnos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener alumnos' },
      { status: 500 }
    );
  }
}
