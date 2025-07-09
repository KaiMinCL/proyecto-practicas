import { NextRequest, NextResponse } from 'next/server';
import { ReporteEstadoFinalizacionService } from '@/lib/services/reporteEstadoFinalizacionService';
import { verifyUserSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await verifyUserSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar permisos
    if (!['SUPER_ADMIN', 'DIRECTOR_CARRERA'].includes(user.rol)) {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para acceder a este reporte' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parsear filtros
    const filtros = {
      fechaDesde: searchParams.get('fechaDesde') 
        ? new Date(searchParams.get('fechaDesde')!) 
        : undefined,
      fechaHasta: searchParams.get('fechaHasta') 
        ? new Date(searchParams.get('fechaHasta')!) 
        : undefined,
      sedeId: searchParams.get('sedeId') 
        ? parseInt(searchParams.get('sedeId')!) 
        : undefined,
      carreraId: searchParams.get('carreraId') 
        ? parseInt(searchParams.get('carreraId')!) 
        : undefined,
    };

    // Obtener datos del reporte
    const resultado = await ReporteEstadoFinalizacionService.getEstadoFinalizacion(
      filtros,
      user.rol,
      user.sedeId || null
    );

    if (!resultado.success) {
      return NextResponse.json(resultado, { status: 400 });
    }

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error en endpoint estado finalización:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
