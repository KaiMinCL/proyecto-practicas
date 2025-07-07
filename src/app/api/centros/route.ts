import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyUserSession } from '@/lib/auth';
import { CreateCentroSchema } from '@/lib/validators/centro';

export async function GET() {
  try {
    // 1. Verificar autenticación
    const user = await verifyUserSession();
    if (!user || user.rol !== 'COORDINADOR') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 2. Obtener centros de práctica con empleadores asociados
    const centros = await prisma.centroPractica.findMany({
      select: {
        id: true,
        nombreEmpresa: true,
        giro: true,
        direccion: true,
        telefono: true,
        emailGerente: true,
        nombreContacto: true,
        emailContacto: true,
        telefonoContacto: true,
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
        _count: {
          select: {
            practicas: true
          }
        }
      },
      orderBy: {
        nombreEmpresa: 'asc'
      }
    });

    // 3. Transformar datos para el frontend
    const transformedCentros = centros.map(centro => ({
      id: centro.id,
      nombreEmpresa: centro.nombreEmpresa,
      giro: centro.giro,
      direccion: centro.direccion,
      telefono: centro.telefono,
      emailGerente: centro.emailGerente,
      nombreContacto: centro.nombreContacto,
      emailContacto: centro.emailContacto,
      telefonoContacto: centro.telefonoContacto,
      empleadores: centro.empleadores.map(e => ({
        id: e.empleador.id,
        nombre: `${e.empleador.usuario.nombre} ${e.empleador.usuario.apellido}`,
        email: e.empleador.usuario.email
      })),
      cantidadPracticas: centro._count.practicas
    }));

    return NextResponse.json(transformedCentros);

  } catch (error) {
    console.error('Error al obtener centros de práctica:', error);
    return NextResponse.json(
      { error: 'Error al obtener centros de práctica' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 1. Verificar autenticación
    const user = await verifyUserSession();
    if (!user || user.rol !== 'COORDINADOR') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 2. Validar datos
    const body = await request.json();
    const validatedData = CreateCentroSchema.parse(body);

    // 3. Crear centro de práctica
    const centro = await prisma.centroPractica.create({
      data: {
        nombreEmpresa: validatedData.nombreEmpresa,
        giro: validatedData.giro,
        direccion: validatedData.direccion,
        telefono: validatedData.telefono,
        emailGerente: validatedData.emailGerente,
        nombreContacto: validatedData.nombreContacto,
        emailContacto: validatedData.emailContacto,
        telefonoContacto: validatedData.telefonoContacto,
      },
      select: {
        id: true,
        nombreEmpresa: true,
        giro: true,
        direccion: true,
        telefono: true,
        emailGerente: true,
        nombreContacto: true,
        emailContacto: true,
        telefonoContacto: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Centro de práctica creado exitosamente',
      data: centro
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear centro de práctica:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear centro de práctica' },
      { status: 500 }
    );
  }
}