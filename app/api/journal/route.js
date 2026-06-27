import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';

export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: entries } = await db.from('journal')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return NextResponse.json({ entries: entries || [] });
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
      // broker-linked fields
      orderId = null, planId = null,
      // shared fields
      followedPlan, entryReason = '', exitReason = '',
      emotion = '', outcomeNotes = '', pnl = null, tags = [],
      // Crorepati 365 manual fields
      instrument = null, direction = null,
      entryPrice = null, stopLoss = null, targetPrice = null, exitPrice = null,
      qty = null, grossPnl = null, brokerage = null, tradeDate = null,
    } = body;

    // For broker-linked entries, check for existing
    if (orderId) {
      const { data: existing } = await db.from('journal').select('id').eq('order_id', orderId).eq('user_id', userId).single();
      const now = new Date().toISOString();
      if (existing) {
        await db.from('journal').update({
          followed_plan: followedPlan ?? null,
          entry_reason: entryReason, exit_reason: exitReason,
          emotion, outcome_notes: outcomeNotes, pnl, tags,
          gross_pnl: grossPnl, brokerage, updated_at: now,
        }).eq('id', existing.id).eq('user_id', userId);
        return NextResponse.json({ success: true, id: existing.id });
      }
    }

    // Net P&L = gross_pnl - brokerage (if manual), else use pnl field
    const netPnl = grossPnl != null ? (grossPnl - (brokerage || 0)) : pnl;
    const today  = new Date().toISOString().slice(0, 10);

    const { data: entry, error } = await db.from('journal').insert({
      user_id:      userId,
      order_id:     orderId,
      plan_id:      planId,
      followed_plan: followedPlan ?? null,
      entry_reason: entryReason,
      exit_reason:  exitReason,
      emotion,
      outcome_notes: outcomeNotes,
      pnl:          netPnl,
      tags,
      // manual fields
      instrument,
      direction,
      entry_price:  entryPrice,
      stop_loss:    stopLoss,
      target_price: targetPrice,
      exit_price:   exitPrice,
      qty,
      gross_pnl:    grossPnl,
      brokerage,
      trade_date:   tradeDate || today,
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, id: entry.id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
