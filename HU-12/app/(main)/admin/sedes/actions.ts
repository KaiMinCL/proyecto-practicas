'use server';

import { getSedes, createSede, updateSede, deactivateSede } from "@/lib/services/sedeService";
import { requireSA } from "@/lib/auth/requireSA";
import { SedeInput } from "@/lib/validators";

export async function listSedesAction() {
  await requireSA();
  return await getSedes();
}

export async function createSedeAction(data: SedeInput) {
  await requireSA();
  return await createSede(data);
}

export async function updateSedeAction(id: string, data: SedeInput) {
  await requireSA();
  return await updateSede(id, data);
}

export async function deactivateSedeAction(id: string) {
  await requireSA();
  return await deactivateSede(id);
}