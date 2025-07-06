import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyUserSession } from '@/lib/auth';

export async function GET() {
  try {
    // Verificar autenticación y autorización
    const user = await verifyUserSession();
    if (!user || user.rol !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener estadísticas reales
    const [
      totalUsuarios,
      usuariosActivos,
      totalSedes,
      sedesActivas,
      totalCarreras,
      carrerasActivas,
      totalPracticasEsteMes
    ] = await Promise.all([
      // Total de usuarios
      prisma.usuario.count(),
      
      // Usuarios activos
      prisma.usuario.count({
        where: { estado: 'ACTIVO' }
      }),
      
      // Total de sedes
      prisma.sede.count(),
      
      // Sedes activas
      prisma.sede.count({
        where: { estado: 'ACTIVO' }
      }),
      
      // Total de carreras
      prisma.carrera.count(),
      
      // Carreras activas
      prisma.carrera.count({
        where: { estado: 'ACTIVO' }
      }),
      
      // Prácticas iniciadas este mes
      prisma.practica.count({
        where: {
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
