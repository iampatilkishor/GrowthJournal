import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';

export async function GET(request, { params }) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const { data: plan, error } = await db.from('plans').select('*').eq('id', id).eq('user_id', userId).single();
    if (error || !plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const [{ data: scenarios }, { data: riskRules }] = await Promise.all([
      db.from('scenarios').select('*').eq('plan_id', id).order('created_at', { ascending: true }),
      db.from('risk_rules').select('*').eq('plan_id', id).limit(1).single(),
    ]);

    return NextResponse.json({ plan, scenarios: scenarios || [], riskRules: riskRules || null });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body   = await request.json();
    const {
      title, date, niftyRangeLow, niftyRangeHigh, bias,
      notes, maxTradesPerDay, maxLossPerDay, isActive,
      scenarios, riskRules,
    } = body;

    const { data: existing } = await db.from('plans').select('*').eq('id', id).eq('user_id', userId).single();
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db.from('plans').update({
      ...(title           !== undefined && { title }),
      ...(date            !== undefined && { date }),
      ...(niftyRangeLow   !== undefined && { nifty_range_low: niftyRangeLow }),
      ...(niftyRangeHigh  !== undefined && { nifty_range_high: niftyRangeHigh }),
      ...(bias            !== undefined && { bias }),
      ...(maxTradesPerDay !== undefined && { max_trades_per_day: maxTradesPerDay }),
      ...(maxLossPerDay   !== undefined && { max_loss_per_day: maxLossPerDay }),
      ...(notes           !== undefined && { notes }),
      ...(isActive        !== undefined && { is_active: isActive }),
    }).eq('id', id).eq('user_id', userId);

    if (scenarios) {
      await db.from('scenarios').delete().eq('plan_id', id);
      if (scenarios.length > 0) {
        await db.from('scenarios').insert(scenarios.map(s => ({
          plan_id: id,
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
    }

    if (riskRules) {
      const { data: existingRules } = await db.from('risk_rules').select('id').eq('plan_id', id).single();
      const rulesData = {
        max_quantity_per_script: riskRules.maxQuantityPerScript ?? 50,
        allow_duplicate_scripts: !!riskRules.allowDuplicateScripts,
        no_trade_before_minutes: riskRules.noTradeBeforeMinutes ?? 15,
        max_trades_per_day: maxTradesPerDay ?? existing.max_trades_per_day,
        max_loss_rupees: maxLossPerDay ?? existing.max_loss_per_day,
      };
      if (existingRules) {
        await db.from('risk_rules').update(rulesData).eq('plan_id', id);
      } else {
        await db.from('risk_rules').insert({ plan_id: id, ...rulesData });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    await db.from('watchlist').update({ plan_id: null }).eq('plan_id', id);
    const { error } = await db.from('plans').delete().eq('id', id).eq('user_id', userId);
    if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
