import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Simple auth check
function isAuthenticated(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Basic ')) return false;

  const credentials = atob(authHeader.slice(6));
  const [username, password] = credentials.split(':');

  return (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  );
}

export async function POST(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date } = body;

    // Revalidate the specific puzzle date path
    if (date) {
      revalidatePath(`/api/puzzle/${date}`);
    }

    // Also revalidate the home page and today's puzzle
    revalidatePath('/');
    revalidatePath('/api/puzzle/today');

    return NextResponse.json({
      success: true,
      message: `Cache revalidated${date ? ` for ${date}` : ''}`,
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Revalidation failed' },
      { status: 500 }
    );
  }
}
