import { NextResponse } from 'next/server';
import { getAdminClient, getUserId, todayIST } from '@/lib/supabase-server.js';

export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ pending: [] });

    const today = todayIST();
    // Get completed orders that have no journal entry
    const { data: orders } = await db.from('orders')
      .select('*, journal(id)')
      .eq('user_id', userId)
      .in('status', ['complete', 'filled'])
      .gte('placed_at', `${today}T00:00:00+05:30`)
      .lt('placed_at',  `${today}T23:59:59+05:30`)
      .order('placed_at', { ascending: false });

    const pending = (orders || []).filter(o => !o.journal || o.journal.length === 0)
      .map(o => ({ ...o, journal: undefined }));

    return NextResponse.json({ pending });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
