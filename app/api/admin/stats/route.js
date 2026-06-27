import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';

async function isAdmin(db, userId) {
  const { data } = await db.from('user_settings').select('role').eq('user_id', userId).single();
  return data?.role === 'admin';
}

export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isAdmin(db, userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const now    = new Date();
    const today  = now.toISOString().slice(0, 10);
    const day7   = new Date(now - 7  * 864e5).toISOString();
    const day30  = new Date(now - 30 * 864e5).toISOString();

    const [
      { count: totalUsers },
      { data: tiers },
      { count: tradesTotal },
      { count: trades7d },
      { data: pendingReqs },
      { data: approvedReqs },
    ] = await Promise.all([
      db.from('user_settings').select('*', { count: 'exact', head: true }),
      db.from('user_settings').select('tier'),
      db.from('trades').select('*', { count: 'exact', head: true }),
      db.from('trades').select('*', { count: 'exact', head: true }).gte('created_at', day7),
      db.from('payment_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      db.from('payment_requests').select('amount,currency,plan').eq('status', 'approved'),
    ]);

    const tierCounts = (tiers || []).reduce((acc, r) => {
      acc[r.tier || 'free'] = (acc[r.tier || 'free'] || 0) + 1;
      return acc;
    }, {});

    const revenue = (approvedReqs || []).reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

    // Trial expiry: users with trial_started_at set and tier = 'free'
    const { data: trialUsers } = await db
      .from('user_settings')
      .select('trial_started_at')
      .eq('tier', 'free')
      .not('trial_started_at', 'is', null);

    const TRIAL_DAYS = 15;
    let activeTrials = 0, expiredTrials = 0;
    for (const u of trialUsers || []) {
      const elapsed = Math.floor((now - new Date(u.trial_started_at)) / 864e5);
      if (elapsed < TRIAL_DAYS) activeTrials++;
      else expiredTrials++;
    }

    return NextResponse.json({
      totalUsers:    totalUsers || 0,
      tierCounts,
      activeTrials,
      expiredTrials,
      tradesTotal:   tradesTotal || 0,
      trades7d:      trades7d   || 0,
      pendingPayments: (pendingReqs || []).length,
      totalRevenue:  revenue,
      recentPending: pendingReqs || [],
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
