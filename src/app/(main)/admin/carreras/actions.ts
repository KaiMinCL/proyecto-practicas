'use server';

import {
  getCarreras,
  createCarrera,
  updateCarrera,
  deactivateCarrera,
} from "@/lib/services/carreraService";
import { getActiveSedes } from "@/lib/services/sedeService";
import { CarreraInput } from "@/lib/validators";
import { requireSA } from "@/lib/auth/requireSA";

export async function listCarrerasAction() {
  await requireSA();
  return await getCarreras();
}

export async function createCarreraAction(data: CarreraInput) {
  await requireSA();
  return await createCarrera(data);
}

export async function updateCarreraAction(id: string, data: CarreraInput) {
  await requireSA();
  return await updateCarrera(id, data);
}

export async function deactivateCarreraAction(id: string) {
  await requireSA();
  return await deactivateCarrera(id);
}

export async function getActiveSedesAction() {
  await requireSA();
  return await getActiveSedes();
}