import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { ActasRepositorioService } from '@/lib/services/actasRepositorioService';

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
        { error: 'Sin permisos para consultar opciones' },
        { status: 403 }
      );
    }
    
    // Obtener carreras disponibles
    const carreras = await ActasRepositorioService.obtenerCarrerasDisponibles(user);
    
    // Obtener sedes disponibles (solo para super admin)
    let sedes = [];
    if (user.rol === 'SUPER_ADMIN') {
      sedes = await ActasRepositorioService.obtenerSedesDisponibles();
    }
    
    return NextResponse.json({
      carreras,
      sedes
    });
    
  } catch (error) {
    console.error('Error al obtener opciones de filtros:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
