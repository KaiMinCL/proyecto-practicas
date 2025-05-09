import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getUserSession();
    if (session) {
      return NextResponse.json(session);
    }
    return NextResponse.json(null, { status: 200 }); // No session found
  } catch (error) {
    console.error('Error fetching user session:', error);
    return NextResponse.json({ message: 'Error fetching session' }, { status: 500 });
  }
}