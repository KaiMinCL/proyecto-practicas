import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { AlertasPracticasService } from '@/lib/services/alertasPracticasService';
import { AuditoriaService } from '@/lib/services/auditoria';
import { z } from 'zod';

const enviarAlertaManualSchema = z.object({
  practicaId: z.number().int().positive(),
  asunto: z.string().min(1, 'El asunto es requerido').max(200, 'El asunto no puede exceder 200 caracteres'),
  mensaje: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres').max(1000, 'El mensaje no puede exceder 1000 caracteres'),
});

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario sea coordinador o admin
    if (token.rol !== 'COORDINADOR' && token.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = enviarAlertaManualSchema.parse(body);

    const resultado = await AlertasPracticasService.enviarAlertaManual({
      practicaId: validatedData.practicaId,
      asunto: validatedData.asunto,
      mensaje: validatedData.mensaje,
      enviadoPor: `${token.nombre} ${token.apellido}`,
      enviadoEmail: token.email || 'sin-email',
      destinatario: {
        nombre: '', // Se obtendrá del servicio
        email: ''   // Se obtendrá del servicio
      }
    });

    if (!resultado.success) {
      return NextResponse.json({ 
        error: resultado.error || 'Error al enviar alerta' 
      }, { status: 400 });
    }

    // Registrar auditoría
    await AuditoriaService.registrarAccion({
      usuarioId: Number(token.id),
      accion: 'GENERAR_ALERTA_MANUAL',
      entidad: 'AlertaManual',
      entidadId: resultado.alertaId?.toString() || 'unknown',
      descripcion: `Alerta manual enviada: ${validatedData.asunto}`,
      metadatos: {
        practicaId: validatedData.practicaId,
        asunto: validatedData.asunto,
        mensaje: validatedData.mensaje,
        enviadoPor: `${token.nombre} ${token.apellido}`,
        alertaId: resultado.alertaId
      },
      request
    });

    return NextResponse.json({
      success: true,
      alertaId: resultado.alertaId,
      message: 'Alerta enviada exitosamente'
    });

  } catch (error) {
    console.error('Error en API de alerta manual:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: error.errors
      }, { status: 400 });
    }

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

    // Verificar que el usuario sea coordinador o admin
    if (token.rol !== 'COORDINADOR' && token.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const practicaId = searchParams.get('practicaId');

    if (!practicaId) {
      return NextResponse.json({ error: 'ID de práctica requerido' }, { status: 400 });
    }

    const historial = await AlertasPracticasService.obtenerHistorialAlertasManuales(
      parseInt(practicaId, 10)
    );

    return NextResponse.json({
      success: true,
      historial
    });

  } catch (error) {
    console.error('Error al obtener historial de alertas:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
