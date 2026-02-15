import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { word } = await request.json();

    if (!word || typeof word !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    const normalizedWord = word.toUpperCase().trim();

    // Check if word exists in database
    const { data, error } = await supabase
      .from('words')
      .select('word')
      .eq('word', normalizedWord)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (word not found)
      console.error('Word validation error:', error);
      return NextResponse.json(
        { valid: false, error: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ valid: !!data });
  } catch (err) {
    console.error('Word validation error:', err);
    return NextResponse.json(
      { valid: false, error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
