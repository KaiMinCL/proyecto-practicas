import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserSession();
    if (!user || !['SUPER_ADMIN', 'DIRECTOR_CARRERA'].includes(user.rol)) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limite') || '10');
    const skip = (page - 1) * limit;

    const where: any = {
      informeUrl: { not: null },
      estado: { in: ['EVALUACION_COMPLETA', 'CERRADA'] }
    };

    // --- LÓGICA DE FILTROS CORREGIDA ---
    const sedeId = searchParams.get('sedeId');
    const carreraId = searchParams.get('carreraId');
    const anioAcademico = searchParams.get('anioAcademico');
    const searchTerm = searchParams.get('nombreAlumno'); // Unificado para nombre y RUT

    if (sedeId) {
      where.carrera = { ...where.carrera, sedeId: parseInt(sedeId) };
    }
    if (carreraId) {
      where.carreraId = parseInt(carreraId);
    }
    if (anioAcademico) {
      const anio = parseInt(anioAcademico);
      where.fechaTermino = {
        gte: new Date(`${anio}-01-01T00:00:00.000Z`),
        lt: new Date(`${anio + 1}-01-01T00:00:00.000Z`),
      };
    }
    if (searchTerm) {
      where.alumno = {
        usuario: {
          OR: [
            { nombre: { contains: searchTerm, mode: 'insensitive' } },
            { apellido: { contains: searchTerm, mode: 'insensitive' } },
            { rut: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      };
    }
    
    const [informes, total] = await prisma.$transaction([
      prisma.practica.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaTermino: 'desc' },
        select: {
          id: true,
          informeUrl: true,
          fechaTermino: true,
          tipo: true,
          alumno: { select: { usuario: { select: { nombre: true, apellido: true, rut: true } } } },
          carrera: { select: { id: true, nombre: true, sede: { select: { id: true, nombre: true } } } },
          docente: { select: { usuario: { select: { nombre: true, apellido: true } } } },
          evaluacionDocente: { select: { nota: true, fecha: true } }
        }
      }),
      prisma.practica.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        informes,
        total,
        totalPaginas: Math.ceil(total / limit),
        paginaActual: page,
      }
    });

  } catch (error) {
    console.error('Error fetching repositorio informes:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 });
  }
}