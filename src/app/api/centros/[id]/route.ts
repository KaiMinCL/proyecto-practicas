import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyUserSession } from '@/lib/auth';
import { UpdateCentroSchema } from '@/lib/validators/centro';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar autenticación
    const user = await verifyUserSession();
   if (!user || !['SUPER_ADMIN', 'COORDINADOR'].includes(user.rol)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 2. Obtener centro específico
    const centro = await prisma.centroPractica.findUnique({
      where: { id },
      select: {
        id: true,
        nombreEmpresa: true,
        giro: true,
        direccion: true,
        telefono: true,
        emailGerente: true,
        empleadores: {
          select: {
            empleador: {
              select: {
                id: true,
                usuario: {
                  select: {
                    nombre: true,
                    apellido: true,
                    email: true,
                  }
                }
              }
            }
          }
        },
        practicas: {
          select: {
            id: true,
            estado: true,
            alumno: {
              select: {
                usuario: {
                  select: {
                    nombre: true,
                    apellido: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!centro) {
      return NextResponse.json(
        { error: 'Centro de práctica no encontrado' },
        { status: 404 }
      );
    }

    // 3. Transformar datos
    const transformedCentro = {
      id: centro.id,
      nombreEmpresa: centro.nombreEmpresa,
      giro: centro.giro,
      direccion: centro.direccion,
      telefono: centro.telefono,
      emailGerente: centro.emailGerente,
      empleadores: centro.empleadores.map(e => ({
        id: e.empleador.id,
        nombre: `${e.empleador.usuario.nombre} ${e.empleador.usuario.apellido}`,
        email: e.empleador.usuario.email
      })),
      practicas: centro.practicas.map(p => ({
        id: p.id,
        estado: p.estado,
        alumno: `${p.alumno.usuario.nombre} ${p.alumno.usuario.apellido}`
      }))
    };

    return NextResponse.json(transformedCentro);

  } catch (error) {
    console.error('Error al obtener centro de práctica:', error);
    return NextResponse.json(
      { error: 'Error al obtener centro de práctica' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar autenticación
    const user = await verifyUserSession();
    if (!user || user.rol !== 'COORDINADOR') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 2. Validar datos
    const body = await request.json();
    const validatedData = UpdateCentroSchema.parse({ ...body, id });

    // 3. Verificar que el centro existe
    const existingCentro = await prisma.centroPractica.findUnique({
      where: { id }
    });

    if (!existingCentro) {
      return NextResponse.json(
        { error: 'Centro de práctica no encontrado' },
        { status: 404 }
      );
    }

    // 4. Actualizar centro
    const centro = await prisma.centroPractica.update({
      where: { id },
      data: {
        nombreEmpresa: validatedData.nombreEmpresa,
        giro: validatedData.giro,
        direccion: validatedData.direccion,
        telefono: validatedData.telefono,
        emailGerente: validatedData.emailGerente,
      },
      select: {
        id: true,
        nombreEmpresa: true,
        giro: true,
        direccion: true,
        telefono: true,
        emailGerente: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Centro de práctica actualizado exitosamente',
      data: centro
    });

  } catch (error) {
    console.error('Error al actualizar centro de práctica:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar centro de práctica' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificar autenticación
    const user = await verifyUserSession();
    if (!user || user.rol !== 'COORDINADOR') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // 2. Verificar que el centro existe
    const existingCentro = await prisma.centroPractica.findUnique({
      where: { id },
      select: {
        id: true,
        nombreEmpresa: true,
        _count: {
          select: {
            practicas: true,
            empleadores: true
          }
        }
      }
    });

    if (!existingCentro) {
      return NextResponse.json(
        { error: 'Centro de práctica no encontrado' },
        { status: 404 }
      );
    }

    // 3. Verificar que no tenga prácticas activas
    if (existingCentro._count.practicas > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un centro con prácticas asociadas' },
        { status: 400 }
      );
    }

    // 4. Eliminar centro (las relaciones con empleadores se eliminan en cascada)
    await prisma.centroPractica.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Centro de práctica eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar centro de práctica:', error);
    return NextResponse.json(
      { error: 'Error al eliminar centro de práctica' },
      { status: 500 }
    );
  }
}