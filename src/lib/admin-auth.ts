import { NextResponse } from 'next/server';

/**
 * Validates admin credentials via Basic Auth.
 *
 * Expects the `Authorization` header in the format:
 *   Authorization: Basic base64(username:password)
 *
 * Checks against ADMIN_USERNAME and ADMIN_PASSWORD env vars.
 *
 * Returns null if authorized, or a 401 NextResponse if not.
 */
export function requireAdmin(request: Request): NextResponse | null {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Admin credentials not configured' },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' },
      {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Cluegrid Admin"' },
      },
    );
  }

  const base64Credentials = authHeader.slice('Basic '.length);
  let decoded: string;
  try {
    decoded = atob(base64Credentials);
  } catch {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Invalid credentials encoding' },
      { status: 401 },
    );
  }

  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex === -1) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Invalid credentials format' },
      { status: 401 },
    );
  }

  const providedUsername = decoded.slice(0, separatorIndex);
  const providedPassword = decoded.slice(separatorIndex + 1);

  // Constant-time comparison would be ideal, but for MVP basic auth
  // with server-side env vars this is acceptable.
  if (providedUsername !== username || providedPassword !== password) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Invalid credentials' },
      { status: 401 },
    );
  }

  return null; // Authorized
}
