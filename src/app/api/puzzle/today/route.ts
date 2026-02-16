import { NextResponse } from 'next/server';

export async function GET() {
  // Use Pacific Time since puzzles are published in that timezone
  const now = new Date();
  const today = now.toLocaleDateString('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const url = `/api/puzzle/${today}`;
  return NextResponse.redirect(new URL(url, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'), 302);
}
