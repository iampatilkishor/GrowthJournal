import { NextResponse } from 'next/server';
import { getAdminClient, getUserId, todayIST } from '@/lib/supabase-server.js';

export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM — returns all dates with entries

    if (month) {
      const [y, m] = month.split('-').map(Number);
      const from   = `${month}-01`;
      const nextM  = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const { data } = await db.from('daily_journal')
        .select('date, mental_state, market_bias, what_went_well, biggest_mistake')
        .eq('user_id', userId)
        .gte('date', from)
        .lt('date', nextM)
        .order('date');
      return NextResponse.json({ entries: data || [] });
    }

    const date = searchParams.get('date') || todayIST();

    const { data } = await db.from('daily_journal')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    return NextResponse.json({ entry: data || null });
  } catch (err) {
    return NextResponse.json({ entry: null });
  }
}

export async function POST(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      date,
      mentalState, marketBias,
      s1, s2, r1, r2,
      dailyLossLimit, profitTarget,
      whatWentWell, biggestMistake, tomorrowFocus,
    } = body;

    const record = {
      user_id:          userId,
      date:             date || todayIST(),
      mental_state:     mentalState   || null,
      market_bias:      marketBias    || null,
      s1:               s1 != null    ? parseFloat(s1) : null,
      s2:               s2 != null    ? parseFloat(s2) : null,
      r1:               r1 != null    ? parseFloat(r1) : null,
      r2:               r2 != null    ? parseFloat(r2) : null,
      daily_loss_limit: dailyLossLimit != null ? parseFloat(dailyLossLimit) : null,
      profit_target:    profitTarget  != null ? parseFloat(profitTarget)  : null,
      what_went_well:   whatWentWell  || null,
      biggest_mistake:  biggestMistake || null,
      tomorrow_focus:   tomorrowFocus || null,
      updated_at:       new Date().toISOString(),
    };

    const { data, error } = await db.from('daily_journal')
      .upsert(record, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, entry: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
