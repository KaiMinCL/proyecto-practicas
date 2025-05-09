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