'use client';

import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/authFetch.js';
import { useAuth } from '@/components/AuthGate.jsx';
import ManualJournalModal from '@/components/ManualJournalModal.jsx';
import JournalModal from '@/components/JournalModal.jsx';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function todayIST() {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

const EMOTION_COLORS = {
  calm: '#1976d2', confident: '#2e7d32', fomo: '#f57c00',
  revenge: '#c62828', anxious: '#f9a825', unsure: '#7b1fa2',
};

const MENTAL_STATES = [
  { key: 'calm',    label: '😌 Calm',    color: '#1976d2' },
  { key: 'anxious', label: '😟 Anxious', color: '#f9a825' },
  { key: 'fomo',    label: '😰 FOMO',    color: '#f57c00' },
  { key: 'focused', label: '🎯 Focused', color: '#2e7d32' },
];

const BIASES = [
  { key: 'bull',     label: '🐂 Bullish',  color: '#2e7d32' },
  { key: 'bear',     label: '🐻 Bearish',  color: '#c62828' },
  { key: 'sideways', label: '↔️ Sideways', color: '#f57c00' },
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEK_DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function pnlColor(v) { return !v && v !== 0 ? 'inherit' : v >= 0 ? 'var(--buy)' : 'var(--sell)'; }
function fmtPnl(v) {
  if (v == null) return null;
  const n = parseFloat(v);
  return `${n >= 0 ? '+' : ''}₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtPrice(v) {
  if (v == null) return '—';
  return '₹' + parseFloat(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d)} ${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
}

/* ─── Section wrapper ────────────────────────────────────────────────────── */
function Section({ icon, title, subtitle, accentColor = 'var(--primary)', accentBg = '#f8f9ff', children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', background: '#fff' }}>
      <div onClick={() => setOpen(p => !p)} style={{
        background: accentBg, padding: '14px 18px', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none',
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '14px', color: accentColor }}>{icon} {title}</div>
          {subtitle && <div style={{ fontSize: '12px', color: accentColor, opacity: 0.7, marginTop: '2px' }}>{subtitle}</div>}
        </div>
        <span style={{ color: accentColor, fontSize: '18px' }}>{open ? '▾' : '▸'}</span>
      </div>
      {open && <div style={{ padding: '18px' }}>{children}</div>}
    </div>
  );
}

/* ─── Pill select ────────────────────────────────────────────────────────── */
function PillSelect({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o.key} onClick={() => onChange(o.key === value ? '' : o.key)} style={{
          padding: '7px 14px', borderRadius: '20px', border: '2px solid',
          borderColor: value === o.key ? o.color : 'var(--border)',
          background: value === o.key ? o.color : '#fff',
          color: value === o.key ? '#fff' : 'var(--text-muted)',
          fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

/* ─── Trade card ─────────────────────────────────────────────────────────── */
function TradeCard({ entry }) {
  const [expanded, setExpanded] = useState(false);
  const sym = entry.trading_symbol || entry.instrument || '—';
  const dir = entry.transaction_type || entry.direction;
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px', background: '#fafafa' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <strong style={{ fontSize: '14px' }}>{sym}</strong>
          {dir && <span className={`badge badge-${dir.toLowerCase()}`}>{dir}</span>}
          {entry.qty && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>×{entry.qty}</span>}
          {entry.followed_plan === true  && <span className="badge" style={{ background: '#e8f5e9', color: 'var(--buy)' }}>✅ Plan</span>}
          {entry.followed_plan === false && <span className="badge" style={{ background: '#fce4ec', color: 'var(--sell)' }}>❌ Impulsive</span>}
          {entry.emotion && (
            <span className="badge" style={{ background: (EMOTION_COLORS[entry.emotion] || '#666') + '22', color: EMOTION_COLORS[entry.emotion] || '#666', textTransform: 'capitalize' }}>
              {entry.emotion}
            </span>
          )}
          {entry.is_manual && <span className="badge" style={{ background: '#ede7f6', color: '#4a148c' }}>Manual</span>}
        </div>
        {entry.pnl != null && <strong style={{ fontSize: '14px', color: pnlColor(entry.pnl) }}>{fmtPnl(entry.pnl)}</strong>}
      </div>

      {(entry.entry_price || entry.stop_loss || entry.target_price || entry.exit_price) && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
          {[['Entry', entry.entry_price || entry.average_price], ['SL', entry.stop_loss], ['Target', entry.target_price], ['Exit', entry.exit_price]]
            .filter(([, v]) => v != null)
            .map(([label, val]) => (
              <span key={label} style={{ fontSize: '11px', background: '#f0f0f0', borderRadius: '6px', padding: '2px 7px', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>{label}</span> {fmtPrice(val)}
              </span>
            ))}
        </div>
      )}

      {entry.gross_pnl != null && (
        <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>Gross: <strong style={{ color: pnlColor(entry.gross_pnl) }}>{fmtPnl(entry.gross_pnl)}</strong></span>
          {entry.brokerage != null && <span>Brokerage: ₹{parseFloat(entry.brokerage).toFixed(2)}</span>}
          <span>Net: <strong style={{ color: pnlColor(entry.pnl) }}>{fmtPnl(entry.pnl)}</strong></span>
        </div>
      )}

      {entry.entry_reason && (
        <div style={{ marginTop: '7px', fontSize: '13px', color: '#444', lineHeight: 1.5 }}>
          {!expanded && entry.entry_reason.length > 100 ? entry.entry_reason.slice(0, 100) + '…' : entry.entry_reason}
          {entry.entry_reason.length > 100 && (
            <button onClick={() => setExpanded(p => !p)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '12px', marginLeft: '4px' }}>
              {expanded ? 'less' : 'more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Calendar view ──────────────────────────────────────────────────────── */
function CalendarView({ calMonth, onMonthChange, tradeDateMap, djDateSet, selectedDate, onSelectDate }) {
  const [y, m] = calMonth.split('-').map(Number);
  const firstDow    = new Date(y, m - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(y, m, 0).getDate();
  const todayStr    = todayIST();
  const curMonth    = todayStr.slice(0, 7);

  // Build cell array: nulls for leading blanks, then day numbers
  const cells = Array(firstDow).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f8f9ff', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => {
          const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
          onMonthChange(prev);
        }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: 'var(--primary)', lineHeight: 1, padding: '0 8px' }}>‹</button>
        <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--primary)' }}>{MONTH_NAMES[m - 1]} {y}</span>
        <button
          onClick={() => {
            const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
            if (next <= curMonth) onMonthChange(next);
          }}
          disabled={calMonth >= curMonth}
          style={{ background: 'none', border: 'none', cursor: calMonth >= curMonth ? 'default' : 'pointer', fontSize: '22px', lineHeight: 1, padding: '0 8px', color: calMonth >= curMonth ? 'var(--border)' : 'var(--primary)' }}
        >›</button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
        {WEEK_DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', padding: '7px 0', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} style={{ minHeight: '56px' }} />;

          const dateStr   = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const tradeInfo = tradeDateMap[dateStr];
          const hasDJ     = djDateSet.has(dateStr);
          const isToday   = dateStr === todayStr;
          const isSel     = dateStr === selectedDate;
          const isFuture  = dateStr > todayStr;
          const hasEntry  = !!(tradeInfo || hasDJ);

          let dotColor = hasDJ ? '#1976d2' : null;
          if (tradeInfo) dotColor = tradeInfo.pnl >= 0 ? '#2e7d32' : '#c62828';

          return (
            <div
              key={dateStr}
              onClick={() => !isFuture && hasEntry && onSelectDate(dateStr)}
              style={{
                minHeight: '56px', padding: '6px 4px', textAlign: 'center',
                cursor: !isFuture && hasEntry ? 'pointer' : 'default',
                background: isSel ? 'var(--primary)' : isToday ? '#eef0ff' : 'transparent',
                opacity: isFuture ? 0.3 : 1,
                borderRadius: isSel || isToday ? '8px' : 0,
                margin: isSel || isToday ? '2px' : 0,
                transition: 'background 0.12s',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: isToday || isSel ? 800 : 400, color: isSel ? '#fff' : isToday ? 'var(--primary)' : 'var(--text)' }}>
                {day}
              </div>
              {dotColor && (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: isSel ? '#fff' : dotColor, margin: '3px auto 1px' }} />
              )}
              {tradeInfo && (
                <div style={{ fontSize: '10px', fontWeight: 700, lineHeight: 1, color: isSel ? '#fff' : tradeInfo.pnl >= 0 ? '#2e7d32' : '#c62828' }}>
                  {tradeInfo.pnl >= 0 ? '+' : ''}₹{Math.abs(tradeInfo.pnl).toFixed(0)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', padding: '10px 18px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#2e7d32', marginRight: 4, verticalAlign: 'middle' }} />Profit</span>
        <span><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#c62828', marginRight: 4, verticalAlign: 'middle' }} />Loss</span>
        <span><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#1976d2', marginRight: 4, verticalAlign: 'middle' }} />Journal only</span>
      </div>
    </div>
  );
}

/* ─── If-Then scenario card ──────────────────────────────────────────────── */
const ACTION_LABELS = {
  buy_ce: '📈 Buy CE', buy_pe: '📉 Buy PE',
  sell_ce: '📤 Sell CE', sell_pe: '📥 Sell PE',
  buy_fut: '🟢 Buy Fut', sell_fut: '🔴 Sell Fut',
  wait: '⏳ Wait', exit_all: '🚪 Exit All',
};
function ScenarioCard({ sc }) {
  const low  = sc.condition_value_low  != null ? fmtPrice(sc.condition_value_low)  : null;
  const high = sc.condition_value_high != null ? fmtPrice(sc.condition_value_high) : null;
  const condText = low && high ? `${low} – ${high}` : low || high || '—';
  const action   = ACTION_LABELS[sc.action] || sc.action;
  const entry    = sc.entry_price  != null ? fmtPrice(sc.entry_price)  : null;
  const target   = sc.target_price != null ? fmtPrice(sc.target_price) : null;
  const sl       = sc.stop_loss    != null ? fmtPrice(sc.stop_loss)    : null;
  let rr = null;
  if (sc.entry_price && sc.target_price && sc.stop_loss) {
    const reward = Math.abs(sc.target_price - sc.entry_price);
    const risk   = Math.abs(sc.entry_price  - sc.stop_loss);
    if (risk > 0) rr = (reward / risk).toFixed(2);
  }
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px', background: '#fafafa' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', background: '#e8f0fe', color: '#1a73e8', borderRadius: '6px', padding: '2px 8px', fontWeight: 700 }}>
          IF Nifty {condText}
        </span>
        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>→ {action}</span>
        {sc.instrument && <span style={{ fontSize: '12px', background: '#f3e5f5', color: '#6a1b9a', borderRadius: '6px', padding: '2px 8px', fontWeight: 600 }}>{sc.instrument}</span>}
        {sc.max_quantity && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Qty: {sc.max_quantity}</span>}
        {rr && <span style={{ fontSize: '12px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '6px', padding: '2px 8px', fontWeight: 600 }}>R:R {rr}:1</span>}
      </div>
      {(entry || target || sl) && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '11px' }}>
          {entry  && <span style={{ background: '#f0f0f0', borderRadius: '6px', padding: '2px 7px', color: 'var(--text-muted)' }}><span style={{ fontWeight: 600, color: 'var(--text)' }}>Entry</span> {entry}</span>}
          {sl     && <span style={{ background: '#fff5f5', borderRadius: '6px', padding: '2px 7px', color: 'var(--sell)' }}><span style={{ fontWeight: 600 }}>SL</span> {sl}</span>}
          {target && <span style={{ background: '#f0fff4', borderRadius: '6px', padding: '2px 7px', color: 'var(--buy)' }}><span style={{ fontWeight: 600 }}>Target</span> {target}</span>}
        </div>
      )}
      {sc.entry_reason && <div style={{ marginTop: '6px', fontSize: '12px', color: '#555', lineHeight: 1.5 }}>{sc.entry_reason}</div>}
    </div>
  );
}

/* ─── Day detail (read-only) ─────────────────────────────────────────────── */
function DayDetail({ date, djEntry, tradeGroup, dayPlan, loading }) {
  if (!date) {
    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '36px 24px', textAlign: 'center', color: 'var(--text-muted)', background: '#fff' }}>
        <div style={{ fontSize: '30px', marginBottom: '10px' }}>📅</div>
        <div style={{ fontWeight: 600, fontSize: '14px' }}>Select a date to view</div>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>Highlighted days have journal entries or trades</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '36px 24px', textAlign: 'center', color: 'var(--text-muted)', background: '#fff' }}>
        Loading…
      </div>
    );
  }

  const hasTrades = tradeGroup?.entries?.length > 0;
  const hasDJ     = !!djEntry;

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', background: '#fff' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', background: '#f8f9ff', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--primary)' }}>📝 {fmtDisplayDate(date)}</div>
          {tradeGroup && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {tradeGroup.total} trade{tradeGroup.total !== 1 ? 's' : ''} · Net P&L:{' '}
              <strong style={{ color: pnlColor(tradeGroup.pnl) }}>{fmtPnl(tradeGroup.pnl)}</strong>
            </div>
          )}
        </div>
        <span style={{ fontSize: '11px', background: '#ede7f6', color: '#4a148c', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>Read-only</span>
      </div>

      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Pre-market */}
        {hasDJ && (djEntry.mental_state || djEntry.market_bias || djEntry.s1 || djEntry.r1 || djEntry.daily_loss_limit || djEntry.profit_target) && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#1a237e', marginBottom: '10px' }}>🌅 Pre-Market</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {djEntry.mental_state && (
                <span style={{ fontSize: '12px', background: '#e8eaf6', color: '#1a237e', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
                  {MENTAL_STATES.find(s => s.key === djEntry.mental_state)?.label || djEntry.mental_state}
                </span>
              )}
              {djEntry.market_bias && (
                <span style={{ fontSize: '12px', background: '#e8f5e9', color: '#1b5e20', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
                  {BIASES.find(b => b.key === djEntry.market_bias)?.label || djEntry.market_bias}
                </span>
              )}
            </div>
            {(djEntry.s1 || djEntry.s2 || djEntry.r1 || djEntry.r2 || djEntry.daily_loss_limit || djEntry.profit_target) && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px' }}>
                {[
                  ['S1', djEntry.s1 ? fmtPrice(djEntry.s1) : null],
                  ['S2', djEntry.s2 ? fmtPrice(djEntry.s2) : null],
                  ['R1', djEntry.r1 ? fmtPrice(djEntry.r1) : null],
                  ['R2', djEntry.r2 ? fmtPrice(djEntry.r2) : null],
                  ['Loss Limit', djEntry.daily_loss_limit ? `₹${djEntry.daily_loss_limit}` : null],
                  ['Target', djEntry.profit_target ? `₹${djEntry.profit_target}` : null],
                ].filter(([, v]) => v != null).map(([label, val]) => (
                  <span key={label} style={{ background: '#f5f5f5', border: '1px solid var(--border)', borderRadius: '6px', padding: '3px 8px', color: 'var(--text-muted)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{label}</span> {val}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* If-Then Plan */}
        {dayPlan && dayPlan.scenarios?.length > 0 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#e65100', marginBottom: '6px' }}>
              📋 Trading Plan — <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '12px' }}>{dayPlan.title}</span>
            </div>
            {dayPlan.notes && (
              <div style={{ fontSize: '12px', color: '#555', background: '#fff8e1', borderRadius: '8px', padding: '8px 12px', marginBottom: '8px', lineHeight: 1.5, border: '1px solid #ffe0b2' }}>
                {dayPlan.notes}
              </div>
            )}
            {(dayPlan.nifty_range_low || dayPlan.nifty_range_high) && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Nifty expected range: <strong style={{ color: 'var(--text)' }}>{dayPlan.nifty_range_low ? fmtPrice(dayPlan.nifty_range_low) : '?'} – {dayPlan.nifty_range_high ? fmtPrice(dayPlan.nifty_range_high) : '?'}</strong>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dayPlan.scenarios.map((sc, i) => <ScenarioCard key={sc.id || i} sc={sc} />)}
            </div>
          </div>
        )}

        {/* Trades */}
        {hasTrades ? (
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#1b5e20', marginBottom: '10px' }}>📊 Trades</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tradeGroup.entries.map(e => <TradeCard key={e.id} entry={e} />)}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', padding: '8px 0' }}>
            No trades logged this day
          </div>
        )}

        {/* EOD reflection */}
        {hasDJ && (djEntry.what_went_well || djEntry.biggest_mistake || djEntry.tomorrow_focus) && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#e65100', marginBottom: '10px' }}>🌆 Post-Market Reflection</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                ['✅ What Went Well', djEntry.what_went_well],
                ['❌ Biggest Mistake', djEntry.biggest_mistake],
                ['🎯 Next Day Focus', djEntry.tomorrow_focus],
              ].filter(([, v]) => v).map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6, background: '#fafafa', borderRadius: '8px', padding: '10px 12px', border: '1px solid var(--border)' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasTrades && !hasDJ && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No entries for this day</div>
        )}
      </div>
    </div>
  );
}

/* ─── NumInput — defined OUTSIDE the page so it never recreates on re-render ── */
function NumInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>{label}</label>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function JournalPage() {
  const { tier } = useAuth();
  const today    = todayIST();
  const [tab, setTab] = useState('today');

  /* ── Today tab ── */
  const [djLoading, setDjLoading]         = useState(true);
  const [mentalState, setMentalState]     = useState('');
  const [marketBias, setMarketBias]       = useState('');
  const [s1, setS1] = useState(''); const [s2, setS2] = useState('');
  const [r1, setR1] = useState(''); const [r2, setR2] = useState('');
  const [dailyLossLimit, setDailyLossLimit] = useState('');
  const [profitTarget, setProfitTarget]     = useState('');
  const [whatWentWell, setWhatWentWell]     = useState('');
  const [biggestMistake, setBiggestMistake] = useState('');
  const [tomorrowFocus, setTomorrowFocus]   = useState('');
  const [djSaving, setDjSaving] = useState(false);
  const [djSaved, setDjSaved]   = useState(false);
  const [todayData, setTodayData]     = useState(null);
  const [pending, setPending]         = useState([]);
  const [manualModal, setManualModal] = useState(false);
  const [brokerModal, setBrokerModal] = useState({ open: false, orderId: null, planId: null });

  /* ── History tab ── */
  const [histGrouped, setHistGrouped]       = useState([]);
  const [histLoaded, setHistLoaded]         = useState(false);
  const [calMonth, setCalMonth]             = useState(today.slice(0, 7));
  const [djMonthEntries, setDjMonthEntries] = useState([]);
  const [selDate, setSelDate]               = useState(null);
  const [selDJ, setSelDJ]                   = useState(null);
  const [selPlan, setSelPlan]               = useState(null);
  const [selDJLoading, setSelDJLoading]     = useState(false);

  /* ── Manage tab ── */
  const [manageEntries, setManageEntries]   = useState([]);
  const [manageLoading, setManageLoading]   = useState(false);
  const [manageLoaded, setManageLoaded]     = useState(false);
  const [manageFilter, setManageFilter]     = useState({ mode: 'all', result: 'all', search: '' });
  const [manageAction, setManageAction]     = useState(null); // { type: 'delete'|'move', id, name }

  /* ── Test mode ── */
  const [userTestMode, setUserTestMode]     = useState(false);

  useEffect(() => {
    authFetch('/api/user-settings').then(r => r.json()).then(d => setUserTestMode(!!d.settings?.test_mode)).catch(() => {});
  }, []);

  /* ── Trading Plan (Today tab) ── */
  const [planId, setPlanId]                       = useState(null);
  const [planScenarios, setPlanScenarios]         = useState([]);
  const [planMaxTrades, setPlanMaxTrades]         = useState(5);
  const [planMaxLoss, setPlanMaxLoss]             = useState(5000);
  const [planNoTradeBefore, setPlanNoTradeBefore] = useState(15);
  const [planMaxQtyPerScript, setPlanMaxQtyPerScript] = useState(50);
  const [planLoading, setPlanLoading]             = useState(false);
  const [planSaving, setPlanSaving]               = useState(false);
  const [planSaved, setPlanSaved]                 = useState(false);
  const [prefillModal, setPrefillModal]           = useState(null);

  /* Today: load DJ entry */
  const loadDJ = useCallback(async () => {
    setDjLoading(true);
    try {
      const res  = await authFetch(`/api/daily-journal?date=${today}`);
      const data = await res.json();
      const e    = data.entry;
      if (e) {
        setMentalState(e.mental_state || '');   setMarketBias(e.market_bias || '');
        setS1(e.s1 ?? '');   setS2(e.s2 ?? '');
        setR1(e.r1 ?? '');   setR2(e.r2 ?? '');
        setDailyLossLimit(e.daily_loss_limit ?? '');
        setProfitTarget(e.profit_target ?? '');
        setWhatWentWell(e.what_went_well || '');
        setBiggestMistake(e.biggest_mistake || '');
        setTomorrowFocus(e.tomorrow_focus || '');
      } else {
        setMentalState(''); setMarketBias('');
        setS1(''); setS2(''); setR1(''); setR2('');
        setDailyLossLimit(''); setProfitTarget('');
        setWhatWentWell(''); setBiggestMistake(''); setTomorrowFocus('');
      }
    } catch {}
    finally { setDjLoading(false); }
  }, [today]);

  /* Today: load trades */
  const loadTrades = useCallback(async () => {
    const [todayRes, pendingRes] = await Promise.all([
      authFetch('/api/journal/today').then(r => r.json()).catch(() => null),
      tier === 'connected'
        ? authFetch('/api/journal/pending').then(r => r.json()).catch(() => null)
        : Promise.resolve(null),
    ]);
    setTodayData(todayRes || null);
    setPending(pendingRes?.pending || []);
  }, [tier]);

  /* Today: load trading plan */
  const loadPlan = useCallback(async () => {
    setPlanLoading(true);
    try {
      const res  = await authFetch(`/api/plans?date=${today}`);
      const data = await res.json();
      const p    = data.plan;
      if (p) {
        setPlanId(p.id);
        setPlanMaxTrades(p.max_trades_per_day || 5);
        setPlanMaxLoss(p.max_loss_per_day || 5000);
        const r = Array.isArray(p.risk_rules) ? p.risk_rules[0] : p.risk_rules;
        setPlanNoTradeBefore(r?.no_trade_before_minutes ?? 15);
        setPlanMaxQtyPerScript(r?.max_quantity_per_script ?? 50);
        setPlanScenarios((p.scenarios || []).map(sc => ({
          id: sc.id,
          conditionType: sc.condition_type || 'range',
          conditionValueLow: sc.condition_value_low ?? '',
          conditionValueHigh: sc.condition_value_high ?? '',
          action: sc.action || 'buy_ce',
          instrument: sc.instrument || '',
          maxQuantity: sc.max_quantity || 25,
          entryReason: sc.entry_reason || '',
          entryPrice: sc.entry_price ?? '',
          targetPrice: sc.target_price ?? '',
          stopLoss: sc.stop_loss ?? '',
          product: sc.product || 'I',
        })));
      } else {
        setPlanId(null);
        setPlanScenarios([]);
      }
    } catch {}
    finally { setPlanLoading(false); }
  }, [today]);

  async function savePlan() {
    setPlanSaving(true);
    try {
      const body = {
        title: `Plan · ${today}`,
        date: today,
        maxTradesPerDay: parseInt(planMaxTrades, 10) || 5,
        maxLossPerDay: parseFloat(planMaxLoss) || 5000,
        scenarios: planScenarios.map(s => ({
          conditionType: s.conditionType,
          conditionValueLow:  s.conditionValueLow  ? parseFloat(s.conditionValueLow)  : null,
          conditionValueHigh: s.conditionValueHigh ? parseFloat(s.conditionValueHigh) : null,
          action: s.action,
          instrument: s.instrument,
          maxQuantity: parseInt(s.maxQuantity, 10) || 25,
          entryReason: s.entryReason || '',
          entryPrice:  s.entryPrice  ? parseFloat(s.entryPrice)  : null,
          targetPrice: s.targetPrice ? parseFloat(s.targetPrice) : null,
          stopLoss:    s.stopLoss    ? parseFloat(s.stopLoss)    : null,
          product: s.product || 'I',
        })),
        riskRules: {
          maxQuantityPerScript: parseInt(planMaxQtyPerScript, 10) || 50,
          noTradeBeforeMinutes: parseInt(planNoTradeBefore, 10) || 15,
          allowDuplicateScripts: false,
        },
      };
      const url    = planId ? `/api/plans/${planId}` : '/api/plans';
      const method = planId ? 'PATCH' : 'POST';
      const res  = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save plan');
      if (!planId && data.planId) setPlanId(data.planId);
      setPlanSaved(true); setTimeout(() => setPlanSaved(false), 2000);
    } catch (err) { alert(err.message); }
    finally { setPlanSaving(false); }
  }

  function blankScenario() {
    return { conditionType: 'range', conditionValueLow: '', conditionValueHigh: '', action: 'buy_ce', instrument: '', maxQuantity: 25, entryReason: '', entryPrice: '', targetPrice: '', stopLoss: '', product: 'I' };
  }
  function addPlanScenario() { setPlanScenarios(prev => [...prev, blankScenario()]); }
  function removePlanScenario(i) { setPlanScenarios(prev => prev.filter((_, idx) => idx !== i)); }
  function updatePlanScenario(i, key, val) { setPlanScenarios(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: val } : s)); }

  useEffect(() => {
    if (tab === 'today') { loadDJ(); loadTrades(); loadPlan(); }
  }, [tab, loadDJ, loadTrades, loadPlan]);

  async function saveDJ() {
    setDjSaving(true);
    try {
      await authFetch('/api/daily-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today, mentalState, marketBias,
          s1: s1 || null, s2: s2 || null, r1: r1 || null, r2: r2 || null,
          dailyLossLimit: dailyLossLimit || null, profitTarget: profitTarget || null,
          whatWentWell, biggestMistake, tomorrowFocus,
        }),
      });
      setDjSaved(true); setTimeout(() => setDjSaved(false), 2000);
    } catch {}
    finally { setDjSaving(false); }
  }

  /* History: load trade history (once) */
  const loadHistory = useCallback(async () => {
    if (histLoaded) return;
    try {
      const res  = await authFetch('/api/journal/history?days=400');
      const data = await res.json();
      setHistGrouped(data.grouped || []);
      setHistLoaded(true);
    } catch {}
  }, [histLoaded]);

  /* History: load DJ dates for displayed month */
  const loadDJMonth = useCallback(async (month) => {
    try {
      const res  = await authFetch(`/api/daily-journal?month=${month}`);
      const data = await res.json();
      setDjMonthEntries(data.entries || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (tab === 'history') { loadHistory(); loadDJMonth(calMonth); }
    if (tab === 'manage' && !manageLoaded) loadManage();
  }, [tab]);

  useEffect(() => {
    if (tab === 'history') loadDJMonth(calMonth);
  }, [calMonth]);

  async function loadManage() {
    setManageLoading(true);
    try {
      const res  = await authFetch('/api/journal?mode=all');
      const data = await res.json();
      setManageEntries(data.entries || []);
      setManageLoaded(true);
    } catch {} finally { setManageLoading(false); }
  }

  async function handleMoveToTest(id) {
    try {
      await authFetch(`/api/journal/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeMode: 'test' }),
      });
      setManageEntries(prev => prev.map(e => e.id === id ? { ...e, trade_mode: 'test' } : e));
    } catch (err) { alert(err.message); }
    setManageAction(null);
  }

  async function handleDeleteTrade(id) {
    try {
      await authFetch(`/api/journal/${id}`, { method: 'DELETE' });
      setManageEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) { alert(err.message); }
    setManageAction(null);
  }

  /* History: select date */
  async function handleSelectDate(date) {
    if (date === selDate) { setSelDate(null); setSelDJ(null); setSelPlan(null); return; }
    setSelDate(date);
    setSelDJLoading(true);
    setSelPlan(null);
    try {
      const [djRes, planRes] = await Promise.all([
        authFetch(`/api/daily-journal?date=${date}`),
        authFetch(`/api/plans?date=${date}`),
      ]);
      const [djData, planData] = await Promise.all([djRes.json(), planRes.json()]);
      setSelDJ(djData.entry || null);
      setSelPlan(planData.plan || null);
    } catch { setSelDJ(null); setSelPlan(null); }
    finally { setSelDJLoading(false); }
  }

  /* Derived maps for calendar */
  const tradeDateMap = {};
  for (const g of histGrouped) tradeDateMap[g.date] = g;
  const djDateSet = new Set(djMonthEntries.map(e => e.date));

  const stats   = todayData?.stats   || {};
  const entries = todayData?.entries || [];

  const TAB_BTN = (active) => ({
    padding: '8px 22px', borderRadius: '10px', border: 'none',
    background: active ? 'var(--primary)' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
    fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s',
  });

  return (
    <div style={{ maxWidth: '700px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 12px' }}>📝 Journal</h1>
        <div style={{ display: 'inline-flex', background: 'var(--bg-secondary,#f0f0f0)', borderRadius: '12px', padding: '4px', gap: '4px' }}>
          <button style={TAB_BTN(tab === 'today')}   onClick={() => setTab('today')}>Today</button>
          <button style={TAB_BTN(tab === 'history')} onClick={() => setTab('history')}>History</button>
          <button style={TAB_BTN(tab === 'manage')}  onClick={() => setTab('manage')}>Manage</button>
        </div>
      </div>

      {/* ══ TODAY ══ */}
      {tab === 'today' && (
        <>
          <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
            📅 {fmtDisplayDate(today)}
          </div>

          {/* Pre-Market */}
          <Section icon="🌅" title="Pre-Market" subtitle="Mental state · Bias · Key levels · Targets"
            accentColor="#1a237e" accentBg="#f0f2ff">
            {djLoading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading…</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Mental State</label>
                  <PillSelect options={MENTAL_STATES} value={mentalState} onChange={setMentalState} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Market Bias</label>
                  <PillSelect options={BIASES} value={marketBias} onChange={setMarketBias} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Key Levels</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <NumInput label="Support 1 (S1)" value={s1} onChange={setS1} placeholder="24200" />
                    <NumInput label="Support 2 (S2)" value={s2} onChange={setS2} placeholder="24000" />
                    <NumInput label="Resistance 1 (R1)" value={r1} onChange={setR1} placeholder="24500" />
                    <NumInput label="Resistance 2 (R2)" value={r2} onChange={setR2} placeholder="24700" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <NumInput label="Daily Loss Limit (₹)" value={dailyLossLimit} onChange={setDailyLossLimit} placeholder="3000" />
                  <NumInput label="Profit Target (₹)" value={profitTarget} onChange={setProfitTarget} placeholder="5000" />
                </div>
                {dailyLossLimit && profitTarget && (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'right' }}>
                    Target:Risk = <strong style={{ color: parseFloat(profitTarget) / parseFloat(dailyLossLimit) >= 1.5 ? 'var(--buy)' : 'var(--warning)' }}>
                      {(parseFloat(profitTarget) / parseFloat(dailyLossLimit)).toFixed(1)}:1
                    </strong>
                  </div>
                )}
                <button onClick={saveDJ} disabled={djSaving} style={{
                  alignSelf: 'flex-start', padding: '9px 20px',
                  background: djSaved ? '#2e7d32' : 'var(--primary)',
                  color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                  cursor: djSaving ? 'not-allowed' : 'pointer', transition: 'background 0.3s',
                }}>
                  {djSaving ? 'Saving…' : djSaved ? '✅ Saved' : '💾 Save Pre-Market'}
                </button>
              </div>
            )}
          </Section>

          {/* Trading Plan */}
          <Section icon="📋" title="Trading Plan" subtitle="If-then scenarios · Risk rules"
            accentColor="#4a148c" accentBg="#f9f4ff">
            {planLoading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading…</div>
            ) : (
              <>
                {planScenarios.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>📋</div>
                    <div style={{ fontSize: '13px' }}>No scenarios yet. Build your if-then plan before you trade.</div>
                  </div>
                )}

                {planScenarios.map((s, i) => {
                  const ep  = parseFloat(s.entryPrice);
                  const sl  = parseFloat(s.stopLoss);
                  const tgt = parseFloat(s.targetPrice);
                  const rr  = ep && sl && tgt && Math.abs(ep - sl) > 0
                    ? (Math.abs(tgt - ep) / Math.abs(ep - sl)).toFixed(2) : null;
                  return (
                    <div key={i} style={{ border: '1px solid #e1d4f9', borderRadius: '12px', padding: '14px', marginBottom: '10px', background: '#fdf9ff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <strong style={{ fontSize: '12px', color: '#4a148c', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Scenario {i + 1}</strong>
                        <button onClick={() => removePlanScenario(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sell)', fontSize: '16px', lineHeight: 1, padding: 0 }}>✕</button>
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>IF Nifty is</div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          {['range', 'above', 'below'].map(t => (
                            <button key={t} onClick={() => updatePlanScenario(i, 'conditionType', t)} style={{
                              padding: '4px 12px', borderRadius: '12px', border: '1.5px solid',
                              borderColor: s.conditionType === t ? '#4a148c' : 'var(--border)',
                              background: s.conditionType === t ? '#4a148c' : '#fff',
                              color: s.conditionType === t ? '#fff' : 'var(--text-muted)',
                              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                          ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: s.conditionType === 'range' ? '1fr 1fr' : '1fr', gap: '6px' }}>
                          <input type="number" value={s.conditionValueLow} onChange={e => updatePlanScenario(i, 'conditionValueLow', e.target.value)}
                            placeholder={s.conditionType === 'range' ? 'Low level' : s.conditionType === 'above' ? 'Above level' : 'Below level'}
                            style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
                          {s.conditionType === 'range' && (
                            <input type="number" value={s.conditionValueHigh} onChange={e => updatePlanScenario(i, 'conditionValueHigh', e.target.value)}
                              placeholder="High level"
                              style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
                          )}
                        </div>
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>THEN</div>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {Object.entries(ACTION_LABELS).map(([key, label]) => (
                            <button key={key} onClick={() => updatePlanScenario(i, 'action', key)} style={{
                              padding: '4px 10px', borderRadius: '12px', border: '1.5px solid',
                              borderColor: s.action === key ? (key.startsWith('buy') ? 'var(--buy)' : key.startsWith('sell') ? 'var(--sell)' : '#666') : 'var(--border)',
                              background: s.action === key ? (key.startsWith('buy') ? '#e8f5e9' : key.startsWith('sell') ? '#fce4ec' : '#f0f0f0') : '#fff',
                              color: s.action === key ? (key.startsWith('buy') ? 'var(--buy)' : key.startsWith('sell') ? 'var(--sell)' : '#333') : 'var(--text-muted)',
                              fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                            }}>{label}</button>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        {[
                          ['Instrument', 'instrument', 'text', 'NIFTY CE'],
                          ['Entry Price', 'entryPrice', 'number', '0.00'],
                          ['Stop Loss', 'stopLoss', 'number', '0.00'],
                          ['Target', 'targetPrice', 'number', '0.00'],
                        ].map(([lbl, key, type, ph]) => (
                          <div key={key}>
                            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{lbl}</label>
                            <input type={type} value={s[key] ?? ''} onChange={e => updatePlanScenario(i, key, type === 'text' ? e.target.value.toUpperCase() : e.target.value)}
                              placeholder={ph} style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', textTransform: type === 'text' ? 'uppercase' : 'none' }} />
                          </div>
                        ))}
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Entry Reason / Notes</label>
                        <input value={s.entryReason} onChange={e => updatePlanScenario(i, 'entryReason', e.target.value)}
                          placeholder="Breakout, trend, news catalyst..." style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {rr ? (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            R:R = <strong style={{ color: parseFloat(rr) >= 1.5 ? 'var(--buy)' : 'var(--sell)' }}>{rr}:1</strong>
                          </span>
                        ) : <span />}
                        <button onClick={() => {
                          const dir = s.action.startsWith('sell') ? 'SELL' : 'BUY';
                          setPrefillModal({ instrument: s.instrument, direction: dir, entryPrice: s.entryPrice, stopLoss: s.stopLoss, targetPrice: s.targetPrice });
                          setManualModal(true);
                        }} style={{
                          padding: '7px 16px', background: 'var(--primary)', color: '#fff',
                          border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                        }}>
                          Log Trade →
                        </button>
                      </div>
                    </div>
                  );
                })}

                <button onClick={addPlanScenario} style={{
                  width: '100%', padding: '10px', border: '2px dashed #c4b5f4', borderRadius: '8px',
                  background: 'none', cursor: 'pointer', color: '#4a148c', fontWeight: 600, fontSize: '13px', marginBottom: '14px',
                }}>
                  + Add Scenario
                </button>

                <div style={{ background: '#f5f5f5', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '10px' }}>Risk Rules</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      ['Max Trades/Day', planMaxTrades, setPlanMaxTrades],
                      ['Max Loss (₹)', planMaxLoss, setPlanMaxLoss],
                      ['No-Trade (min after 9:15)', planNoTradeBefore, setPlanNoTradeBefore],
                      ['Max Qty/Script', planMaxQtyPerScript, setPlanMaxQtyPerScript],
                    ].map(([label, val, setter]) => (
                      <div key={label}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{label}</label>
                        <input type="number" min={0} value={val} onChange={e => setter(e.target.value)}
                          style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={savePlan} disabled={planSaving} style={{
                  padding: '9px 22px', background: planSaved ? '#2e7d32' : '#4a148c',
                  color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                  cursor: planSaving ? 'not-allowed' : 'pointer', transition: 'background 0.3s',
                }}>
                  {planSaving ? 'Saving…' : planSaved ? '✅ Saved' : '💾 Save Plan'}
                </button>
              </>
            )}
          </Section>

          {/* Trade Log */}
          <Section icon="📊" title="Trade Log"
            subtitle={`${entries.length} trade${entries.length !== 1 ? 's' : ''} · ${stats.totalPnl != null ? (stats.totalPnl >= 0 ? '+' : '') + '₹' + Math.abs(stats.totalPnl).toFixed(0) : '₹0'} net P&L`}
            accentColor="#1b5e20" accentBg="#f0fff4">

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {[
                { label: 'Trades',   value: stats.totalTrades ?? 0 },
                { label: 'Journaled', value: stats.journaled ?? 0 },
                { label: 'Plan %',   value: stats.planPct != null ? `${stats.planPct}%` : '—', color: stats.planPct >= 70 ? 'var(--buy)' : stats.planPct >= 40 ? 'var(--warning)' : stats.planPct != null ? 'var(--sell)' : undefined },
                { label: 'Net P&L',  value: stats.totalPnl != null ? `${stats.totalPnl >= 0 ? '+' : ''}₹${Math.abs(stats.totalPnl).toFixed(0)}` : '—', color: pnlColor(stats.totalPnl) },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: color || 'var(--text)' }}>{value}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
                </div>
              ))}
            </div>

            {pending.length > 0 && (
              <div style={{ marginBottom: '14px', background: '#fff8e1', border: '1px solid #ffcc02', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ fontWeight: 700, color: '#e65100', marginBottom: '8px', fontSize: '13px' }}>⏳ {pending.length} pending from broker</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pending.map(o => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px' }}><strong>{o.trading_symbol}</strong> · {o.transaction_type} · {o.quantity}</span>
                      <button onClick={() => setBrokerModal({ open: true, orderId: o.id, planId: o.plan_id || null })}
                        style={{ padding: '5px 12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        Log →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>No trades logged today</div>
                <div style={{ fontSize: '12px', marginBottom: '14px' }}>Log every trade — wins and losses</div>
                <button onClick={() => setManualModal(true)} style={{ padding: '9px 18px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  + Log a Trade
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                {entries.map(e => <TradeCard key={e.id} entry={e} />)}
              </div>
            )}

            {entries.length > 0 && (
              <button onClick={() => setManualModal(true)} style={{
                width: '100%', padding: '10px', border: '2px dashed var(--border)', borderRadius: '8px',
                background: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '13px',
              }}>
                + Log Another Trade
              </button>
            )}
          </Section>

          {/* Post-Market */}
          <Section icon="🌆" title="Post-Market" subtitle="EOD reflection · Lessons · Tomorrow's focus"
            accentColor="#e65100" accentBg="#fff8f0" defaultOpen={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: '✅ What I Did Well',   value: whatWentWell,   onChange: setWhatWentWell,   placeholder: 'Followed my plan, respected SL, stayed patient...' },
                { label: '❌ Biggest Mistake',   value: biggestMistake, onChange: setBiggestMistake, placeholder: 'Revenge traded after first loss, overtraded...' },
                { label: "🎯 Tomorrow's Focus",  value: tomorrowFocus,  onChange: setTomorrowFocus,  placeholder: 'Wait for confirmation, no trades in first 15 minutes...' },
              ].map(({ label, value, onChange, placeholder }) => (
                <div key={label}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</label>
                  <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
                </div>
              ))}
              <button onClick={saveDJ} disabled={djSaving} style={{
                alignSelf: 'flex-start', padding: '9px 20px', background: djSaved ? '#2e7d32' : '#e65100',
                color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                cursor: djSaving ? 'not-allowed' : 'pointer', transition: 'background 0.3s',
              }}>
                {djSaving ? 'Saving…' : djSaved ? '✅ Saved' : '💾 Save Reflection'}
              </button>
            </div>
          </Section>

          <ManualJournalModal isOpen={manualModal} onClose={() => { setManualModal(false); setPrefillModal(null); }} onSaved={loadTrades} tradeMode={userTestMode ? 'test' : 'real'} prefill={prefillModal} />
          <JournalModal
            isOpen={brokerModal.open}
            orderId={brokerModal.orderId}
            planId={brokerModal.planId}
            onClose={() => { setBrokerModal({ open: false, orderId: null, planId: null }); loadTrades(); }}
          />
        </>
      )}

      {/* ══ HISTORY ══ */}
      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <CalendarView
            calMonth={calMonth}
            onMonthChange={(month) => { setCalMonth(month); setSelDate(null); setSelDJ(null); setSelPlan(null); }}
            tradeDateMap={tradeDateMap}
            djDateSet={djDateSet}
            selectedDate={selDate}
            onSelectDate={handleSelectDate}
          />
          <DayDetail
            date={selDate}
            djEntry={selDJ}
            tradeGroup={selDate ? tradeDateMap[selDate] : null}
            dayPlan={selPlan}
            loading={selDJLoading}
          />
        </div>
      )}

      {/* ══ MANAGE ══ */}
      {tab === 'manage' && (
        <div>
          {/* Confirm modal */}
          {manageAction && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 340, width: '100%' }}>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
                  {manageAction.type === 'delete' ? '🗑️ Delete Test Trade?' : '🧪 Move to Test?'}
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
                  {manageAction.type === 'delete'
                    ? 'This test trade will be permanently deleted and cannot be recovered.'
                    : 'This real trade will be moved to test. This cannot be undone — test trades cannot be moved back to real.'}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setManageAction(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                  <button
                    onClick={() => manageAction.type === 'delete' ? handleDeleteTrade(manageAction.id) : handleMoveToTest(manageAction.id)}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: manageAction.type === 'delete' ? '#dc2626' : '#f59e0b', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                  >
                    {manageAction.type === 'delete' ? 'Delete' : 'Move to Test'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              placeholder="Search instrument…"
              value={manageFilter.search}
              onChange={e => setManageFilter(f => ({ ...f, search: e.target.value }))}
              style={{ flex: '1 1 140px', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            />
            {['all','real','test'].map(m => (
              <button key={m} onClick={() => setManageFilter(f => ({ ...f, mode: m }))}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  borderColor: manageFilter.mode === m ? (m === 'test' ? '#f59e0b' : m === 'real' ? '#6366f1' : '#374151') : '#e5e7eb',
                  background: manageFilter.mode === m ? (m === 'test' ? '#fef3c7' : m === 'real' ? '#ede9fe' : '#f3f4f6') : '#fff',
                  color: manageFilter.mode === m ? (m === 'test' ? '#92400e' : m === 'real' ? '#4338ca' : '#374151') : '#9ca3af',
                }}>
                {m === 'all' ? 'All' : m === 'real' ? '📊 Real' : '🧪 Test'}
              </button>
            ))}
            {['all','win','loss'].map(r => (
              <button key={r} onClick={() => setManageFilter(f => ({ ...f, result: r }))}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  borderColor: manageFilter.result === r ? '#374151' : '#e5e7eb',
                  background: manageFilter.result === r ? '#f3f4f6' : '#fff',
                  color: manageFilter.result === r ? '#374151' : '#9ca3af',
                }}>
                {r === 'all' ? 'All results' : r === 'win' ? '✅ Win' : '❌ Loss'}
              </button>
            ))}
          </div>

          {/* Table */}
          {manageLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</div>
          ) : (() => {
            const filtered = manageEntries.filter(e => {
              if (manageFilter.mode !== 'all' && e.trade_mode !== manageFilter.mode) return false;
              if (manageFilter.result === 'win'  && (e.pnl || 0) <= 0) return false;
              if (manageFilter.result === 'loss' && (e.pnl || 0) >= 0) return false;
              if (manageFilter.search && !(e.instrument || '').toLowerCase().includes(manageFilter.search.toLowerCase())) return false;
              return true;
            });

            if (!filtered.length) return (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>No trades match the filters</div>
            );

            return (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                      {['Date', 'Instrument', 'Dir', 'P&L', 'Plan?', 'Mode', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(e => {
                      const isTest = e.trade_mode === 'test';
                      const pnlPos = (e.pnl || 0) >= 0;
                      return (
                        <tr key={e.id} style={{ borderBottom: '1px solid var(--border)', background: isTest ? '#fffbeb' : '#fff' }}>
                          <td style={{ padding: '10px 10px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{e.trade_date || '—'}</td>
                          <td style={{ padding: '10px 10px', fontWeight: 700 }}>{e.instrument || '—'}</td>
                          <td style={{ padding: '10px 10px', color: e.direction === 'long' ? 'var(--buy)' : 'var(--sell)', fontWeight: 700, textTransform: 'uppercase' }}>{e.direction || '—'}</td>
                          <td style={{ padding: '10px 10px', fontWeight: 700, color: pnlPos ? 'var(--buy)' : 'var(--sell)' }}>
                            {e.pnl != null ? `${pnlPos ? '+' : ''}₹${Math.abs(e.pnl).toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td style={{ padding: '10px 10px' }}>
                            {e.followed_plan === true ? '✅' : e.followed_plan === false ? '❌' : '—'}
                          </td>
                          <td style={{ padding: '10px 10px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                              background: isTest ? '#fef3c7' : '#ede9fe',
                              color: isTest ? '#92400e' : '#4338ca' }}>
                              {isTest ? '🧪 Test' : '📊 Real'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                            {isTest ? (
                              <button onClick={() => setManageAction({ type: 'delete', id: e.id })}
                                style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                🗑️ Delete
                              </button>
                            ) : (
                              <button onClick={() => setManageAction({ type: 'move', id: e.id })}
                                style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                🧪 Move to Test
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, textAlign: 'right' }}>
                  {filtered.length} trade{filtered.length !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
