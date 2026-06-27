import { NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/upstox.js';
import { getUserId, getAdminClient } from '@/lib/supabase-server.js';

export async function GET(request) {
  try {
    const userId  = await getUserId(request);
    const profile = await getUserProfile(userId);
    return NextResponse.json({ profile });
  } catch (err) {
    // Upstox 401 = token expired/invalid — clear it so UI shows reconnect screen
    const is401 = err?.response?.status === 401 || err?.message?.includes('401');
    if (is401) {
      try {
        const db     = getAdminClient();
        const userId = await getUserId(request);
        if (userId) {
          await db.from('profiles')
            .update({ broker_token: null, broker_token_expires_at: null })
            .eq('id', userId);
        }
      } catch {}
      return NextResponse.json({ error: 'TOKEN_EXPIRED' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
