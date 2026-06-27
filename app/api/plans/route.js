import { NextResponse } from 'next/server';
import { getAdminClient, getUserId, todayIST } from '@/lib/supabase-server.js';

export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: plans } = await db.from('plans')
      .select(`*, scenarios(count), watchlist(count)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({ plans: plans || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      title, date, niftyRangeLow, niftyRangeHigh, bias = 'neutral',
      notes = '', maxTradesPerDay = 5, maxLossPerDay = 5000,
      instruments = [], scenarios = [], riskRules = {},
    } = body;

    if (!title || !date) return NextResponse.json({ error: 'title and date are required' }, { status: 400 });

    // Deactivate existing active plan for same date
    await db.from('plans').update({ is_active: false }).eq('user_id', userId).eq('date', date).eq('is_active', true);

    // Insert plan
    const { data: plan, error: planErr } = await db.from('plans').insert({
      user_id: userId, date, title,
      nifty_range_low: niftyRangeLow || null,
      nifty_range_high: niftyRangeHigh || null,
      bias, instruments, max_trades_per_day: maxTradesPerDay,
      max_loss_per_day: maxLossPerDay, notes, is_active: true,
    }).select().single();
    if (planErr) throw planErr;

    // Insert scenarios
    if (scenarios.length > 0) {
      await db.from('scenarios').insert(scenarios.map(s => ({
        plan_id: plan.id,
        condition_type: s.conditionType || 'range',
        condition_value_low: s.conditionValueLow || null,
        condition_value_high: s.conditionValueHigh || null,
        action: s.action || 'buy_ce',
        instrument: (s.instrument || '').toUpperCase(),
        max_quantity: s.maxQuantity || 1,
        entry_reason: s.entryReason || '',
        target_price: s.targetPrice || null,
        stop_loss: s.stopLoss || null,
        exit_reason: s.exitReason || '',
        product: s.product || 'I',
      })));
    }

    // Insert risk rules
    await db.from('risk_rules').insert({
      plan_id: plan.id,
      max_quantity_per_script: riskRules.maxQuantityPerScript || 50,
      allow_duplicate_scripts: !!riskRules.allowDuplicateScripts,
      no_trade_before_minutes: riskRules.noTradeBeforeMinutes ?? 15,
      max_trades_per_day: maxTradesPerDay,
      max_loss_rupees: maxLossPerDay,
    });

    return NextResponse.json({ success: true, planId: plan.id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
