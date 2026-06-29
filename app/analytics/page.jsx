'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { authFetch } from '@/lib/authFetch.js';

/* ─── Helpers ──────────────────────────────────────────────────────────── */
function fmt(n, d = 0) {
  if (n == null) return '—';
  return Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtPnl(n, sym = '') {
  if (n == null) return '—';
  return `${n >= 0 ? '+' : '-'}${sym}${fmt(Math.abs(n))}`;
}
function pnlColor(n) {
  if (n == null || n === 0) return 'var(--text-muted)';
  return n > 0 ? '#2e7d32' : '#c62828';
}
function winColor(rate) {
  if (rate == null) return 'var(--text-muted)';
  if (rate >= 60) return '#2e7d32';
  if (rate >= 40) return '#f57c00';
  return '#c62828';
}

/* ─── Summary stat card ────────────────────────────────────────────────── */
function KPI({ label, value, sub, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 18px' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 900, color: color || 'var(--text)', lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

/* ─── Section wrapper ──────────────────────────────────────────────────── */
function Section({ title, sub, children }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>{title}</div>
        {sub && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

/* ─── Custom tooltip ───────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label, sym }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ fontSize: '14px', fontWeight: 700, color: p.value >= 0 ? '#2e7d32' : '#c62828' }}>
          {p.name}: {p.dataKey === 'drawdown' ? `${p.value.toFixed(2)}%` : `${sym}${fmt(Math.abs(p.value))}`}
          {p.value < 0 && p.dataKey !== 'drawdown' ? ' loss' : ''}
        </div>
      ))}
    </div>
  );
}

/* ─── Calendar Heatmap ─────────────────────────────────────────────────── */
function CalendarHeatmap({ data, sym }) {
  // Group by week (Sun–Sat)
  const weeks = [];
  let week = [];
  for (const day of data) {
    const dow = new Date(day.date + 'T12:00:00').getDay();
    if (dow === 0 && week.length > 0) { weeks.push(week); week = []; }
    week.push(day);
  }
  if (week.length > 0) weeks.push(week);

  function cellColor(d) {
    if (!d.trades) return d.journaled ? '#e8f5e9' : '#f5f5f5';
    if (d.pnl > 0)  return d.pnl > 2000 ? '#1b5e20' : d.pnl > 500 ? '#388e3c' : '#81c784';
    if (d.pnl < 0)  return d.pnl < -2000 ? '#b71c1c' : d.pnl < -500 ? '#e53935' : '#ef9a9a';
    return '#e0e0e0';
  }

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const days   = ['S','M','T','W','T','F','S'];

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
      <div style={{ display: 'flex', gap: '2px', minWidth: 'max-content' }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '4px', paddingTop: '20px' }}>
          {days.map((d, i) => (
            <div key={i} style={{ width: '12px', height: '12px', fontSize: '9px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d}</div>
          ))}
        </div>
        {/* Weeks */}
        {weeks.map((wk, wi) => {
          const firstDay  = new Date(wk[0].date + 'T12:00:00');
          const showMonth = firstDay.getDate() <= 7;
          return (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ height: '16px', fontSize: '9px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                {showMonth ? months[firstDay.getMonth()] : ''}
              </div>
              {/* Fill empty days at start of first week */}
              {wi === 0 && Array.from({ length: new Date(wk[0].date + 'T12:00:00').getDay() }).map((_, i) => (
                <div key={`e${i}`} style={{ width: '12px', height: '12px' }} />
              ))}
              {wk.map(day => (
                <div key={day.date} title={`${day.date}: ${day.trades} trades, ${sym}${fmt(day.pnl)} P&L`}
                  style={{
                    width: '12px', height: '12px', borderRadius: '2px',
                    background: cellColor(day), cursor: day.trades ? 'pointer' : 'default',
                    transition: 'transform 0.1s',
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Less</span>
        {['#f5f5f5','#81c784','#388e3c','#1b5e20'].map(c => (
          <div key={c} style={{ width: '12px', height: '12px', borderRadius: '2px', background: c }} />
        ))}
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Profit</span>
        <div style={{ width: '1px', height: '12px', background: 'var(--border)', margin: '0 4px' }} />
        {['#ef9a9a','#e53935','#b71c1c'].map(c => (
          <div key={c} style={{ width: '12px', height: '12px', borderRadius: '2px', background: c }} />
        ))}
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Loss</span>
        <div style={{ width: '1px', height: '12px', background: 'var(--border)', margin: '0 4px' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#e8f5e9' }} />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Journaled (no trades)</span>
      </div>
    </div>
  );
}

/* ─── Psychology insight card ──────────────────────────────────────────── */
function PsychCard({ icon, title, good, bad, note }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ fontSize: '24px' }}>{icon}</span>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>{title}</div>
          {note && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{note}</div>}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ background: '#e8f5e9', borderRadius: '10px', padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#2e7d32', marginBottom: '4px' }}>✓ {good.label}</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#2e7d32' }}>{good.value}</div>
          {good.sub && <div style={{ fontSize: '11px', color: '#4caf50', marginTop: '2px' }}>{good.sub}</div>}
        </div>
        <div style={{ background: '#ffebee', borderRadius: '10px', padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#c62828', marginBottom: '4px' }}>✗ {bad.label}</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#c62828' }}>{bad.value}</div>
          {bad.sub && <div style={{ fontSize: '11px', color: '#ef5350', marginTop: '2px' }}>{bad.sub}</div>}
        </div>
      </div>
    </div>
  );
}

/* ─── Empty state ──────────────────────────────────────────────────────── */
function Empty({ msg }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '14px', padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
      <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{msg}</div>
      <Link href="/journal" style={{ display: 'inline-block', marginTop: '16px', fontSize: '14px', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>
        Log your first trade →
      </Link>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [chart,    setChart]    = useState('capital'); // 'capital' | 'pnl' | 'drawdown'
  const [dataMode, setDataMode] = useState('real');   // 'real' | 'test'

  const load = useCallback(async (mode = 'real') => {
    setLoading(true);
    try {
      const res  = await authFetch(`/api/analytics?mode=${mode}`);
      const json = await res.json();
      setData(json);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(dataMode); }, [load]);

  async function switchMode(mode) {
    setDataMode(mode);
    await load(mode);
  }

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh', color: 'var(--text-muted)' }}>Loading analytics…</div>;
  }

  if (!data || data.error) {
    return <Empty msg="Could not load analytics." />;
  }

  const { summary, dailySeries, calendarData, byInstrument, byDow, byEmotion, planCorrelation, currencySymbol: sym } = data;
  const noTrades = summary.totalTrades === 0;

  const streakLabel = summary.currentStreak > 0
    ? `🔥 ${summary.currentStreak} win streak`
    : summary.currentStreak < 0
    ? `❄️ ${Math.abs(summary.currentStreak)} loss streak`
    : '—';

  return (
    <div style={{ maxWidth: '860px' }}>
      <style>{`
        .an-kpi4 { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:28px; }
        .an-kpi4b { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:32px; }
        .an-g2 { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:32px; }
        .an-psych { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .an-etable-head { padding:14px 16px; border-bottom:1px solid var(--border); display:grid; grid-template-columns:1fr 80px 80px 80px; gap:8px; }
        .an-etable-row  { padding:11px 16px; display:grid; grid-template-columns:1fr 80px 80px 80px; gap:8px; align-items:center; }
        @media (max-width:768px) {
          .an-kpi4  { grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px; }
          .an-kpi4b { grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px; }
          .an-g2    { grid-template-columns:1fr; gap:16px; }
          .an-psych { grid-template-columns:1fr; }
          .an-etable-head { grid-template-columns:1fr 56px 56px; gap:6px; padding:10px 12px; }
          .an-etable-head span:last-child { display:none; }
          .an-etable-row  { grid-template-columns:1fr 56px 56px; gap:6px; padding:9px 12px; }
          .an-etable-row span:last-child { display:none; }
        }
      `}</style>

      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 4px', color: 'var(--text)', letterSpacing: '-0.3px' }}>Analytics</h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Why you're winning. Why you're losing. What to fix.</p>
        </div>
        <div style={{ display: 'inline-flex', background: '#f3f4f6', borderRadius: 22, padding: 3, gap: 2, alignSelf: 'center' }}>
          {['real','test'].map(m => (
            <button key={m} onClick={() => switchMode(m)} style={{
              padding: '6px 16px', borderRadius: 18, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: dataMode === m ? (m === 'test' ? '#fef3c7' : '#fff') : 'transparent',
              color: dataMode === m ? (m === 'test' ? '#92400e' : '#374151') : '#9ca3af',
              boxShadow: dataMode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}>
              {m === 'real' ? '📊 Real' : '🧪 Test'}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="an-kpi4">
        <KPI label="Total Trades" value={summary.totalTrades} sub={`${summary.wins}W / ${summary.losses}L`} />
        <KPI label="Win Rate" value={summary.winRate != null ? `${summary.winRate}%` : '—'} color={winColor(summary.winRate)} />
        <KPI label="Total P&L" value={fmtPnl(summary.totalPnl, sym)} color={pnlColor(summary.totalPnl)} />
        <KPI label="R:R Ratio" value={summary.rrRatio ? `${summary.rrRatio}R` : '—'} sub={summary.avgWin ? `Avg win ${sym}${fmt(summary.avgWin)} / Avg loss ${sym}${fmt(Math.abs(summary.avgLoss))}` : null} />
      </div>
      <div className="an-kpi4b">
        <KPI label="Current Streak" value={streakLabel} />
        <KPI label="Best Win Streak" value={`${summary.maxWinStreak} trades`} color="#2e7d32" />
        <KPI label="Worst Loss Run" value={`${summary.maxLossStreak} trades`} color="#c62828" />
        <KPI label="Max Drawdown" value={`${summary.maxDrawdown}%`} color={summary.maxDrawdown < -10 ? '#c62828' : '#f57c00'} />
      </div>

      {noTrades ? <Empty msg="No trades journaled yet. Start logging to see your analytics." /> : <>

        {/* ── Capital / P&L / Drawdown chart ── */}
        <Section title="Capital Growth" sub="Your running capital over time based on journaled P&L">
          {/* Chart toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {[['capital','Capital'],['pnl','Daily P&L'],['drawdown','Drawdown']].map(([k,l]) => (
              <button key={k} onClick={() => setChart(k)} style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: chart === k ? 'var(--primary)' : '#f5f5f5',
                color: chart === k ? '#fff' : 'var(--text-muted)',
              }}>{l}</button>
            ))}
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailySeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9e9e9e' }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#9e9e9e' }} tickFormatter={v => chart === 'drawdown' ? `${v}%` : `${sym}${Math.abs(v) >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} width={52} />
                <Tooltip content={<ChartTooltip sym={sym} />} />
                <ReferenceLine y={0} stroke="#e0e0e0" />
                <Line
                  type="monotone" dataKey={chart}
                  name={chart === 'capital' ? 'Capital' : chart === 'pnl' ? 'P&L' : 'Drawdown'}
                  stroke={chart === 'drawdown' ? '#e53935' : 'var(--primary)'}
                  strokeWidth={2} dot={false} activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* ── Calendar heatmap ── */}
        <Section title="Trading Calendar" sub="Last 365 days — green = profit, red = loss, light green = journaled with no trades">
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
            <CalendarHeatmap data={calendarData} sym={sym} />
          </div>
        </Section>

        {/* ── Instrument + Day of week ── */}
        <div className="an-g2">

          {/* By instrument */}
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>By Instrument</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>Win rate & P&L per symbol</div>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
              {byInstrument.length === 0
                ? <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No instrument data yet</div>
                : byInstrument.map((inst, i) => (
                  <div key={inst.instrument} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                    borderBottom: i < byInstrument.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inst.instrument}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{inst.total} trades</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: winColor(inst.winRate) }}>{inst.winRate}%</div>
                      <div style={{ fontSize: '11px', color: pnlColor(inst.pnl) }}>{fmtPnl(inst.pnl, sym)}</div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* By day of week */}
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>By Day of Week</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>Your best and worst trading days</div>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px' }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={byDow} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="short" tick={{ fontSize: 12, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9e9e9e' }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v, n) => [`${v}%`, 'Win Rate']} />
                  <Bar dataKey="winRate" radius={[6,6,0,0]} maxBarSize={40}>
                    {byDow.map((d, i) => (
                      <Cell key={i} fill={d.winRate == null ? '#e0e0e0' : d.winRate >= 60 ? '#43a047' : d.winRate >= 40 ? '#ffa726' : '#ef5350'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                {byDow.map(d => (
                  <div key={d.day} style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '11px', color: pnlColor(d.pnl) }}>{d.total > 0 ? fmtPnl(d.pnl, sym) : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Psychology section ── */}
        <Section title="Psychology Insights" sub="How your mindset affects your results">
          <div className="an-psych">

            {/* Plan correlation */}
            <PsychCard
              icon="📋"
              title="Following Your Plan"
              note="Does plan discipline improve results?"
              good={{
                label: 'Followed plan',
                value: planCorrelation.followed.winRate != null ? `${planCorrelation.followed.winRate}%` : '—',
                sub: planCorrelation.followed.count > 0 ? `${planCorrelation.followed.count} trades · Avg ${fmtPnl(planCorrelation.followed.avgPnl, sym)}` : 'No data',
              }}
              bad={{
                label: 'Off-plan',
                value: planCorrelation.notFollowed.winRate != null ? `${planCorrelation.notFollowed.winRate}%` : '—',
                sub: planCorrelation.notFollowed.count > 0 ? `${planCorrelation.notFollowed.count} trades · Avg ${fmtPnl(planCorrelation.notFollowed.avgPnl, sym)}` : 'No data',
              }}
            />

            {/* Emotion breakdown — best vs worst */}
            {byEmotion.length >= 2 ? (() => {
              const sorted   = [...byEmotion].filter(e => e.total >= 2 && e.emotion !== 'Not recorded');
              const best     = sorted.sort((a, b) => b.winRate - a.winRate)[0];
              const worst    = sorted.sort((a, b) => a.winRate - b.winRate)[0];
              return (
                <PsychCard
                  icon="🧠"
                  title="Emotion vs Performance"
                  note="Your mindset has a measurable impact"
                  good={{
                    label: best?.emotion || '—',
                    value: best ? `${best.winRate}%` : '—',
                    sub: best ? `${best.total} trades · Avg ${fmtPnl(best.avgPnl, sym)}` : '',
                  }}
                  bad={{
                    label: worst?.emotion || '—',
                    value: worst ? `${worst.winRate}%` : '—',
                    sub: worst ? `${worst.total} trades · Avg ${fmtPnl(worst.avgPnl, sym)}` : '',
                  }}
                />
              );
            })() : (
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🧠</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Log your emotion on more trades to see psychology insights</div>
                </div>
              </div>
            )}

            {/* Emotion table */}
            {byEmotion.length > 0 && (
              <div style={{ gridColumn: '1 / -1', background: '#fff', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
                <div className="an-etable-head">
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Emotion</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Trades</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Win %</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Avg P&L</span>
                </div>
                {byEmotion.map((e, i) => (
                  <div key={e.emotion} className="an-etable-row" style={{ borderBottom: i < byEmotion.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{e.emotion}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'right' }}>{e.total}</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: winColor(e.winRate), textAlign: 'right' }}>{e.winRate}%</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: pnlColor(e.avgPnl), textAlign: 'right' }}>{fmtPnl(e.avgPnl, sym)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

      </>}
    </div>
  );
}
