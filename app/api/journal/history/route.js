import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';

export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ grouped: [], summaries: [] });

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

    // Broker-linked entries
    const { data: linkedEntries } = await db.from('journal')
      .select(`*, orders(trading_symbol, transaction_type, quantity, average_price, status, placed_at)`)
      .eq('user_id', userId)
      .not('order_id', 'is', null)
      .gte('trade_date', from)
      .order('created_at', { ascending: false });

    // Manual entries
    const { data: manualEntries } = await db.from('journal')
      .select('*')
      .eq('user_id', userId)
      .is('order_id', null)
      .gte('trade_date', from)
      .order('created_at', { ascending: false });

    const flatLinked = (linkedEntries || []).map(e => ({
      ...e,
      trading_symbol:   e.orders?.trading_symbol   ?? e.instrument,
      transaction_type: e.orders?.transaction_type ?? e.direction,
      quantity:         e.orders?.quantity          ?? e.qty,
      average_price:    e.orders?.average_price     ?? e.entry_price,
      order_status:     e.orders?.status,
      placed_at:        e.orders?.placed_at,
      trade_date:       e.trade_date || e.orders?.placed_at?.slice(0, 10),
      orders:           undefined,
      is_manual:        false,
    }));

    const flatManual = (manualEntries || []).map(e => ({
      ...e,
      trading_symbol:   e.instrument,
      transaction_type: e.direction,
      quantity:         e.qty,
      average_price:    e.entry_price,
      is_manual:        true,
    }));

    const flat = [...flatLinked, ...flatManual];

    // Group by trade_date
    const byDate = {};
    for (const e of flat) {
      const d = e.trade_date;
      if (!d) continue;
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(e);
    }

    const grouped = Object.entries(byDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, dayEntries]) => {
        const journaled = dayEntries.filter(e => e.followed_plan !== null).length;
        const followed  = dayEntries.filter(e => e.followed_plan === true).length;
        const score     = journaled > 0 ? Math.round((followed / journaled) * 100) : null;
        const pnl       = dayEntries.reduce((s, e) => s + (e.pnl || 0), 0);
        return { date, entries: dayEntries, score, pnl, total: dayEntries.length };
      });

    const { data: summaries } = await db.from('daily_summary')
      .select('*').eq('user_id', userId)
      .gte('date', from)
      .order('date', { ascending: false });

    return NextResponse.json({ grouped, summaries: summaries || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
