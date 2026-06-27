import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';

export async function PATCH(request, { params }) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body   = await request.json();
    const { maxQuantity, notes, exchange, symbol, planId } = body;

    const { data: item } = await db.from('watchlist').select('*').eq('id', id).eq('user_id', userId).single();
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db.from('watchlist').update({
      max_quantity: maxQuantity !== undefined ? Number(maxQuantity) : item.max_quantity,
      notes:        notes       !== undefined ? notes               : item.notes,
      exchange:     exchange    !== undefined ? exchange.toUpperCase() : item.exchange,
      symbol:       symbol      !== undefined ? symbol.toUpperCase()   : item.symbol,
      plan_id:      planId      !== undefined ? (planId || null)        : item.plan_id,
    }).eq('id', id).eq('user_id', userId);

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
    const { error } = await db.from('watchlist').delete().eq('id', id).eq('user_id', userId);
    if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
