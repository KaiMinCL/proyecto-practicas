import { NextRequest, NextResponse } from 'next/server';
import { RepositorioInformesService, FiltrosRepositorioInformes } from '@/lib/services/repositorioInformesService';
import { verifyUserSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y permisos
    const user = await verifyUserSession();
    if (!user || !['SUPER_ADMIN', 'DIRECTOR_CARRERA', 'COORDINADOR'].includes(user.rol)) {
      return NextResponse.json(
        { error: 'No autorizado. Solo DC/Coordinador pueden acceder al repositorio de informes.' },
        { status: 401 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    
    // Parámetros de filtros
    const filtros: FiltrosRepositorioInformes = {};
    
    if (searchParams.get('sedeId')) {
      filtros.sedeId = parseInt(searchParams.get('sedeId')!);
    }
    
    if (searchParams.get('carreraId')) {
      filtros.carreraId = parseInt(searchParams.get('carreraId')!);
    }
    
    if (searchParams.get('anioAcademico')) {
      filtros.anioAcademico = parseInt(searchParams.get('anioAcademico')!);
    }
    
    if (searchParams.get('semestre')) {
      filtros.semestre = searchParams.get('semestre')!;
    }
    
    if (searchParams.get('fechaDesde')) {
      filtros.fechaDesde = new Date(searchParams.get('fechaDesde')!);
    }
    
    if (searchParams.get('fechaHasta')) {
      filtros.fechaHasta = new Date(searchParams.get('fechaHasta')!);
    }
    
    if (searchParams.get('nombreAlumno')) {
      filtros.nombreAlumno = searchParams.get('nombreAlumno')!;
    }
    
    if (searchParams.get('rutAlumno')) {
      filtros.rutAlumno = searchParams.get('rutAlumno')!;
    }

    // Parámetros de paginación
    const pagina = parseInt(searchParams.get('pagina') || '1');
    const limite = parseInt(searchParams.get('limite') || '20');

    // Aplicar restricciones por sede según HU-54
    let usuarioSedeId: number | null = null;
    if (user.rol === 'DIRECTOR_CARRERA' || user.rol === 'COORDINADOR') {
      usuarioSedeId = user.sedeId || null;
    }

    // Obtener informes históricos
    const result = await RepositorioInformesService.getInformesHistoricos(
      filtros,
      usuarioSedeId,
      pagina,
      limite
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);

  } catch (error) {
    console.error('Error en API de repositorio de informes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
