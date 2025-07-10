import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AccionAuditoria } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const session = await getUserSession();
    if (session?.rol !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const skip = (page - 1) * limit;

    // Construcción de filtros
    const where: any = {};
    if (searchParams.get('usuario')) {
      where.usuario = {
        OR: [
          { nombre: { contains: searchParams.get('usuario'), mode: 'insensitive' } },
          { apellido: { contains: searchParams.get('usuario'), mode: 'insensitive' } },
          { rut: { contains: searchParams.get('usuario'), mode: 'insensitive' } },
        ],
      };
    }
    if (searchParams.get('accion')) {
      where.accion = searchParams.get('accion') as AccionAuditoria;
    }
    if (searchParams.get('entidad')) {
      where.entidad = { contains: searchParams.get('entidad'), mode: 'insensitive' };
    }
     if (searchParams.get('fechaDesde')) {
      where.fecha = { ...where.fecha, gte: new Date(searchParams.get('fechaDesde')!) };
    }
    if (searchParams.get('fechaHasta')) {
      where.fecha = { ...where.fecha, lte: new Date(searchParams.get('fechaHasta')!) };
    }


    const [logs, total] = await prisma.$transaction([
      prisma.logAuditoria.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          fecha: 'desc',
        },
        include: {
          usuario: {
            select: {
              nombre: true,
              apellido: true,
              rut: true,
            },
          },
        },
      }),
      prisma.logAuditoria.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        total,
        paginaActual: page,
        totalPaginas: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}