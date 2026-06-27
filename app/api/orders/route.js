import { NextResponse } from 'next/server';
import { getAdminClient, getUserId, todayIST } from '@/lib/supabase-server.js';

export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const today = todayIST();
    const { data: orders } = await db.from('orders')
      .select(`*, journal(followed_plan, pnl, emotion, id)`)
      .eq('user_id', userId)
      .gte('placed_at', `${today}T00:00:00+05:30`)
      .lt('placed_at',  `${today}T23:59:59+05:30`)
      .order('placed_at', { ascending: false });

    const flat = (orders || []).map(o => {
      const j = o.journal?.[0] || null;
      return {
        ...o,
        journal: undefined,
        followed_plan: j?.followed_plan ?? null,
        pnl:           j?.pnl          ?? null,
        emotion:       j?.emotion      ?? null,
        journal_id:    j?.id           ?? null,
      };
    });

    return NextResponse.json({ orders: flat });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
