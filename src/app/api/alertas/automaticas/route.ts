import { NextRequest, NextResponse } from 'next/server';
import { AlertasPracticasService } from '@/lib/services/alertasPracticasService';
import { AuditoriaService } from '@/lib/services/auditoria';
import { getToken } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario sea admin o coordinador
    if (token.rol !== 'ADMIN' && token.rol !== 'COORDINADOR') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { tipo } = await request.json();

    let resultado;

    switch (tipo) {
      case 'todas':
        resultado = await AlertasPracticasService.ejecutarTodasLasAlertasAutomaticas();
        break;
      case 'pendientes':
        resultado = await AlertasPracticasService.ejecutarAlertasAutomaticas();
        break;
      case 'acta1':
        const practicasActa1 = await AlertasPracticasService.identificarPracticasActa1PorExpirar();
        resultado = {
          success: true,
          alertasEnviadas: practicasActa1.length,
          errores: []
        };
        break;
      case 'aceptacion':
        const practicasAceptacion = await AlertasPracticasService.identificarPracticasAceptacionDocentePorExpirar();
        resultado = {
          success: true,
          alertasEnviadas: practicasAceptacion.length,
          errores: []
        };
        break;
      case 'hitos':
        const hitos = await AlertasPracticasService.identificarPracticasHitosProximos();
        resultado = {
          success: true,
          alertasEnviadas: hitos.terminoProximo.length + hitos.informePendiente.length,
          errores: []
        };
        break;
      default:
        return NextResponse.json({ error: 'Tipo de alerta no válido' }, { status: 400 });
    }

    // Registrar auditoría
    await AuditoriaService.registrarAccion({
      usuarioId: Number(token.id),
      accion: 'GENERAR_ALERTA_AUTOMATICA',
      entidad: 'Sistema',
      entidadId: 'alertas-automaticas',
      descripcion: `Ejecución de alertas automáticas tipo: ${tipo}`,
      metadatos: {
        tipo,
        alertasEnviadas: resultado.alertasEnviadas,
        errores: resultado.errores,
        ejecutadoPor: `${token.nombre} ${token.apellido}`
      },
      request
    });

    return NextResponse.json({
      success: resultado.success,
      alertasEnviadas: resultado.alertasEnviadas,
      errores: resultado.errores,
      message: `Proceso completado. ${resultado.alertasEnviadas} alertas enviadas.`
    });

  } catch (error) {
    console.error('Error en API de alertas automáticas:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario sea admin o coordinador
    if (token.rol !== 'ADMIN' && token.rol !== 'COORDINADOR') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || 'preview';

    try {
      let datos;

      switch (tipo) {
        case 'pendientes':
          datos = await AlertasPracticasService.identificarPracticasPendientes();
          break;
        case 'acta1':
          datos = await AlertasPracticasService.identificarPracticasActa1PorExpirar();
          break;
        case 'aceptacion':
          datos = await AlertasPracticasService.identificarPracticasAceptacionDocentePorExpirar();
          break;
        case 'hitos':
          datos = await AlertasPracticasService.identificarPracticasHitosProximos();
          break;
        case 'estadisticas':
          datos = await AlertasPracticasService.obtenerEstadisticasPracticasPendientes(
            typeof token.sedeId === 'number' ? token.sedeId : undefined
          );
          break;
        default:
          // Preview general
          const [pendientes, acta1, aceptacion, hitos, estadisticas] = await Promise.all([
            AlertasPracticasService.identificarPracticasPendientes(),
            AlertasPracticasService.identificarPracticasActa1PorExpirar(),
            AlertasPracticasService.identificarPracticasAceptacionDocentePorExpirar(),
            AlertasPracticasService.identificarPracticasHitosProximos(),
            AlertasPracticasService.obtenerEstadisticasPracticasPendientes(
              typeof token.sedeId === 'number' ? token.sedeId : undefined
            )
          ]);

          datos = {
            pendientes: pendientes.length,
            acta1: acta1.length,
            aceptacion: aceptacion.length,
            terminoProximo: hitos.terminoProximo.length,
            informePendiente: hitos.informePendiente.length,
            estadisticas
          };
          break;
      }

      return NextResponse.json({
        success: true,
        datos
      });

    } catch (error) {
      console.error('Error al obtener datos de alertas:', error);
      return NextResponse.json({
        error: 'Error al obtener los datos'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error en API de alertas automáticas:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
