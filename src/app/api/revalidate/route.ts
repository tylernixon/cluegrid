import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/adminAuth';

export async function POST(request: Request) {
  if (!isAdminAuthenticated(request)) {
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
