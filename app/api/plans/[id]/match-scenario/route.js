import { NextResponse } from 'next/server';
import { getNiftyLTP } from '@/lib/upstox.js';
import { matchScenario } from '@/lib/ruleEngine.js';
import { getUserId } from '@/lib/supabase-server.js';

export async function GET(request, { params }) {
  try {
    const userId  = await getUserId(request);
    const { id }  = await params;
    const niftyLevel = await getNiftyLTP(userId);
    const matched    = await matchScenario(id, niftyLevel);
    return NextResponse.json({ niftyLevel, matchedScenario: matched || null });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
