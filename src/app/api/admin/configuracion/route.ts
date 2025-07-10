import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (user.rol !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener configuración actual o usar valores por defecto
    const config = await prisma.configuracionEvaluacion.findFirst();
    
    const defaultConfig = {
      pesoEvaluacionEmpleador: config?.porcentajeEmpleador || 60,
      pesoEvaluacionInforme: config?.porcentajeInforme || 40,
      notaMinimaAprobacion: 4.0 // Este campo no existe en el modelo, usar valor fijo
    };

    return NextResponse.json({ success: true, data: defaultConfig });

  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (user.rol !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { pesoEvaluacionEmpleador, pesoEvaluacionInforme } = body;

    // Validaciones
    if (pesoEvaluacionEmpleador + pesoEvaluacionInforme !== 100) {
      return NextResponse.json({ error: 'La suma de las ponderaciones debe ser 100%' }, { status: 400 });
    }

    // Actualizar o crear configuración
    const config = await prisma.configuracionEvaluacion.upsert({
      where: { id: 1 },
      update: {
        porcentajeEmpleador: pesoEvaluacionEmpleador,
        porcentajeInforme: pesoEvaluacionInforme
      },
      create: {
        id: 1,
        porcentajeEmpleador: pesoEvaluacionEmpleador,
        porcentajeInforme: pesoEvaluacionInforme
      }
    });

    const responseData = {
      pesoEvaluacionEmpleador: config.porcentajeEmpleador,
      pesoEvaluacionInforme: config.porcentajeInforme,
      notaMinimaAprobacion: 4.0 // Valor fijo ya que no está en el modelo
    };

    return NextResponse.json({ success: true, data: responseData });

  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
