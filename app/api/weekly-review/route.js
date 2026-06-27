import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';

// Returns ISO week number + year for a given date
function getWeekInfo(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  // Week start (Monday) and end (Sunday)
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const mon = new Date(d); mon.setDate(d.getDate() + diffToMon);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return {
    weekNumber: weekNum,
    year: d.getFullYear(),
    dateFrom: mon.toISOString().slice(0, 10),
    dateTo:   sun.toISOString().slice(0, 10),
  };
}

export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const weekParam = searchParams.get('week'); // YYYY-WNN or just return current week

    const { data: reviews } = await db.from('weekly_review')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('week_number', { ascending: false })
      .limit(20);

    // Current week info
    const today = new Date().toISOString().slice(0, 10);
    const currentWeek = getWeekInfo(today);

    // Find current week entry
    const current = (reviews || []).find(r => r.year === currentWeek.year && r.week_number === currentWeek.weekNumber) || null;

    return NextResponse.json({ reviews: reviews || [], current, currentWeek });
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
    const {
      weekNumber, year, dateFrom, dateTo,
      totalTrades, winners, losers, netPnl, closingCapital,
      streak, biggestWin, biggestMistake, patternNoticed, focusNextWeek, rating,
    } = body;

    const record = {
      user_id:         userId,
      week_number:     weekNumber,
      year,
      date_from:       dateFrom,
      date_to:         dateTo,
      total_trades:    totalTrades  ?? 0,
      winners:         winners      ?? 0,
      losers:          losers       ?? 0,
      net_pnl:         netPnl       ?? 0,
      closing_capital: closingCapital != null ? parseFloat(closingCapital) : null,
      streak:          streak        || null,
      biggest_win:     biggestWin    || null,
      biggest_mistake: biggestMistake || null,
      pattern_noticed: patternNoticed || null,
      focus_next_week: focusNextWeek  || null,
      rating:          rating         || null,
      updated_at:      new Date().toISOString(),
    };

    const { data, error } = await db.from('weekly_review')
      .upsert(record, { onConflict: 'user_id,year,week_number' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, review: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
