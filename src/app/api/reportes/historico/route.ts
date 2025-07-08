import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { ActasRepositorioService } from '@/lib/services/actasRepositorioService';
import { EstadoPractica, TipoPractica } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar permisos
    const rolesPermitidos = ['COORDINADOR', 'DIRECTOR_CARRERA', 'SUPER_ADMIN'];
    if (!rolesPermitidos.includes(user.rol)) {
      return NextResponse.json(
        { error: 'Sin permisos para consultar histórico' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Obtener parámetros de paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Obtener filtros
    const filtros = {
      estados: searchParams.get('estados')?.split(',') as EstadoPractica[] || undefined,
      fechaInicio: searchParams.get('fechaInicio') ? new Date(searchParams.get('fechaInicio')!) : undefined,
      fechaFin: searchParams.get('fechaFin') ? new Date(searchParams.get('fechaFin')!) : undefined,
      carreraId: searchParams.get('carreraId') ? parseInt(searchParams.get('carreraId')!) : undefined,
      sedeId: searchParams.get('sedeId') ? parseInt(searchParams.get('sedeId')!) : undefined,
      tipo: searchParams.get('tipo') as TipoPractica || undefined,
      alumnoRut: searchParams.get('alumnoRut') || undefined,
      nombreAlumno: searchParams.get('nombreAlumno') || undefined,
    };
    
    // Obtener histórico
    const resultado = await ActasRepositorioService.obtenerHistorialPracticas(
      filtros,
      user,
      page,
      limit
    );
    
    return NextResponse.json(resultado);
    
  } catch (error) {
    console.error('Error al obtener histórico de prácticas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar permisos
    const rolesPermitidos = ['COORDINADOR', 'DIRECTOR_CARRERA', 'SUPER_ADMIN'];
    if (!rolesPermitidos.includes(user.rol)) {
      return NextResponse.json(
        { error: 'Sin permisos para exportar histórico' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { action, filtros } = body;
    
    if (action === 'export') {
      const csvData = await ActasRepositorioService.exportarHistorialCSV(
        filtros,
        user
      );
      
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=historial-practicas-${new Date().toISOString().split('T')[0]}.csv`
        }
      });
    }
    
    if (action === 'estadisticas') {
      const estadisticas = await ActasRepositorioService.obtenerEstadisticasPracticas(
        filtros,
        user
      );
      
      return NextResponse.json(estadisticas);
    }
    
    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error en POST histórico de prácticas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
