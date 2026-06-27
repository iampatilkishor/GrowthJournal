import { NextResponse } from 'next/server';
import { getFunds } from '@/lib/upstox.js';
import { getUserId } from '@/lib/supabase-server.js';

export async function GET(request) {
  try {
    const userId = await getUserId(request);
    const funds = await getFunds(userId);
    return NextResponse.json({ funds });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
