import { NextRequest, NextResponse } from 'next/server';
import { ReporteNominaAlumnosService } from '@/lib/services/reporteNominaAlumnosService';
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
    if (!['DIRECTOR_CARRERA', 'COORDINADOR'].includes(user.rol)) {
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
      estado: searchParams.get('estado') || undefined,
    };

    // Obtener datos del reporte
    const resultado = await ReporteNominaAlumnosService.getNominaAlumnos(
      filtros,
      user.rol,
      user.sedeId || null
    );

    if (!resultado.success || !resultado.data) {
      return NextResponse.json(
        { success: false, error: 'Error al obtener datos para exportar' },
        { status: 400 }
      );
    }

    // Generar CSV
    const csvContent = await ReporteNominaAlumnosService.exportarCSV(resultado.data);

    // Crear nombre del archivo con fecha
    const fecha = new Date().toISOString().split('T')[0];
    const filename = `nomina-alumnos-practica-${fecha}.csv`;

    // Retornar archivo CSV
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error en exportación CSV nómina alumnos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al exportar el reporte' },
      { status: 500 }
    );
  }
}
