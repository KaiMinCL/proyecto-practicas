import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/utils'; 
export async function GET() {
  try {
    const session = await getUserSession();
    // if (session) { // apiSuccessResponse maneja el null si es necesario
    //   return apiSuccessResponse(session);
    // }
    // return apiSuccessResponse(null); // O manejar el caso de no sesión más explícitamente
    return NextResponse.json(session || null, { status: 200 }); // Manteniendo la lógica original simple
  } catch (error) {
    let errorMessage = 'Error fetching session';
    if (error instanceof Error) errorMessage = error.message;
    return apiErrorResponse(errorMessage, 500);
  }
}