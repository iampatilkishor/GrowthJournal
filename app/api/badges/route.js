import { NextResponse } from 'next/server';
import { getAdminClient, getUserId, todayIST } from '@/lib/supabase-server.js';

/* ── Badge catalogue ─────────────────────────────────────────────────────── */
export const BADGE_DEFS = [
  // Journaling streaks
  { id: 'streak_7',   cat: 'streak',     icon: '🔥', name: 'First Week',        desc: 'Journal 7 days in a row',                threshold: 7   },
  { id: 'streak_30',  cat: 'streak',     icon: '🌟', name: 'Month Strong',       desc: 'Journal 30 days in a row',               threshold: 30  },
  { id: 'streak_60',  cat: 'streak',     icon: '💪', name: 'Iron Will',          desc: 'Journal 60 days in a row',               threshold: 60  },
  { id: 'streak_100', cat: 'streak',     icon: '👑', name: 'Century Legend',     desc: 'Journal 100 days in a row',              threshold: 100 },
  // Trade milestones
  { id: 'trades_1',   cat: 'milestone',  icon: '📋', name: 'First Entry',        desc: 'Log your very first trade',              threshold: 1   },
  { id: 'trades_10',  cat: 'milestone',  icon: '🚀', name: 'Getting Started',    desc: 'Log 10 trades',                          threshold: 10  },
  { id: 'trades_50',  cat: 'milestone',  icon: '📊', name: 'Consistent Logger',  desc: 'Log 50 trades',                          threshold: 50  },
  { id: 'trades_100', cat: 'milestone',  icon: '💯', name: 'Century Club',       desc: 'Log 100 trades',                         threshold: 100 },
  { id: 'trades_500', cat: 'milestone',  icon: '🏅', name: 'Veteran Trader',     desc: 'Log 500 trades',                         threshold: 500 },
  // Discipline
  { id: 'disc_week',  cat: 'discipline', icon: '✅', name: 'Sharp Trader',       desc: '80%+ plan adherence in a single week',   threshold: 80  },
  { id: 'disc_month', cat: 'discipline', icon: '🎯', name: 'Discipline Master',  desc: '80%+ plan adherence in a single month',  threshold: 80  },
  { id: 'disc_elite', cat: 'discipline', icon: '⚡', name: 'Elite Discipline',   desc: '90%+ plan adherence in a single month',  threshold: 90  },
  // Capital goal progress
  { id: 'cap_25',     cat: 'capital',    icon: '🌱', name: 'First Milestone',    desc: 'Reach 25% of your capital goal',         threshold: 25  },
  { id: 'cap_50',     cat: 'capital',    icon: '🔑', name: 'Halfway There',      desc: 'Reach 50% of your capital goal',         threshold: 50  },
  { id: 'cap_75',     cat: 'capital',    icon: '⭐', name: 'Almost There',       desc: 'Reach 75% of your capital goal',         threshold: 75  },
  { id: 'cap_100',    cat: 'capital',    icon: '🏆', name: 'Goal Achieved',      desc: 'Reach 100% of your capital goal',        threshold: 100 },
];

/* ── ISO week key (YYYY-Www) ─────────────────────────────────────────────── */
function weekKey(dateStr) {
  const d   = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week      = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/* ── Previous IST date ───────────────────────────────────────────────────── */
function prevDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const today = todayIST();

    /* Fetch all needed data in parallel */
    const [
      { data: journalRows },
      { data: djRows },
      { data: latestWeekly },
      { data: settings },
      { data: storedBadges },
    ] = await Promise.all([
      db.from('journal')
        .select('trade_date, followed_plan, pnl')
        .eq('user_id', userId),
      db.from('daily_journal')
        .select('date')
        .eq('user_id', userId),
      db.from('weekly_review')
        .select('closing_capital')
        .eq('user_id', userId)
        .not('closing_capital', 'is', null)
        .order('date_to', { ascending: false })
        .limit(1)
        .single(),
      db.from('user_settings')
        .select('starting_capital, goal_capital')
        .eq('user_id', userId)
        .single(),
      db.from('user_badges')
        .select('badge_id, earned_at')
        .eq('user_id', userId),
    ]);

    /* ── 1. Total trades ── */
    const totalTrades = (journalRows || []).length;

    /* ── 2. Journaling streak ── */
    const allDates = new Set([
      ...(djRows      || []).map(r => r.date),
      ...(journalRows || []).map(r => r.trade_date).filter(Boolean),
    ]);

    let journalStreak = 0;
    let check = allDates.has(today) ? today : prevDay(today);
    while (allDates.has(check)) {
      journalStreak++;
      check = prevDay(check);
    }

    /* ── 3. Best plan adherence by week and by month ── */
    const journaled = (journalRows || []).filter(
      r => r.followed_plan !== null && r.trade_date
    );

    const byWeek  = {};
    const byMonth = {};
    for (const r of journaled) {
      const wk = weekKey(r.trade_date);
      const mo = r.trade_date.slice(0, 7);
      if (!byWeek[wk])  byWeek[wk]  = { f: 0, t: 0 };
      if (!byMonth[mo]) byMonth[mo] = { f: 0, t: 0 };
      byWeek[wk].t++;
      byMonth[mo].t++;
      if (r.followed_plan) { byWeek[wk].f++; byMonth[mo].f++; }
    }

    let bestWeekPct  = 0;
    for (const w of Object.values(byWeek))  {
      if (w.t >= 3)  bestWeekPct  = Math.max(bestWeekPct,  Math.round((w.f / w.t) * 100));
    }
    let bestMonthPct = 0;
    for (const m of Object.values(byMonth)) {
      if (m.t >= 10) bestMonthPct = Math.max(bestMonthPct, Math.round((m.f / m.t) * 100));
    }

    /* ── 4. Capital goal progress ── */
    const startCap   = parseFloat(settings?.starting_capital ?? 0);
    const goalCap    = parseFloat(settings?.goal_capital     ?? 0);
    const totalPnl   = (journalRows || []).reduce((s, r) => s + (r.pnl || 0), 0);
    const currentCap = latestWeekly?.closing_capital ?? (startCap + totalPnl);

    let goalPct = 0;
    if (goalCap > startCap && goalCap > 0) {
      goalPct = Math.min(100, Math.max(0,
        ((currentCap - startCap) / (goalCap - startCap)) * 100
      ));
    }

    /* ── Evaluate which badges are currently earned ── */
    const checks = {
      streak_7:    journalStreak >= 7,
      streak_30:   journalStreak >= 30,
      streak_60:   journalStreak >= 60,
      streak_100:  journalStreak >= 100,
      trades_1:    totalTrades >= 1,
      trades_10:   totalTrades >= 10,
      trades_50:   totalTrades >= 50,
      trades_100:  totalTrades >= 100,
      trades_500:  totalTrades >= 500,
      disc_week:   bestWeekPct  >= 80,
      disc_month:  bestMonthPct >= 80,
      disc_elite:  bestMonthPct >= 90,
      cap_25:      goalPct >= 25,
      cap_50:      goalPct >= 50,
      cap_75:      goalPct >= 75,
      cap_100:     goalPct >= 100,
    };

    /* ── Persist newly earned badges ── */
    const storedMap = Object.fromEntries(
      (storedBadges || []).map(r => [r.badge_id, r.earned_at])
    );

    const nowIso    = new Date().toISOString();
    const toInsert  = BADGE_DEFS
      .filter(b => checks[b.id] && !storedMap[b.id])
      .map(b => ({ user_id: userId, badge_id: b.id, earned_at: nowIso }));

    if (toInsert.length > 0) {
      await db.from('user_badges').upsert(toInsert, { onConflict: 'user_id,badge_id' });
      for (const row of toInsert) storedMap[row.badge_id] = row.earned_at;
    }

    /* ── Build final badge list ── */
    const newlyEarned = toInsert.map(r => r.badge_id);

    const badges = BADGE_DEFS.map(b => ({
      ...b,
      earned:    checks[b.id] ?? false,
      earned_at: storedMap[b.id] ?? null,
      isNew:     newlyEarned.includes(b.id),
    }));

    return NextResponse.json({
      badges,
      newlyEarned,
      stats: {
        journalStreak,
        totalTrades,
        bestWeekPct,
        bestMonthPct,
        goalPct: Math.round(goalPct),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
