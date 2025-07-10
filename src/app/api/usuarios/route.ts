import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyUserSession } from '@/lib/auth';

export async function GET() {
  try {
    // 1. Verificar autenticación
    const user = await verifyUserSession();
    if (!user || user.rol !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 2. Obtener usuarios con sus relaciones
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,        
        rut: true,
        nombre: true,
        apellido: true,
        email: true,
        estado: true,
        rol: {
          select: {
            nombre: true,
          },
        },
        sede: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: {
        apellido: 'asc',
      },
    });

    return NextResponse.json(usuarios);

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await verifyUserSession();
    if (!user || user.rol !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, nombre, apellido, email, rol, sedeId, estado, tipo, carreraId, fotoUrl, carreras, centros } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Actualizar datos generales
    const usuario = await prisma.usuario.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(apellido && { apellido }),
        ...(email && { email }),
        ...(rol && { rol: { connect: { nombre: rol } } }),
        ...(sedeId && { sede: { connect: { id: sedeId } } }),
        ...(estado && ['ACTIVO', 'INACTIVO'].includes(estado) ? { estado } : {}),
      },
      include: { alumno: true, docente: true, empleador: true },
    });

    // Actualizar datos específicos según tipo
    if (usuario.alumno && (carreraId || fotoUrl)) {
      await prisma.alumno.update({
        where: { usuarioId: id },
        data: {
          ...(carreraId && { carreraId }),
          ...(fotoUrl && { fotoUrl }),
        },
      });
    }
    if (usuario.docente && Array.isArray(carreras)) {
      // Actualizar carreras del docente (DocenteCarrera)
      const docenteId = usuario.docente.id;
      // Eliminar todas y volver a crear
      await prisma.docenteCarrera.deleteMany({ where: { docenteId } });
      await prisma.docenteCarrera.createMany({
        data: carreras.map((carreraId: number) => ({ docenteId, carreraId })),
        skipDuplicates: true,
      });
    }
    if (usuario.empleador && Array.isArray(centros)) {
      // Actualizar centros del empleador (EmpleadorCentro)
      const empleadorId = usuario.empleador.id;
      await prisma.empleadorCentro.deleteMany({ where: { empleadorId } });
      await prisma.empleadorCentro.createMany({
        data: centros.map((centroPracticaId: number) => ({ empleadorId, centroPracticaId })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ success: true, message: 'Usuario actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}