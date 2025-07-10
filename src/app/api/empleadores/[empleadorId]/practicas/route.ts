import { NextRequest, NextResponse } from 'next/server';
import { EmpleadorService } from '@/lib/services/empleadorService';

export async function GET(req: NextRequest, context: { params: { empleadorId: string } }) {
  // Next.js 13+ dynamic route: context.params must be awaited if async
  const params = context.params;
  const empleadorId = parseInt(params.empleadorId, 10);
  if (isNaN(empleadorId)) {
    return NextResponse.json({ success: false, message: 'ID de empleador inválido' }, { status: 400 });
  }
  const result = await EmpleadorService.getPracticasByEmpleador(empleadorId);
  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json(result, { status: 500 });
  }
}
