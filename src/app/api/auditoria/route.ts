import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { AuditoriaService } from '@/lib/services/auditoria';
import { z } from 'zod';

// Schema para filtros de consulta
const consultaAuditoriaSchema = z.object({
  entidad: z.string().optional(),
  entidadId: z.string().optional(),
  usuarioId: z.coerce.number().optional(),
  accion: z.string().optional(),
  fechaDesde: z.string().optional().transform(val => val ? new Date(val) : undefined),
  fechaHasta: z.string().optional().transform(val => val ? new Date(val) : undefined),
  limit: z.coerce.number().min(1).max(500).default(50),
  offset: z.coerce.number().min(0).default(0)
});

export async function GET(request: NextRequest) {
  try {
    const session = await getUserSession();
    
    // Verificar autenticación
    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo usuarios con roles administrativos pueden consultar auditoría
    if (!['DIRECTOR_CARRERA', 'COORDINADOR', 'SUPER_ADMIN'].includes(session.rol)) {
      return NextResponse.json(
        { error: 'No tiene permisos para consultar la auditoría' }, 
        { status: 403 }
      );
    }

    // Parsear parámetros de consulta
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    
    const validationResult = consultaAuditoriaSchema.safeParse(queryParams);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Parámetros inválidos',
          details: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    const filtros = validationResult.data;

    // Obtener historial de auditoría
    const logs = await AuditoriaService.obtenerHistorial(filtros);

    // Contar total para paginación
    const total = await AuditoriaService.contarLogs({
      entidad: filtros.entidad,
      entidadId: filtros.entidadId,
      usuarioId: filtros.usuarioId,
      accion: filtros.accion,
      fechaDesde: filtros.fechaDesde,
      fechaHasta: filtros.fechaHasta
    });

    return NextResponse.json({
      logs,
      pagination: {
        total,
        limit: filtros.limit,
        offset: filtros.offset,
        hasMore: (filtros.offset + filtros.limit) < total
      }
    });

  } catch (error) {
    console.error('Error al consultar auditoría:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}
