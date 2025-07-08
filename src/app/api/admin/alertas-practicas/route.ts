import { NextRequest, NextResponse } from 'next/server';
import { AlertasPracticasService } from '@/lib/services/alertasPracticasService';
import { authorizeSuperAdminOrDirectorCarrera, authorizeCoordinadorOrDirectorCarrera } from '@/lib/auth/checkRole';

export async function POST(request: NextRequest) {
  try {
    // Solo administradores o coordinadores pueden ejecutar alertas manuales
    const authUser = await authorizeCoordinadorOrDirectorCarrera();
    
    console.log(`Ejecutando alertas manuales solicitadas por usuario ${authUser.id}`);
    
    const resultado = await AlertasPracticasService.ejecutarAlertasAutomaticas();
    
    return NextResponse.json({
      success: true,
      alertasEnviadas: resultado.alertasEnviadas,
      errores: resultado.errores,
      message: `Proceso completado. ${resultado.alertasEnviadas} alertas enviadas.`
    });

  } catch (error) {
    console.error('Error en endpoint de alertas manuales:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor al ejecutar alertas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Solo administradores pueden ver estadísticas generales
    const authUser = await authorizeCoordinadorOrDirectorCarrera();
    
    // Si es coordinador, filtrar por su sede
    let sedeId: number | undefined;
    if (authUser.rol === 'COORDINADOR' && authUser.sedeId) {
      sedeId = authUser.sedeId;
    }
    
    const estadisticas = await AlertasPracticasService.obtenerEstadisticasPracticasPendientes(sedeId);
    
    return NextResponse.json({
      success: true,
      estadisticas
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de alertas:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor al obtener estadísticas'
      },
      { status: 500 }
    );
  }
}
