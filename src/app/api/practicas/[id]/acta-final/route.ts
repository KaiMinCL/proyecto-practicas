import { NextRequest, NextResponse } from 'next/server';
import { EstadoPractica } from '@prisma/client';

import { authorizeDocente } from '@/lib/auth/checkRole';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: docenteUsuarioId } = await authorizeDocente();
    const { id } = await params;
    const practicaId = parseInt(id);

    if (isNaN(practicaId)) {
      return NextResponse.json(
        { error: 'ID de práctica inválido' },
        { status: 400 }
      );
    }

    // Obtener la práctica con todas las evaluaciones y configuración
    const practica = await prisma.practica.findUnique({
      where: { id: practicaId },
      include: {
        alumno: {
          include: {
            usuario: true,
            carrera: { include: { sede: true } }
          }
        },
        carrera: { include: { sede: true } },
        docente: { include: { usuario: true } },
        evaluacionDocente: true,
        evaluacionEmpleador: true,
        centroPractica: true,
        actaFinal: true
      }
    });

    if (!practica) {
      return NextResponse.json(
        { error: 'Práctica no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el docente está autorizado para esta práctica
    const docente = await prisma.docente.findUnique({
      where: { usuarioId: docenteUsuarioId }
    });

    if (!docente || practica.docenteId !== docente.id) {
      return NextResponse.json(
        { error: 'No tiene permisos para acceder a esta práctica' },
        { status: 403 }
      );
    }

    // Verificar que ambas evaluaciones están completadas
    if (!practica.evaluacionDocente || !practica.evaluacionEmpleador) {
      return NextResponse.json(
        { error: 'Las evaluaciones del informe y empleador deben estar completadas' },
        { status: 400 }
      );
    }

    // Obtener configuración de ponderación
    const configuracion = await prisma.configuracionEvaluacion.findFirst({
      orderBy: { id: 'desc' } // Obtener la configuración más reciente
    });

    if (!configuracion) {
      return NextResponse.json(
        { error: 'Configuración de ponderación no encontrada' },
        { status: 500 }
      );
    }

    // Calcular nota final ponderada
    const porcentajeInforme = configuracion.porcentajeInforme / 100;
    const porcentajeEmpleador = configuracion.porcentajeEmpleador / 100;
    
    const notaFinalPonderada = 
      (practica.evaluacionDocente.nota * porcentajeInforme) + 
      (practica.evaluacionEmpleador.nota * porcentajeEmpleador);

    const actaFinalData = {
      practica: {
        id: practica.id,
        tipo: practica.tipo,
        fechaInicio: practica.fechaInicio,
        fechaTermino: practica.fechaTermino,
        estado: practica.estado,
        alumno: {
          nombre: practica.alumno.usuario.nombre,
          apellido: practica.alumno.usuario.apellido,
          rut: practica.alumno.usuario.rut,
          carrera: practica.alumno.carrera?.nombre || practica.carrera?.nombre
        },
        centroPractica: practica.centroPractica ? {
          nombre: practica.centroPractica.nombreEmpresa,
          giro: practica.centroPractica.giro
        } : null,
        docente: {
          nombre: practica.docente.usuario.nombre,
          apellido: practica.docente.usuario.apellido
        }
      },
      evaluaciones: {
        informe: {
          nota: practica.evaluacionDocente.nota,
          fecha: practica.evaluacionDocente.fecha,
          porcentaje: configuracion.porcentajeInforme
        },
        empleador: {
          nota: practica.evaluacionEmpleador.nota,
          fecha: practica.evaluacionEmpleador.fecha,
          porcentaje: configuracion.porcentajeEmpleador
        }
      },
      notaFinalPonderada: Math.round(notaFinalPonderada * 10) / 10,
      estadoActaFinal: practica.actaFinal?.estado || 'PENDIENTE'
    };

    return NextResponse.json(actaFinalData);

  } catch (error) {
    console.error('Error al obtener datos del acta final:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: docenteUsuarioId } = await authorizeDocente();
    const { id } = await params;
    const practicaId = parseInt(id);

    if (isNaN(practicaId)) {
      return NextResponse.json(
        { error: 'ID de práctica inválido' },
        { status: 400 }
      );
    }

    // Verificar que la práctica existe y el docente tiene permisos
    const practica = await prisma.practica.findUnique({
      where: { id: practicaId },
      include: {
        evaluacionDocente: true,
        evaluacionEmpleador: true,
        docente: true,
        actaFinal: true
      }
    });

    if (!practica) {
      return NextResponse.json(
        { error: 'Práctica no encontrada' },
        { status: 404 }
      );
    }

    const docente = await prisma.docente.findUnique({
      where: { usuarioId: docenteUsuarioId }
    });

    if (!docente || practica.docenteId !== docente.id) {
      return NextResponse.json(
        { error: 'No tiene permisos para validar esta práctica' },
        { status: 403 }
      );
    }

    // Verificar que ambas evaluaciones están completadas
    if (!practica.evaluacionDocente || !practica.evaluacionEmpleador) {
      return NextResponse.json(
        { error: 'Las evaluaciones del informe y empleador deben estar completadas' },
        { status: 400 }
      );
    }

    // Verificar que el acta no esté ya cerrada
    if (practica.actaFinal?.estado === 'CERRADA') {
      return NextResponse.json(
        { error: 'El acta final ya está cerrada y no puede modificarse' },
        { status: 400 }
      );
    }

    // Obtener configuración de ponderación
    const configuracion = await prisma.configuracionEvaluacion.findFirst({
      orderBy: { id: 'desc' }
    });

    if (!configuracion) {
      return NextResponse.json(
        { error: 'Configuración de ponderación no encontrada' },
        { status: 500 }
      );
    }

    // Calcular nota final ponderada
    const porcentajeInforme = configuracion.porcentajeInforme / 100;
    const porcentajeEmpleador = configuracion.porcentajeEmpleador / 100;
    
    const notaFinalPonderada = 
      (practica.evaluacionDocente.nota * porcentajeInforme) + 
      (practica.evaluacionEmpleador.nota * porcentajeEmpleador);

    // Crear o actualizar ActaFinal
    const actaFinal = await prisma.actaFinal.upsert({
      where: { practicaId },
      update: {
        notaInforme: practica.evaluacionDocente.nota,
        notaEmpleador: practica.evaluacionEmpleador.nota,
        notaFinal: Math.round(notaFinalPonderada * 10) / 10,
        estado: 'VALIDADA',
        fechaCierre: new Date()
      },
      create: {
        practicaId,
        notaInforme: practica.evaluacionDocente.nota,
        notaEmpleador: practica.evaluacionEmpleador.nota,
        notaFinal: Math.round(notaFinalPonderada * 10) / 10,
        estado: 'VALIDADA',
        fechaCierre: new Date()
      }
    });

    // Actualizar estado de la práctica
    const practicaActualizada = await prisma.practica.update({
      where: { id: practicaId },
      data: {
        estado: EstadoPractica.CERRADA
      },
      include: {
        alumno: {
          include: {
            usuario: true,
            carrera: { include: { sede: true } }
          }
        },
        carrera: { include: { sede: true } },
        docente: { include: { usuario: true } },
        evaluacionDocente: true,
        evaluacionEmpleador: true,
        centroPractica: true,
        actaFinal: true
      }
    });

    return NextResponse.json({
      message: 'Acta final validada y cerrada exitosamente',
      notaFinal: actaFinal.notaFinal,
      estado: practicaActualizada.estado,
      estadoActaFinal: actaFinal.estado
    });

  } catch (error) {
    console.error('Error al validar acta final:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
