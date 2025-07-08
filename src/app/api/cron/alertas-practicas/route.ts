import { NextRequest, NextResponse } from 'next/server';
import { AlertasPracticasService } from '@/lib/services/alertasPracticasService';

/**
 * Endpoint para ejecutar alertas automáticas via cron job o programación externa
 * Este endpoint está diseñado para ser llamado por un servicio de cron externo
 * o mediante GitHub Actions, Vercel Cron, etc.
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que la petición viene de un origen autorizado (opcional)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('Ejecutando alertas automáticas programadas...');
    
    const resultado = await AlertasPracticasService.ejecutarAlertasAutomaticas();
    
    console.log(`Alertas programadas completadas: ${resultado.alertasEnviadas} enviadas, ${resultado.errores.length} errores`);
    
    return NextResponse.json({
      success: resultado.success,
      alertasEnviadas: resultado.alertasEnviadas,
      errores: resultado.errores,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error crítico en alertas programadas:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// También permitir GET para verificar el estado del servicio
export async function GET() {
  try {
    const estadisticas = await AlertasPracticasService.obtenerEstadisticasPracticasPendientes();
    
    return NextResponse.json({
      success: true,
      status: 'Servicio de alertas funcionando',
      estadisticas,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al verificar servicio de alertas',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
