import { NextResponse } from 'next/server';
import { verifyUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Devuelve todas las prácticas asignadas al docente autenticado (incluye alumno y estado)
export async function GET() {
  try {
    const user = await verifyUserSession();
    if (!user || user.rol !== 'DOCENTE') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
    }

    // Buscar el id del docente
    const docente = await prisma.docente.findUnique({
      where: { usuarioId: user.userId },
      select: { id: true }
    });
    if (!docente) {
      return NextResponse.json({ success: false, error: 'Docente no encontrado' }, { status: 404 });
    }

    // Prácticas asignadas al docente
    const practicas = await prisma.practica.findMany({
      where: { docenteId: docente.id },
      include: {
        alumno: {
          include: {
            usuario: true,
            carrera: true
          }
        },
        carrera: true,
        centroPractica: true,
        evaluacionDocente: true,
        evaluacionEmpleador: true,
        actaFinal: true
      },
      orderBy: { fechaInicio: 'desc' }
    });

    return NextResponse.json({ success: true, data: practicas });
  } catch (error) {
    console.error('Error al obtener prácticas del docente:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}
