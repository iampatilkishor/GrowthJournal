import { NextResponse } from 'next/server';
import { getAdminClient, getUserId, todayIST } from '@/lib/supabase-server.js';

export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const today   = todayIST();
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    const [
      { data: allEntries },
      { data: todayEntries },
      { data: weekEntries },
      { data: todayDJ },
      { data: latestWeekly },
      { data: settings },
    ] = await Promise.all([
      db.from('journal').select('pnl, followed_plan, trade_date').eq('user_id', userId),
      db.from('journal').select('pnl, followed_plan').eq('user_id', userId).eq('trade_date', today),
      db.from('journal').select('pnl, followed_plan, trade_date').eq('user_id', userId).gte('trade_date', weekAgo),
      db.from('daily_journal').select('mental_state, market_bias, profit_target, daily_loss_limit').eq('user_id', userId).eq('date', today).single(),
      db.from('weekly_review').select('closing_capital, date_to').eq('user_id', userId).not('closing_capital', 'is', null).order('date_to', { ascending: false }).limit(1).single(),
      db.from('user_settings').select('*').eq('user_id', userId).single(),
    ]);

    function aggregate(entries) {
      const total    = (entries || []).length;
      const wins     = (entries || []).filter(e => (e.pnl || 0) > 0).length;
      const losses   = (entries || []).filter(e => (e.pnl || 0) < 0).length;
      const netPnl   = (entries || []).reduce((s, e) => s + (e.pnl || 0), 0);
      const followed = (entries || []).filter(e => e.followed_plan === true).length;
      const journaled= (entries || []).filter(e => e.followed_plan !== null).length;
      const winRate  = total    > 0 ? Math.round((wins     / total)    * 100) : null;
      const planPct  = journaled > 0 ? Math.round((followed / journaled) * 100) : null;
      return { total, wins, losses, netPnl, winRate, planPct };
    }

    const distinctDates  = new Set((allEntries || []).map(e => e.trade_date).filter(Boolean));
    const daysJournaled  = distinctDates.size;
    const allTimeStats   = aggregate(allEntries);
    const totalPnl       = allTimeStats.netPnl;

    // ── Settings with fallbacks ──────────────────────────────────────────────
    const startingCapital   = parseFloat(settings?.starting_capital  ?? 15000);
    const journeyStartDate  = settings?.journey_start_date ?? today;
    const currency          = settings?.currency        ?? 'INR';
    const currencySymbol    = settings?.currency_symbol ?? '₹';
    const goalCapital       = parseFloat(settings?.goal_capital ?? 10000000);
    const goalDays          = settings?.goal_days  ?? 365;
    const goalDate          = settings?.goal_date  ?? null;

    // ── Current capital ──────────────────────────────────────────────────────
    const currentCapital = latestWeekly?.closing_capital ?? (startingCapital + totalPnl);

    // ── Journey day ──────────────────────────────────────────────────────────
    const startMs     = new Date(journeyStartDate + 'T00:00:00').getTime();
    const journeyDay  = Math.max(1, Math.floor((Date.now() - startMs) / 86400000) + 1);

    // ── Goal deadline / days remaining ──────────────────────────────────────
    let totalGoalDays    = goalDays;
    let daysRemaining    = null;
    let goalDeadline     = null;

    if (goalDate) {
      goalDeadline  = goalDate;
      const deadMs  = new Date(goalDate + 'T00:00:00').getTime();
      totalGoalDays = Math.max(1, Math.floor((deadMs - startMs) / 86400000));
      daysRemaining = Math.max(0, Math.floor((deadMs - Date.now()) / 86400000));
    } else {
      totalGoalDays = goalDays;
      const deadMs  = startMs + goalDays * 86400000;
      daysRemaining = Math.max(0, Math.floor((deadMs - Date.now()) / 86400000));
      goalDeadline  = new Date(deadMs).toISOString().slice(0, 10);
    }

    const progress = Math.min(100, Math.max(0,
      ((currentCapital - startingCapital) / (goalCapital - startingCapital)) * 100
    ));

    return NextResponse.json({
      allTime:    { ...allTimeStats, daysJournaled },
      today:      aggregate(todayEntries),
      week:       aggregate(weekEntries),
      preMarket: {
        filled:       !!(todayDJ?.mental_state || todayDJ?.market_bias),
        mentalState:  todayDJ?.mental_state  || null,
        marketBias:   todayDJ?.market_bias   || null,
        profitTarget: todayDJ?.profit_target || null,
        lossLimit:    todayDJ?.daily_loss_limit || null,
      },
      journey: {
        currency,
        currencySymbol,
        startingCapital,
        journeyStartDate,
        journeyDay,
        totalGoalDays,
        daysRemaining,
        goalDeadline,
        currentCapital,
        goalCapital,
        progress,
        isSetup:      !!settings,   // false = first-time user, show onboarding
        reminderTime: settings?.reminder_time ?? null,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
