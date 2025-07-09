import { NextResponse } from 'next/server';
import { RepositorioInformesService } from '@/lib/services/repositorioInformesService';
import { verifyUserSession } from '@/lib/auth';

export async function GET() {
  try {
    // Verificar autenticación y permisos
    const user = await verifyUserSession();
    if (!user || !['SUPER_ADMIN', 'DIRECTOR_CARRERA', 'COORDINADOR'].includes(user.rol)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Aplicar restricciones por sede según HU-54
    let usuarioSedeId: number | null = null;
    if (user.rol === 'DIRECTOR_CARRERA' || user.rol === 'COORDINADOR') {
      usuarioSedeId = user.sedeId || null;
    }

    // Obtener opciones de filtros
    const result = await RepositorioInformesService.getOpcionesFiltros(usuarioSedeId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);

  } catch (error) {
    console.error('Error en API de opciones de filtros:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
