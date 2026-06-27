import { NextResponse } from 'next/server';
import { getAdminClient, getUserId, todayIST } from '@/lib/supabase-server.js';

export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ entries: [], stats: {} });

    const today = todayIST();

    // Fetch broker-linked entries (join with orders)
    const { data: linkedEntries } = await db.from('journal')
      .select(`*, orders(trading_symbol, transaction_type, quantity, average_price, status, placed_at)`)
      .eq('user_id', userId)
      .not('order_id', 'is', null)
      .gte('trade_date', today)
      .lte('trade_date', today)
      .order('created_at', { ascending: false });

    // Fetch manual entries (no order_id)
    const { data: manualEntries } = await db.from('journal')
      .select('*')
      .eq('user_id', userId)
      .is('order_id', null)
      .eq('trade_date', today)
      .order('created_at', { ascending: false });

    const flatLinked = (linkedEntries || []).map(e => ({
      ...e,
      trading_symbol:   e.orders?.trading_symbol   ?? e.instrument,
      transaction_type: e.orders?.transaction_type ?? e.direction,
      quantity:         e.orders?.quantity          ?? e.qty,
      average_price:    e.orders?.average_price     ?? e.entry_price,
      order_status:     e.orders?.status,
      placed_at:        e.orders?.placed_at,
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

    const flat = [...flatLinked, ...flatManual].sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    );

    const totalTrades = flat.length;
    const journaled   = flat.filter(e => e.followed_plan !== null).length;
    const followed    = flat.filter(e => e.followed_plan === true).length;
    const planPct     = journaled > 0 ? Math.round((followed / journaled) * 100) : null;
    const totalPnl    = flat.reduce((s, e) => s + (e.pnl || 0), 0);

    return NextResponse.json({ entries: flat, stats: { totalTrades, journaled, planPct, totalPnl } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
