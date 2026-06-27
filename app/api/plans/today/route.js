import { NextResponse } from 'next/server';
import { getAdminClient, getUserId, todayIST } from '@/lib/supabase-server.js';
import { getTodayAdherenceScore } from '@/lib/ruleEngine.js';

export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ plan: null });

    const today = todayIST();
    const { data: plan } = await db.from('plans')
      .select('*').eq('user_id', userId).eq('date', today).eq('is_active', true)
      .order('created_at', { ascending: false }).limit(1).single();

    if (!plan) return NextResponse.json({ plan: null });

    const [{ data: scenarios }, { data: rules }] = await Promise.all([
      db.from('scenarios').select('*').eq('plan_id', plan.id).order('created_at', { ascending: true }),
      db.from('risk_rules').select('*').eq('plan_id', plan.id).limit(1).single(),
    ]);

    const adherenceScore = await getTodayAdherenceScore(userId);

    return NextResponse.json({
      plan: { ...plan, scenarios: scenarios || [], rules: rules || null, adherenceScore },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
