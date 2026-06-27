import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';

const DEFAULT_RULES = {
  entry: [
    'Wait for confirmation candle before entering',
    'Only trade setups that match my plan',
    'Check volume before entry',
    'Ensure clear S/R levels are visible',
    'No entry in first 15 minutes after market open',
  ],
  risk: [
    'Max 1-2% risk per trade',
    'Daily loss limit: 3% of capital',
    'Weekly loss limit: 6% of capital',
    'Stop loss is mandatory on every trade',
    'No averaging down on losing positions',
  ],
  psychology: [
    'No revenge trading after a loss',
    'Take a break after 2 consecutive losses',
    'Do not trade when feeling emotional',
    'Stick to the plan — no FOMO entries',
    'Review journal before trading each day',
  ],
  exit: [
    'Exit at target or stop loss — no exceptions',
    'Trail stop loss once 1:1 is achieved',
    'Exit all positions by 3:00 PM',
    'Do not hold overnight without a plan',
    'Book partial profits at first target',
  ],
};

export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: rows } = await db.from('trading_rules')
      .select('*')
      .eq('user_id', userId);

    // Build category map, filling defaults for missing ones
    const categories = {};
    for (const [key, defaults] of Object.entries(DEFAULT_RULES)) {
      const row = (rows || []).find(r => r.category === key);
      categories[key] = {
        rules: row?.rules ?? defaults,
        notes: row?.notes ?? '',
      };
    }

    return NextResponse.json({ categories });
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
    const { category, rules, notes } = body;

    if (!category || !Array.isArray(rules)) {
      return NextResponse.json({ error: 'category and rules[] are required' }, { status: 400 });
    }

    const { data, error } = await db.from('trading_rules')
      .upsert({ user_id: userId, category, rules, notes: notes || null, updated_at: new Date().toISOString() }, { onConflict: 'user_id,category' })
      .select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, row: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
