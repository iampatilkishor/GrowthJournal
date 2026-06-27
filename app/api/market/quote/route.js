import { NextResponse } from 'next/server';
import { getQuote } from '@/lib/upstox.js';
import { getUserId } from '@/lib/supabase-server.js';

export async function GET(request) {
  try {
    const userId = await getUserId(request);
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });
    const data = await getQuote(key, userId);
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
