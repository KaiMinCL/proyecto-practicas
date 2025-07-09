import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AuditoriaService } from '@/lib/services/auditoria';

export async function GET() {
  try {
    const userPayload = await getUserSession();

    if (!userPayload) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (userPayload.rol !== 'COORDINADOR') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo coordinadores pueden acceder.' },
        { status: 403 }
      );
    }

    // Obtener el coordinador para verificar su sede
    const coordinador = await prisma.usuario.findFirst({
      where: {
        rut: userPayload.rut,
        rol: { nombre: 'COORDINADOR' }
      },
      include: {
        sede: true
      }
    });

    if (!coordinador) {
      return NextResponse.json(
        { error: 'Coordinador no encontrado' },
        { status: 404 }
      );
    }

    // Construir filtros según la sede del coordinador
    const whereClause = {
      rol: {
        nombre: {
          in: ['ALUMNO', 'DOCENTE', 'EMPLEADOR']
        }
      }
    };

    // Si el coordinador tiene una sede específica, filtrar por ella
    if (coordinador.sedeId) {
      Object.assign(whereClause, { sedeId: coordinador.sedeId });
    }

    // Obtener usuarios que el coordinador puede gestionar
    const usuarios = await prisma.usuario.findMany({
      where: whereClause,
      select: {
        id: true,
        rut: true,
        nombre: true,
        apellido: true,
        email: true,
        password: true,
        claveInicialVisible: true,
        estado: true,
        rol: {
          select: {
            nombre: true
          }
        },
        sede: {
          select: {
            nombre: true
          }
        },
        alumno: {
          select: {
            carrera: {
              select: {
                nombre: true
              }
            }
          }
        },
        docente: {
          select: {
            id: true
          }
        },
        empleador: {
          select: {
            id: true
          }
        }
      },
      orderBy: [
        { rol: { nombre: 'asc' } },
        { apellido: 'asc' },
        { nombre: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: {
        usuarios,
        coordinador: {
          id: coordinador.id,
          nombre: coordinador.nombre,
          apellido: coordinador.apellido,
          sede: coordinador.sede?.nombre
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener usuarios para coordinador:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = await getUserSession();

    if (!userPayload) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    if (userPayload.rol !== 'COORDINADOR') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo coordinadores pueden acceder.' },
        { status: 403 }
      );
    }

    const { usuarioId, accion } = await request.json();

    if (accion !== 'CONSULTAR_CLAVE_INICIAL') {
      return NextResponse.json(
        { error: 'Acción no válida' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe y tiene clave inicial visible
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        rut: true,
        nombre: true,
        apellido: true,
        email: true,
        password: true,
        claveInicialVisible: true,
        rol: {
          select: {
            nombre: true
          }
        }
      }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (!usuario.claveInicialVisible) {
      return NextResponse.json(
        { error: 'Este usuario ya ha cambiado su contraseña inicial' },
        { status: 400 }
      );
    }

    // Verificar que el coordinador puede acceder a este usuario
    const coordinador = await prisma.usuario.findFirst({
      where: {
        rut: userPayload.rut,
        rol: { nombre: 'COORDINADOR' }
      },
      include: {
        sede: true
      }
    });

    if (!coordinador) {
      return NextResponse.json(
        { error: 'Coordinador no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos de sede si el coordinador tiene una sede específica
    if (coordinador.sedeId) {
      const usuarioCompleto = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { sedeId: true }
      });

      if (usuarioCompleto?.sedeId !== coordinador.sedeId) {
        return NextResponse.json(
          { error: 'No tiene permisos para acceder a este usuario' },
          { status: 403 }
        );
      }
    }

    // Registrar en auditoría
    await AuditoriaService.registrarAccion({
      usuarioId: coordinador.id,
      accion: 'CONSULTAR_CLAVE_INICIAL',
      entidad: 'Usuario',
      entidadId: usuario.id.toString(),
      descripcion: `Consulta de clave inicial para usuario ${usuario.rut} (${usuario.nombre} ${usuario.apellido})`,
      metadatos: {
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        usuario: {
          id: usuario.id,
          rut: usuario.rut,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          rol: usuario.rol.nombre
        },
        claveInicial: usuario.password,
        mensaje: 'Clave inicial consultada exitosamente'
      }
    });

  } catch (error) {
    console.error('Error al consultar clave inicial:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
