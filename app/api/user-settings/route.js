import { NextResponse } from 'next/server';
import { getAdminClient, getUserId, todayIST } from '@/lib/supabase-server.js';

const DEFAULTS = {
  starting_capital:  15000,
  journey_start_date: null,   // will use today if null
  currency:          'INR',
  currency_symbol:   '₹',
  goal_capital:      10000000,
  goal_days:         365,
  goal_date:         null,
  reminder_time:     null,
  trial_started_at:  null,
  tier:              'free',
  plan:              'trial',
};

export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await db.from('user_settings').select('*').eq('user_id', userId).single();
    const today = todayIST();
    const TRIAL_DAYS = 15;
    function computeTrial(settings) {
      if (!settings?.trial_started_at) return { trialDaysLeft: TRIAL_DAYS, trialExpired: false };
      const started = new Date(settings.trial_started_at);
      const now = new Date();
      const elapsed = Math.floor((now - started) / (1000 * 60 * 60 * 24));
      const left = Math.max(0, TRIAL_DAYS - elapsed);
      return { trialDaysLeft: left, trialExpired: left === 0 && settings.tier === 'free' };
    }
    const base = data
      ? { ...DEFAULTS, ...data, journey_start_date: data.journey_start_date || today }
      : { ...DEFAULTS, journey_start_date: today };

    const trial = computeTrial(base);

    // Auto-seal: if trial just expired and DB still says 'free', write 'expired' once
    if (trial.trialExpired && data?.tier === 'free') {
      await db.from('user_settings')
        .update({ tier: 'expired', updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      base.tier = 'expired';
    }

    return NextResponse.json({ settings: { ...base, ...trial } });
  } catch {
    return NextResponse.json({ settings: { ...DEFAULTS, journey_start_date: todayIST() } });
  }
}

export async function POST(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const today = todayIST();

    // Check if trial_started_at already set
    const { data: existing } = await db.from('user_settings').select('trial_started_at,tier,plan').eq('user_id', userId).single();

    const payload = {
      user_id:            userId,
      starting_capital:   body.startingCapital   != null ? parseFloat(body.startingCapital)  : DEFAULTS.starting_capital,
      journey_start_date: body.journeyStartDate  || today,
      currency:           body.currency          || DEFAULTS.currency,
      currency_symbol:    body.currencySymbol    || DEFAULTS.currency_symbol,
      goal_capital:       body.goalCapital       != null ? parseFloat(body.goalCapital)       : DEFAULTS.goal_capital,
      goal_days:          body.goalDays          != null ? parseInt(body.goalDays)            : DEFAULTS.goal_days,
      goal_date:          body.goalDate          || null,
      reminder_time:      body.reminderTime      || null,
      // Set trial_started_at on first save only; preserve tier/plan
      trial_started_at:   existing?.trial_started_at || new Date().toISOString(),
      tier:               body.tier  || existing?.tier  || 'free',
      plan:               body.plan  || existing?.plan  || 'trial',
      updated_at:         new Date().toISOString(),
    };

    const { data, error } = await db
      .from('user_settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, settings: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
