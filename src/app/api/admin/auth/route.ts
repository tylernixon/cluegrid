import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_PASSWORD;

    if (!validUsername || !validPassword) {
      return NextResponse.json(
        { error: 'SERVER_ERROR', message: 'Admin credentials not configured' },
        { status: 500 },
      );
    }

    if (username !== validUsername || password !== validPassword) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Invalid credentials' },
        { status: 401 },
      );
    }

    // Create a simple session token (in production, use a proper JWT or session ID)
    const sessionToken = Buffer.from(`${username}:${Date.now()}`).toString('base64');

    // Set the session cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'BAD_REQUEST', message: 'Invalid request body' },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return NextResponse.json({ success: true });
}
