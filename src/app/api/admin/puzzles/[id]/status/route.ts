import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin-auth';

// Use service role for admin operations
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(url, key);
}

// PATCH /api/admin/puzzles/[id]/status -- Update puzzle status (publish/unpublish)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', message: 'Request body must be valid JSON' },
      { status: 400 },
    );
  }

  const { status } = body;

  if (!status || !['draft', 'published'].includes(status)) {
    return NextResponse.json(
      { error: 'INVALID_STATUS', message: 'Status must be "draft" or "published"' },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();

  // Verify puzzle exists
  const { data: existing, error: fetchError } = await supabase
    .from('puzzles')
    .select('id, status')
    .eq('id', params.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: 'PUZZLE_NOT_FOUND', message: 'Puzzle not found' },
      { status: 404 },
    );
  }

  // Update status
  const updateData: { status: string; published_at?: string | null } = { status };

  // Set published_at timestamp when publishing
  if (status === 'published' && existing.status !== 'published') {
    updateData.published_at = new Date().toISOString();
  } else if (status === 'draft') {
    updateData.published_at = null;
  }

  const { error: updateError } = await supabase
    .from('puzzles')
    .update(updateData)
    .eq('id', params.id);

  if (updateError) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to update status' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    id: params.id,
    status,
  });
}
