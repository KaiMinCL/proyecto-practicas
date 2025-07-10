import { NextResponse } from 'next/server';
import { SedeService } from '@/lib/services';

export async function GET() {
  // Devuelve solo sedes activas (id y nombre)
  const result = await SedeService.getSedesActivas();
  if (result.success) {
    return NextResponse.json(result.data);
  } else {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
}
