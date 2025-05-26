import { clsx, type ClassValue } from "clsx"
import { NextResponse } from "next/server";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function apiErrorResponse(message: string, status: number = 500) {
  console.error(`API Error (${status}): ${message}`);
  return NextResponse.json({ message }, { status });
}

export function apiSuccessResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Genera una contraseña inicial segura para nuevos usuarios.
 * La contraseña sigue un patrón de 4 dígitos aleatorios + 4 letras aleatorias.
 * Ejemplo: "1234ABCD"
 */
export function generateInitialPassword(): string {
  // Genera 4 dígitos aleatorios
  const digits = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('');
  
  // Genera 4 letras mayúsculas aleatorias
  const letters = Array.from({ length: 4 }, () => {
    const code = Math.floor(Math.random() * 26) + 65;  // 65 es el código ASCII para 'A'
    return String.fromCharCode(code);
  }).join('');
  
  return `${digits}${letters}`;
}
