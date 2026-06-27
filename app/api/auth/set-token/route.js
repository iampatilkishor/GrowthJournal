import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { access_token, supabase_user_id } = body;
    if (!access_token) return NextResponse.json({ error: 'Missing access_token' }, { status: 400 });

    const db     = getAdminClient();
    const userId = supabase_user_id || (await getUserId(request));
    if (!userId) return NextResponse.json({ error: 'No user ID — make sure you are logged in' }, { status: 401 });

    const expiry = Math.floor(Date.now() / 1000) + 86400; // Unix seconds for bigint column

    // First check if the profiles row exists
    const { data: existing } = await db.from('profiles').select('id').eq('id', userId).single();

    let saveError;
    if (existing) {
      // Row exists — just update the broker columns
      const { error } = await db.from('profiles')
        .update({ broker_token: access_token, broker_token_expires_at: expiry, broker: 'upstox' })
        .eq('id', userId);
      saveError = error;
    } else {
      // Row doesn't exist — insert it
      const { error } = await db.from('profiles')
        .insert({ id: userId, broker_token: access_token, broker_token_expires_at: expiry, broker: 'upstox' });
      saveError = error;
    }

    if (saveError) {
      console.error('set-token save error:', saveError);
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
