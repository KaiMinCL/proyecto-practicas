import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Placeholder response
  return NextResponse.json({ message: 'Hello from API' });
}