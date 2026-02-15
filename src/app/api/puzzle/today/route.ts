import { NextResponse } from 'next/server';

export async function GET() {
  const today = new Date().toISOString().split('T')[0];
  const url = `/api/puzzle/${today}`;
  return NextResponse.redirect(new URL(url, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'), 302);
}
