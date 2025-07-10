import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyUserSession } from '@/lib/auth';
import { CreateCentroSchema } from '@/lib/validators/centro';

export async function GET() {
  try {
    // 1. Verificar autenticación
    const user = await verifyUserSession();
   if (!user || !['SUPER_ADMIN', 'COORDINADOR'].includes(user.rol)) {
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
   if (!user || !['SUPER_ADMIN', 'COORDINADOR'].includes(user.rol)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 2. Validar datos
    const body = await request.json();
    const validatedData = CreateCentroSchema.parse(body);

    // 3. Usar transacción para crear centro y empleador si es necesario
    const result = await prisma.$transaction(async (tx) => {
      let empleadorId = validatedData.empleadorExistenteId;

      // Si se va a crear un nuevo empleador
      if (validatedData.crearNuevoEmpleador && validatedData.nuevoEmpleador) {
        // Verificar que el RUT no exista
        const existingUser = await tx.usuario.findUnique({
          where: { rut: validatedData.nuevoEmpleador.rut }
        });

        if (existingUser) {
          throw new Error('Ya existe un usuario con este RUT');
        }

        // Verificar que el email no exista
        const existingEmail = await tx.usuario.findUnique({
          where: { email: validatedData.nuevoEmpleador.email }
        });

        if (existingEmail) {
          throw new Error('Ya existe un usuario con este email');
        }

        // Obtener el rol de empleador
        const empleadorRole = await tx.rol.findUnique({
          where: { nombre: 'EMPLEADOR' }
        });

        if (!empleadorRole) {
          throw new Error('Rol EMPLEADOR no encontrado');
        }

        // Generar contraseña inicial
        const initialPassword = Math.random().toString(36).slice(-8);
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(initialPassword, 10);

        // Crear usuario empleador
        const nuevoUsuario = await tx.usuario.create({
          data: {
            rut: validatedData.nuevoEmpleador.rut,
            nombre: validatedData.nuevoEmpleador.nombre,
            apellido: validatedData.nuevoEmpleador.apellido,
            email: validatedData.nuevoEmpleador.email,
            password: hashedPassword,
            rolId: empleadorRole.id,
          }
        });

        // Crear empleador
        const nuevoEmpleador = await tx.empleador.create({
          data: {
            usuarioId: nuevoUsuario.id
          }
        });

        empleadorId = nuevoEmpleador.id;
      }

      // 4. Crear centro de práctica
      const centro = await tx.centroPractica.create({
        data: {
          nombreEmpresa: validatedData.nombreEmpresa,
          giro: validatedData.giro,
          direccion: validatedData.direccion,
          telefono: validatedData.telefono,
          emailGerente: validatedData.emailGerente,
          // Remover campos de contacto ya que ahora vienen del empleador
        }
      });

      // 5. Asociar empleador al centro si se especificó uno
      if (empleadorId) {
        await tx.empleadorCentro.create({
          data: {
            empleadorId,
            centroPracticaId: centro.id
          }
        });
      }

      return {
        centro,
        nuevoEmpleador: validatedData.crearNuevoEmpleador ? validatedData.nuevoEmpleador : null,
        initialPassword: validatedData.crearNuevoEmpleador ? 
          Math.random().toString(36).slice(-8) : null
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Centro de práctica creado exitosamente',
      data: result.centro,
      ...(result.nuevoEmpleador && {
        nuevoEmpleador: result.nuevoEmpleador,
        initialPassword: result.initialPassword
      })
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear centro de práctica:', error);
    
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Datos de entrada inválidos', details: error.message },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear centro de práctica' },
      { status: 500 }
    );
  }
}