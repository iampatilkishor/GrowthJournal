'use client';

import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/authFetch.js';

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n}
          onClick={() => onChange(n === value ? 0 : n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '28px', lineHeight: 1, padding: '2px',
            color: n <= (hovered || value) ? '#f9a825' : '#e0e0e0',
            transition: 'color 0.1s',
          }}
        >★</button>
      ))}
      {value > 0 && (
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: '6px' }}>
          {['', 'Poor', 'Below avg', 'Average', 'Good', 'Excellent'][value]}
        </span>
      )}
    </div>
  );
}

function StatBox({ label, value, color, sub }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: '22px', fontWeight: 800, color: color || 'var(--text)', lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginTop: '4px' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, rows = 2 }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
    </div>
  );
}

function PastWeekCard({ review }) {
  const winRate = review.total_trades > 0 ? Math.round((review.winners / review.total_trades) * 100) : null;
  const pnlPos  = (review.net_pnl || 0) >= 0;
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '14px' }}>
            Week {review.week_number} · {review.date_from} → {review.date_to}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {review.total_trades} trades · {winRate != null ? `${winRate}% win rate` : 'no trades'}
            {review.streak && ` · ${review.streak}`}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {review.rating > 0 && (
            <span style={{ color: '#f9a825', fontSize: '14px' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
          )}
          <span style={{ fontWeight: 700, color: pnlPos ? 'var(--buy)' : 'var(--sell)', fontSize: '15px' }}>
            {pnlPos ? '+' : ''}₹{Math.abs(review.net_pnl || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
      {review.pattern_noticed && (
        <div style={{ marginTop: '8px', fontSize: '13px', color: '#555', background: '#f9f9f9', borderRadius: '6px', padding: '8px 10px' }}>
          💡 {review.pattern_noticed}
        </div>
      )}
    </div>
  );
}

export default function WeeklyReviewPage() {
  const [currentWeek, setCurrentWeek]   = useState(null);
  const [reviews, setReviews]           = useState([]);
  const [journalStats, setJournalStats] = useState(null);

  // Form state
  const [closingCapital, setClosingCapital] = useState('');
  const [streak, setStreak]                 = useState('');
  const [biggestWin, setBiggestWin]         = useState('');
  const [biggestMistake, setBiggestMistake] = useState('');
  const [patternNoticed, setPatternNoticed] = useState('');
  const [focusNextWeek, setFocusNextWeek]   = useState('');
  const [rating, setRating]                 = useState(0);
  const [saving, setSaving]                 = useState(false);
  const [saved, setSaved]                   = useState(false);

  const load = useCallback(async () => {
    const [reviewRes, historyRes] = await Promise.all([
      authFetch('/api/weekly-review').then(r => r.json()).catch(() => ({})),
      authFetch('/api/journal/history?days=7').then(r => r.json()).catch(() => ({})),
    ]);

    setCurrentWeek(reviewRes.currentWeek || null);
    setReviews(reviewRes.reviews || []);

    // Populate form from existing current week review
    const cur = reviewRes.current;
    if (cur) {
      setClosingCapital(cur.closing_capital ?? '');
      setStreak(cur.streak || '');
      setBiggestWin(cur.biggest_win || '');
      setBiggestMistake(cur.biggest_mistake || '');
      setPatternNoticed(cur.pattern_noticed || '');
      setFocusNextWeek(cur.focus_next_week || '');
      setRating(cur.rating || 0);
    }

    // Aggregate journal stats for this week
    const groups = historyRes.grouped || [];
    const allEntries = groups.flatMap(g => g.entries || []);
    const total   = allEntries.length;
    const wins    = allEntries.filter(e => (e.pnl || 0) > 0).length;
    const losses  = allEntries.filter(e => (e.pnl || 0) < 0).length;
    const netPnl  = allEntries.reduce((s, e) => s + (e.pnl || 0), 0);
    const daysActive = groups.length;
    setJournalStats({ total, wins, losses, netPnl, daysActive, winRate: total > 0 ? Math.round((wins / total) * 100) : null });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!currentWeek) return;
    setSaving(true);
    try {
      await authFetch('/api/weekly-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekNumber:     currentWeek.weekNumber,
          year:           currentWeek.year,
          dateFrom:       currentWeek.dateFrom,
          dateTo:         currentWeek.dateTo,
          totalTrades:    journalStats?.total  ?? 0,
          winners:        journalStats?.wins   ?? 0,
          losers:         journalStats?.losses ?? 0,
          netPnl:         journalStats?.netPnl ?? 0,
          closingCapital: closingCapital || null,
          streak, biggestWin, biggestMistake, patternNoticed, focusNextWeek, rating,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await load();
    } catch {}
    finally { setSaving(false); }
  }

  const pnlPos = (journalStats?.netPnl || 0) >= 0;
  const pastReviews = reviews.filter(r =>
    !(currentWeek && r.year === currentWeek.year && r.week_number === currentWeek.weekNumber)
  );

  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>📅 Weekly Review</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
          {currentWeek ? `Week ${currentWeek.weekNumber} · ${currentWeek.dateFrom} → ${currentWeek.dateTo}` : 'Reflect on your week'}
        </p>
      </div>

      {/* This week's stats (auto from journal) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        <StatBox label="Total Trades" value={journalStats?.total ?? '—'} />
        <StatBox label="Winners" value={journalStats?.wins ?? '—'} color="var(--buy)" />
        <StatBox label="Losers" value={journalStats?.losses ?? '—'} color="var(--sell)" />
        <StatBox label="Win Rate" value={journalStats?.winRate != null ? `${journalStats.winRate}%` : '—'}
          color={journalStats?.winRate >= 50 ? 'var(--buy)' : journalStats?.winRate != null ? 'var(--sell)' : undefined} />
        <StatBox label="Net P&L"
          value={journalStats?.netPnl != null ? `${pnlPos ? '+' : ''}₹${Math.abs(journalStats.netPnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
          color={pnlPos ? 'var(--buy)' : 'var(--sell)'}
          sub="this week" />
        <StatBox label="Days Active" value={journalStats?.daysActive ?? '—'} sub="trading days" />
      </div>

      {/* Review form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>

        {/* Closing capital + streak */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>Closing Capital (₹)</label>
            <input type="number" value={closingCapital} onChange={e => setClosingCapital(e.target.value)} placeholder="e.g. 52000"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>Streak</label>
            <input type="text" value={streak} onChange={e => setStreak(e.target.value)} placeholder="e.g. W3 L1 W2"
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
          </div>
        </div>

        <TextField label="🏆 Biggest Win This Week" value={biggestWin} onChange={setBiggestWin}
          placeholder="NIFTY CE trade — held through resistance breakout, +₹4200" />

        <TextField label="💸 Biggest Mistake" value={biggestMistake} onChange={setBiggestMistake}
          placeholder="Revenge traded after morning loss, doubled down on losing position" />

        <TextField label="🔍 Pattern I Noticed in My Trading" value={patternNoticed} onChange={setPatternNoticed}
          placeholder="I trade better in the first session (9:15–11:30). Afternoon trades are mostly losses." rows={2} />

        <TextField label="🎯 Focus for Next Week" value={focusNextWeek} onChange={setFocusNextWeek}
          placeholder="No trades after 1 PM. Stick to max 3 trades/day. Review S1/S2 before entry." rows={2} />

        {/* Rating */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>Overall Rating</label>
          <StarRating value={rating} onChange={setRating} />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} style={{
        width: '100%', padding: '13px', background: saved ? '#2e7d32' : 'var(--primary)',
        color: '#fff', border: 'none', borderRadius: '10px',
        fontSize: '15px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
        transition: 'background 0.3s', marginBottom: '32px',
      }}>
        {saving ? 'Saving…' : saved ? '✅ Saved!' : '💾 Save Weekly Review'}
      </button>

      {/* Past weeks */}
      {pastReviews.length > 0 && (
        <>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Past Reviews</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pastReviews.map(r => <PastWeekCard key={r.id} review={r} />)}
          </div>
        </>
      )}
    </div>
  );
}
