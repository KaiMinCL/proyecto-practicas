import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';
import { apiErrorResponse, apiSuccessResponse } from '@/lib/utils';

export async function POST() {
  try {
    await clearAuthCookie();
    return apiSuccessResponse({ message: 'Logged out successfully' });
  } catch (error) {
    let errorMessage = 'Error during logout';
    if (error instanceof Error) errorMessage = error.message;
    return apiErrorResponse(errorMessage, 500);
  }
}