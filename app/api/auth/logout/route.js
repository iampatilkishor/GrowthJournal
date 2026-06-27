import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';

export async function POST(request) {
  try {
    const db   = getAdminClient();
    const body = await request.json().catch(() => ({}));
    const userId = body.supabase_user_id || (await getUserId(request));

    if (userId) {
      await db.from('profiles')
        .update({ broker_token: null, broker_token_expires_at: null })
        .eq('id', userId);
    } else {
      await db.from('profiles')
        .update({ broker_token: null, broker_token_expires_at: null })
        .not('broker_token', 'is', null);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
