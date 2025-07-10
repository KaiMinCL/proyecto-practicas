// src/lib/services/docenteService.ts
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class DocenteService {
  /**
   * Obtiene una lista de docentes formateada para selección en formularios.
   * Filtra por docentes activos.
   * Si se provee carreraId, filtra docentes asociados a esa carrera mediante la tabla DocenteCarrera.
   * Si no se provee carreraId pero sí sedeId, filtra por la sede del usuario del docente (como fallback).
   * @param params - Opcional: { carreraId?: number; sedeId?: number }
   */
  static async getDocentesParaSeleccion(params?: { carreraId?: number; sedeId?: number }) {
    try {
      const whereClause: Prisma.DocenteWhereInput = {
        usuario: {
          estado: 'ACTIVO',
        },
      };

      if (params?.carreraId) {
        whereClause.carreras = { // Filtra a través de la relación M2M DocenteCarrera
          some: {
            carreraId: params.carreraId,
          },
        };
      } else if (params?.sedeId) {
        // Fallback si no hay carreraId: filtrar por la sede del Usuario del Docente
        if (!whereClause.usuario) whereClause.usuario = {};
        whereClause.usuario.sedeId = params.sedeId;
      }

      const docentes = await prisma.docente.findMany({
        where: whereClause,
        select: {
          id: true,
          usuario: {
            select: {
              nombre: true,
              apellido: true,
              email: true,
            },
          },
        },
        orderBy: [
          { usuario: { apellido: 'asc' } },
          { usuario: { nombre: 'asc' } },
        ],
      });

      const formattedDocentes = docentes.map(d => ({
        value: d.id,
        label: `${d.usuario.apellido}, ${d.usuario.nombre} (${d.usuario.email})`,
      }));
      return { success: true, data: formattedDocentes };
    } catch (error) {
      console.error('Error al obtener docentes para selección:', error);
      return { success: false, error: 'No se pudieron obtener los docentes.' };
    }
  }
}