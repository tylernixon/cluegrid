import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware - handles admin route authentication.
 *
 * For /admin routes (both pages and API), we check for Basic Auth.
 * On failure, we prompt the browser for credentials.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (pages) and /api/admin routes
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  // If credentials are not configured, deny access
  if (!username || !password) {
    return new NextResponse('Admin credentials not configured', {
      status: 500,
    });
  }

  const authHeader = request.headers.get('authorization');

  // No auth header - prompt for credentials
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="gist Admin"',
      },
    });
  }

  // Decode and verify credentials
  const base64Credentials = authHeader.slice('Basic '.length);
  let decoded: string;
  try {
    decoded = atob(base64Credentials);
  } catch {
    return new NextResponse('Invalid credentials encoding', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="gist Admin"',
      },
    });
  }

  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex === -1) {
    return new NextResponse('Invalid credentials format', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="gist Admin"',
      },
    });
  }

  const providedUsername = decoded.slice(0, separatorIndex);
  const providedPassword = decoded.slice(separatorIndex + 1);

  if (providedUsername !== username || providedPassword !== password) {
    return new NextResponse('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="gist Admin"',
      },
    });
  }

  // Authorized - continue
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
