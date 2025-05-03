// src/lib/auth/requireSA.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";

export async function requireSA() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SA") {
    throw new Error("No autorizado");
  }
  return session.user;
} 
