import { NextResponse } from 'next/server';
import { getNiftyLTP } from '@/lib/upstox.js';
import { getUserId } from '@/lib/supabase-server.js';

export async function GET(request) {
  try {
    const userId = await getUserId(request);
    const ltp = await getNiftyLTP(userId);
    return NextResponse.json({ ltp, timestamp: Date.now() });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
