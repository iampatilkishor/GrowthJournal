import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';

/* DELETE — only allowed for test trades */
export async function DELETE(request, { params }) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Verify ownership + trade_mode before deleting
    const { data: trade } = await db.from('journal')
      .select('id, trade_mode')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    if (trade.trade_mode !== 'test') {
      return NextResponse.json({ error: 'Only test trades can be deleted' }, { status: 403 });
    }

    const { error } = await db.from('journal').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* PATCH — move real → test (one-way only) */
export async function PATCH(request, { params }) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { tradeMode } = await request.json();

    // Verify ownership
    const { data: trade } = await db.from('journal')
      .select('id, trade_mode')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 });

    // Only allow real → test, never test → real
    if (tradeMode === 'real') {
      return NextResponse.json({ error: 'Cannot move a trade back to real' }, { status: 403 });
    }
    if (trade.trade_mode === 'challenge') {
      return NextResponse.json({ error: 'Challenge trades cannot be moved' }, { status: 403 });
    }

    const { error } = await db.from('journal')
      .update({ trade_mode: tradeMode, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
