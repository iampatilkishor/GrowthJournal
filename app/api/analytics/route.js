import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';

const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [
      { data: trades },
      { data: dailyJournals },
      { data: settings },
    ] = await Promise.all([
      db.from('journal')
        .select('pnl, trade_date, instrument, direction, emotion, followed_plan, entry_price, exit_price, created_at')
        .eq('user_id', userId)
        .order('trade_date', { ascending: true }),
      db.from('daily_journal')
        .select('date, mental_state')
        .eq('user_id', userId),
      db.from('user_settings').select('*').eq('user_id', userId).single(),
    ]);

    const allTrades = trades || [];
    const allDJ     = dailyJournals || [];
    const sym       = settings?.currency_symbol ?? '₹';
    const startCap  = parseFloat(settings?.starting_capital ?? 15000);

    /* ── 1. Daily P&L + capital series ─────────────────────────── */
    const byDate = {};
    for (const t of allTrades) {
      const d = t.trade_date;
      if (!d) continue;
      if (!byDate[d]) byDate[d] = { date: d, pnl: 0, trades: 0, wins: 0, losses: 0 };
      byDate[d].pnl    += t.pnl || 0;
      byDate[d].trades += 1;
      if ((t.pnl || 0) > 0) byDate[d].wins++;
      if ((t.pnl || 0) < 0) byDate[d].losses++;
    }
    let running = startCap, peak = startCap;
    const dailySeries = Object.keys(byDate).sort().map(d => {
      running += byDate[d].pnl;
      if (running > peak) peak = running;
      const drawdown = peak > 0 ? ((running - peak) / peak) * 100 : 0;
      return { date: d, pnl: Math.round(byDate[d].pnl), capital: Math.round(running), drawdown: parseFloat(drawdown.toFixed(2)), trades: byDate[d].trades };
    });

    /* ── 2. Calendar heatmap (last 365 days) ───────────────────── */
    const today   = new Date();
    const yearAgo = new Date(today); yearAgo.setFullYear(today.getFullYear() - 1);
    const cal     = {};
    for (let d = new Date(yearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const k = d.toISOString().slice(0, 10);
      cal[k] = { date: k, pnl: 0, trades: 0 };
    }
    for (const t of allTrades) {
      if (t.trade_date && cal[t.trade_date]) {
        cal[t.trade_date].pnl    += t.pnl || 0;
        cal[t.trade_date].trades += 1;
      }
    }
    const djDates = new Set(allDJ.map(j => j.date));
    const calendarData = Object.values(cal).sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({ ...d, pnl: Math.round(d.pnl), journaled: djDates.has(d.date) }));

    /* ── 3. By instrument (top 10) ─────────────────────────────── */
    const byInst = {};
    for (const t of allTrades) {
      const inst = (t.instrument || 'Unknown').toUpperCase();
      if (!byInst[inst]) byInst[inst] = { instrument: inst, total: 0, wins: 0, losses: 0, pnl: 0 };
      byInst[inst].total++;
      byInst[inst].pnl += t.pnl || 0;
      if ((t.pnl || 0) > 0) byInst[inst].wins++;
      if ((t.pnl || 0) < 0) byInst[inst].losses++;
    }
    const byInstrument = Object.values(byInst)
      .map(i => ({ ...i, pnl: Math.round(i.pnl), winRate: i.total > 0 ? Math.round((i.wins / i.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total).slice(0, 10);

    /* ── 4. By day of week ──────────────────────────────────────── */
    const dow = Array.from({ length: 7 }, (_, i) => ({ day: DOW[i], short: DOW[i].slice(0,3), total: 0, wins: 0, losses: 0, pnl: 0 }));
    for (const t of allTrades) {
      if (!t.trade_date) continue;
      const d = new Date(t.trade_date + 'T12:00:00').getDay();
      dow[d].total++;
      dow[d].pnl += t.pnl || 0;
      if ((t.pnl || 0) > 0) dow[d].wins++;
      if ((t.pnl || 0) < 0) dow[d].losses++;
    }
    const byDow = dow.filter((_, i) => i >= 1 && i <= 5)
      .map(d => ({ ...d, pnl: Math.round(d.pnl), winRate: d.total > 0 ? Math.round((d.wins / d.total) * 100) : null }));

    /* ── 5. By emotion ──────────────────────────────────────────── */
    const emMap = {};
    for (const t of allTrades) {
      const e = t.emotion?.trim() || 'Not recorded';
      if (!emMap[e]) emMap[e] = { emotion: e, total: 0, wins: 0, pnl: 0 };
      emMap[e].total++;
      emMap[e].pnl += t.pnl || 0;
      if ((t.pnl || 0) > 0) emMap[e].wins++;
    }
    const byEmotion = Object.values(emMap)
      .map(e => ({ ...e, pnl: Math.round(e.pnl), winRate: e.total > 0 ? Math.round((e.wins / e.total) * 100) : 0, avgPnl: e.total > 0 ? Math.round(e.pnl / e.total) : 0 }))
      .sort((a, b) => b.total - a.total);

    /* ── 6. Plan correlation ────────────────────────────────────── */
    const pY = allTrades.filter(t => t.followed_plan === true);
    const pN = allTrades.filter(t => t.followed_plan === false);
    const wr  = arr => arr.length > 0 ? Math.round((arr.filter(t => (t.pnl||0)>0).length / arr.length) * 100) : null;
    const ap  = arr => arr.length > 0 ? Math.round(arr.reduce((s,t)=>s+(t.pnl||0),0)/arr.length) : null;
    const planCorrelation = {
      followed:    { count: pY.length, winRate: wr(pY), avgPnl: ap(pY) },
      notFollowed: { count: pN.length, winRate: wr(pN), avgPnl: ap(pN) },
    };

    /* ── 7. Streaks ─────────────────────────────────────────────── */
    const sorted = [...allTrades].sort((a,b)=>(a.trade_date||'').localeCompare(b.trade_date||''));
    let maxW=0, maxL=0, tw=0, tl=0;
    for (const t of sorted) {
      if ((t.pnl||0) > 0) { tw++; tl=0; } else if ((t.pnl||0) < 0) { tl++; tw=0; }
      if (tw > maxW) maxW = tw;
      if (tl > maxL) maxL = tl;
    }
    let curStreak = 0;
    if (sorted.length > 0) {
      const rev = [...sorted].reverse();
      const isW = (rev[0]?.pnl||0) > 0;
      for (const t of rev) {
        if (isW && (t.pnl||0) > 0) curStreak++;
        else if (!isW && (t.pnl||0) < 0) curStreak++;
        else break;
      }
      curStreak = isW ? curStreak : -curStreak;
    }

    /* ── 8. Summary ─────────────────────────────────────────────── */
    const wins   = allTrades.filter(t => (t.pnl||0) > 0);
    const losses = allTrades.filter(t => (t.pnl||0) < 0);
    const avgWin  = wins.length  > 0 ? Math.round(wins.reduce((s,t)=>s+(t.pnl||0),0)   / wins.length)   : null;
    const avgLoss = losses.length > 0 ? Math.round(losses.reduce((s,t)=>s+(t.pnl||0),0) / losses.length) : null;
    const rrRatio = avgWin && avgLoss ? (Math.abs(avgWin / avgLoss)).toFixed(2) : null;
    const maxDD   = dailySeries.length > 0 ? parseFloat(Math.min(...dailySeries.map(d=>d.drawdown)).toFixed(2)) : 0;

    return NextResponse.json({
      currencySymbol: sym,
      summary: {
        totalTrades: allTrades.length, wins: wins.length, losses: losses.length,
        winRate: allTrades.length > 0 ? Math.round((wins.length/allTrades.length)*100) : null,
        totalPnl: Math.round(allTrades.reduce((s,t)=>s+(t.pnl||0),0)),
        avgWin, avgLoss, rrRatio, maxDrawdown: maxDD,
        currentStreak: curStreak, maxWinStreak: maxW, maxLossStreak: maxL,
      },
      dailySeries, calendarData, byInstrument, byDow, byEmotion, planCorrelation,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
