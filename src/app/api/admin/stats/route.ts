import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyUserSession } from '@/lib/auth';

export async function GET() {
  try {
    // Verificar autenticación y autorización
    const user = await verifyUserSession();
    if (!user || !['SUPER_ADMIN', 'DIRECTOR_CARRERA'].includes(user.rol)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Aplicar restricciones por sede para DC
    const aplicarFiltroSede = user.rol === 'DIRECTOR_CARRERA' && user.sedeId !== null && user.sedeId !== undefined;
    const sedeId = user.sedeId!; // Ya verificamos que no es null/undefined arriba
    const filtroSede = aplicarFiltroSede ? { sedeId } : {};
    const filtroPracticasSede = aplicarFiltroSede ? { carrera: { sedeId } } : {};

    // Obtener estadísticas
    const [
      totalUsuarios,
      usuariosActivos,
      totalSedes,
      sedesActivas,
      totalCarreras,
      carrerasActivas,
      totalPracticasEsteMes
    ] = await Promise.all([
      // Total de usuarios - Solo de la sede si es DC
      aplicarFiltroSede 
        ? prisma.usuario.count({ where: filtroSede })
        : prisma.usuario.count(),
      
      // Usuarios activos - Solo de la sede si es DC
      aplicarFiltroSede
        ? prisma.usuario.count({ where: { ...filtroSede, estado: 'ACTIVO' } })
        : prisma.usuario.count({ where: { estado: 'ACTIVO' } }),
      
      // Total de sedes - Solo la del DC si corresponde
      aplicarFiltroSede
        ? 1 // Solo la sede del DC
        : prisma.sede.count(),
      
      // Sedes activas - Solo la del DC si corresponde
      aplicarFiltroSede
        ? prisma.sede.count({ where: { id: sedeId, estado: 'ACTIVO' } })
        : prisma.sede.count({ where: { estado: 'ACTIVO' } }),
      
      // Total de carreras - Solo de la sede si es DC
      prisma.carrera.count({ where: filtroSede }),
      
      // Carreras activas - Solo de la sede si es DC
      prisma.carrera.count({ where: { ...filtroSede, estado: 'ACTIVO' } }),
      
      // Prácticas iniciadas este mes - Solo de la sede si es DC
      prisma.practica.count({
        where: {
          ...filtroPracticasSede,
          fechaInicio: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          }
        }
      })
    ]);

    const stats = {
      totalUsuarios,
      usuariosActivos,
      usuariosInactivos: totalUsuarios - usuariosActivos,
      totalSedes,
      sedesActivas,
      totalCarreras,
      carrerasActivas,
      totalPracticasEsteMes
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
