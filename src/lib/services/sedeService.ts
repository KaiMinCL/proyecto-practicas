import { prisma } from "@/lib/prisma";
import { sedeSchema } from "@/lib/validators";
import { z } from "zod";

type SedeInput = z.infer<typeof sedeSchema>;

export async function getSedes() {
  return await prisma.sede.findMany({ orderBy: { nombre: "asc" } });
}

export async function getActiveSedes() {
  return await prisma.sede.findMany({
    where: { estado: true },
    orderBy: { nombre: "asc" },
  });
}

export async function createSede(data: SedeInput) {
  const result = sedeSchema.safeParse(data);
  if (!result.success) throw new Error("Datos inválidos para crear sede.");
  return await prisma.sede.create({
    data: {
      nombre: result.data.nombre,
      direccion: result.data.direccion ?? null,
      estado: true,
    },
  });
}

export async function updateSede(id: string, data: SedeInput) {
  const result = sedeSchema.safeParse(data);
  if (!result.success) throw new Error("Datos inválidos para actualizar sede.");
  return await prisma.sede.update({
    where: { id },
    data: {
      nombre: result.data.nombre,
      direccion: result.data.direccion ?? null,
    },
  });
}

export async function deactivateSede(id: string) {
  return await prisma.sede.update({
    where: { id },
    data: { estado: false },
  });
}
