import { NextResponse } from 'next/server';
import { searchInstruments } from '@/lib/upstox.js';
import { getUserId } from '@/lib/supabase-server.js';

export async function GET(request) {
  try {
    const userId = await getUserId(request);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';
    if (!query) return NextResponse.json({ results: [] });
    const results = await searchInstruments(query, userId);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
