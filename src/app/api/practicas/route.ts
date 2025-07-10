import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyUserSession } from '@/lib/auth';

export async function GET(request: { nextUrl: any; url: string | URL; }) {
  try {
    // Verificar autenticación
    const session = await verifyUserSession();
    if (!session || (session.rol !== 'DIRECTOR_CARRERA' && session.rol !== 'DIRECTOR' && session.rol !== 'COORDINADOR')) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    // Obtener carreraId del query o del usuario
    const url = request?.nextUrl || request.url ? new URL(request.url, 'http://localhost') : undefined;
    const carreraId = url?.searchParams.get('carreraId') || session.carreraId;

    // Filtrar por carreraId
    const where = carreraId ? { carreraId: parseInt(carreraId) } : {};

    const practicas = await prisma.practica.findMany({
      where,
      include: {
        alumno: { include: { usuario: true } },
        carrera: true,
        docente: { include: { usuario: true } },
      },
      orderBy: { fechaInicio: 'desc' },
    });

    return NextResponse.json({ success: true, data: practicas });
  } catch (error) {
    console.error('Error al obtener prácticas:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}