import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EstadoPractica } from '@prisma/client';
import { z } from 'zod';

// Schema de validación para la evaluación de informe
const evaluacionInformeSchema = z.object({
  // Criterios específicos según el Caso 13
  claridad_objetivos: z.number().min(1).max(7),
  fundamentacion_teorica: z.number().min(1).max(7),
  metodologia_aplicada: z.number().min(1).max(7),
  analisis_resultados: z.number().min(1).max(7),
  conclusiones_recomendaciones: z.number().min(1).max(7),
  calidad_redaccion: z.number().min(1).max(7),
  presentacion_formato: z.number().min(1).max(7),
  comentarios_generales: z.string().optional(),
  comentarios_mejoras: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getUserSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario sea docente
    if (session.rol !== 'DOCENTE') {
      return NextResponse.json(
        { error: 'Solo los docentes pueden evaluar informes' }, 
        { status: 403 }
      );
    }

    const practicaId = parseInt(id);
    if (isNaN(practicaId)) {
      return NextResponse.json(
        { error: 'ID de práctica inválido' }, 
        { status: 400 }
      );
    }

    // Validar datos de entrada
    const body = await request.json();
    const validatedData = evaluacionInformeSchema.parse(body);

    // Verificar que la práctica existe y el docente está asignado
    const practica = await prisma.practica.findUnique({
      where: { id: practicaId },
      include: {
        alumno: {
          include: {
            usuario: {
              select: {
                nombre: true,
                apellido: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!practica) {
      return NextResponse.json(
        { error: 'Práctica no encontrada' }, 
        { status: 404 }
      );
    }

    if (practica.docenteId !== session.userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para evaluar esta práctica' }, 
        { status: 403 }
      );
    }

    // Verificar que el informe esté subido
    if (!practica.informeUrl) {
      return NextResponse.json(
        { error: 'El informe de práctica debe estar subido antes de evaluar' }, 
        { status: 400 }
      );
    }

    // Verificar que la práctica esté en estado correcto para evaluar
    const estadosPermitidos: EstadoPractica[] = [
      EstadoPractica.EN_CURSO,
      EstadoPractica.FINALIZADA_PENDIENTE_EVAL,
      EstadoPractica.EVALUACION_COMPLETA
    ];

    if (!estadosPermitidos.includes(practica.estado)) {
      return NextResponse.json(
        { error: 'La práctica no está en un estado válido para evaluar el informe' }, 
        { status: 400 }
      );
    }

    // Calcular nota final (promedio de todos los criterios)
    const criterios = [
      validatedData.claridad_objetivos,
      validatedData.fundamentacion_teorica,
      validatedData.metodologia_aplicada,
      validatedData.analisis_resultados,
      validatedData.conclusiones_recomendaciones,
      validatedData.calidad_redaccion,
      validatedData.presentacion_formato
    ];

    const notaFinal = Number((criterios.reduce((sum, nota) => sum + nota, 0) / criterios.length).toFixed(1));

    // Verificar si ya existe una evaluación
    const evaluacionExistente = await prisma.evaluacionInformeDocente.findUnique({
      where: { practicaId }
    });

    let evaluacion;

    if (evaluacionExistente) {
      // Actualizar evaluación existente
      evaluacion = await prisma.evaluacionInformeDocente.update({
        where: { practicaId },
        data: {
          nota: notaFinal,
          comentarios: [validatedData.comentarios_generales, validatedData.comentarios_mejoras]
            .filter(Boolean)
            .join('\n\n--- Comentarios para Mejoras ---\n\n'),
          fecha: new Date()
        }
      });
    } else {
      // Crear nueva evaluación
      evaluacion = await prisma.evaluacionInformeDocente.create({
        data: {
          practicaId,
          nota: notaFinal,
          comentarios: [validatedData.comentarios_generales, validatedData.comentarios_mejoras]
            .filter(Boolean)
            .join('\n\n--- Comentarios para Mejoras ---\n\n'),
          fecha: new Date()
        }
      });
    }

    // Actualizar estado de la práctica según el flujo
    let nuevoEstado = practica.estado;
    
    // Verificar si ya tiene evaluación del empleador
    const evaluacionEmpleador = await prisma.evaluacionEmpleador.findUnique({
      where: { practicaId }
    });

    if (evaluacionEmpleador) {
      // Si ya tiene evaluación del empleador, marcar como evaluación completa
      nuevoEstado = EstadoPractica.EVALUACION_COMPLETA;
    } else if (practica.estado === EstadoPractica.EN_CURSO) {
      // Si está en curso, cambiar a pendiente de evaluación
      nuevoEstado = EstadoPractica.FINALIZADA_PENDIENTE_EVAL;
    }

    await prisma.practica.update({
      where: { id: practicaId },
      data: { 
        estado: nuevoEstado
      }
    });

    return NextResponse.json({
      message: 'Evaluación de informe guardada exitosamente',
      evaluacion: {
        id: evaluacion.id,
        nota: evaluacion.nota,
        fecha: evaluacion.fecha
      },
      nuevoEstado
    });

  } catch (error) {
    console.error('Error al guardar evaluación de informe:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de evaluación inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getUserSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const practicaId = parseInt(id);
    if (isNaN(practicaId)) {
      return NextResponse.json(
        { error: 'ID de práctica inválido' }, 
        { status: 400 }
      );
    }

    // Verificar que la práctica existe
    const practica = await prisma.practica.findUnique({
      where: { id: practicaId },
      include: {
        alumno: {
          include: {
            usuario: {
              select: {
                nombre: true,
                apellido: true
              }
            }
          }
        }
      }
    });

    if (!practica) {
      return NextResponse.json(
        { error: 'Práctica no encontrada' }, 
        { status: 404 }
      );
    }

    // Verificar permisos según rol
    if (session.rol === 'DOCENTE' && practica.docenteId !== session.userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta evaluación' }, 
        { status: 403 }
      );
    }

    // Buscar la evaluación
    const evaluacion = await prisma.evaluacionInformeDocente.findUnique({
      where: { practicaId }
    });

    if (!evaluacion) {
      return NextResponse.json(
        { error: 'Evaluación no encontrada' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({
      evaluacion,
      practica: {
        id: practica.id,
        alumno: practica.alumno,
        informeUrl: practica.informeUrl,
        estado: practica.estado
      }
    });

  } catch (error) {
    console.error('Error al obtener evaluación de informe:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}