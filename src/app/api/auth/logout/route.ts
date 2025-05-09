import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() { 
  try {
    await clearAuthCookie();
    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json({ message: 'Error during logout' }, { status: 500 });
  }
}