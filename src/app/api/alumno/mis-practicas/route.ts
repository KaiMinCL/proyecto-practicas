import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getUserSession();
    console.log('Session:', session); // Debug log
    
    if (!session?.userId) {
      console.log('No session or userId found'); // Debug log
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = parseInt(session.userId.toString());
    console.log('UserId:', userId); // Debug log
    
    // Verificar que el usuario sea un alumno
    if (session.rol !== 'ALUMNO') {
      console.log('User role is not ALUMNO:', session.rol); // Debug log
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Buscar el alumno
    const alumno = await prisma.alumno.findUnique({
      where: { usuarioId: userId },
      include: {
        usuario: true,
        carrera: {
          include: {
            sede: true
          }
        }
      }
    });

    console.log('Alumno found:', alumno); // Debug log

    if (!alumno) {
      console.log('Alumno not found for userId:', userId); // Debug log
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 });
    }

    // Obtener todas las prácticas del alumno
    const practicas = await prisma.practica.findMany({
      where: {
        alumnoId: alumno.id
      },
      include: {
        alumno: {
          include: {
            usuario: {
              select: {
                nombre: true,
                apellido: true,
                rut: true,
                email: true
              }
            },
            carrera: {
              include: {
                sede: {
                  select: {
                    id: true,
                    nombre: true
                  }
                }
              }
            }
          }
        },
        docente: {
          include: {
            usuario: {
              select: {
                nombre: true,
                apellido: true,
                rut: true,
                email: true
              }
            }
          }
        },
        carrera: {
          include: {
            sede: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        centroPractica: {
          select: {
            id: true,
            nombreEmpresa: true,
            direccion: true,
            telefono: true,
            emailGerente: true,
            giro: true
          }
        }
      },
      orderBy: {
        creadoEn: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: practicas
    });

  } catch (error) {
    console.error('Error al obtener prácticas del alumno:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
