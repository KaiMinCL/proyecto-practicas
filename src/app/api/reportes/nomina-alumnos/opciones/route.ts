import { NextResponse } from 'next/server';
import { ReporteNominaAlumnosService } from '@/lib/services/reporteNominaAlumnosService';
import { verifyUserSession } from '@/lib/auth';

export async function GET() {
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

    // Obtener opciones de filtros
    const resultado = await ReporteNominaAlumnosService.getOpcionesFiltrosNomina(
      user.rol,
      user.sedeId || null
    );

    if (!resultado.success) {
      return NextResponse.json(resultado, { status: 400 });
    }

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error en endpoint opciones nómina alumnos:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
