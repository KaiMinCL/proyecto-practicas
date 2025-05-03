import { prisma } from "@/lib/prisma";
import { carreraSchema } from "@/lib/validators";
import { z } from "zod";

type CarreraInput = z.infer<typeof carreraSchema>;

export async function getCarreras() {
  return await prisma.carrera.findMany({
    include: {
      sede: true,
    },
    orderBy: { nombre: "asc" },
  });
}

export async function createCarrera(data: CarreraInput) {
  const result = carreraSchema.safeParse(data);
  if (!result.success) throw new Error("Datos inválidos para crear carrera");

  return await prisma.carrera.create({
    data: {
      nombre: result.data.nombre,
      sedeId: result.data.sedeId,
      estado: true,
    },
  });
}

export async function updateCarrera(id: string, data: CarreraInput) {
  const result = carreraSchema.safeParse(data);
  if (!result.success) throw new Error("Datos inválidos para actualizar carrera");

  return await prisma.carrera.update({
    where: { id },
    data: {
      nombre: result.data.nombre,
      sedeId: result.data.sedeId,
    },
  });
}

export async function deactivateCarrera(id: string) {
  return await prisma.carrera.update({
    where: { id },
    data: { estado: false },
  });
}