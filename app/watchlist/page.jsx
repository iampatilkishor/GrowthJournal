'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { authFetch } from '@/lib/authFetch.js';
import { useMarketFeed } from '@/hooks/useMarketFeed.js';
import InstrumentSearch from '@/components/InstrumentSearch.jsx';
import Toast from '@/components/Toast.jsx';
import QuickOrderModal from '@/components/QuickOrderModal.jsx';

function fmt(n, digits = 2) {
  if (n == null) return '—';
  return n.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function pnlColor(v) { return v == null ? 'inherit' : v >= 0 ? 'var(--buy)' : 'var(--sell)'; }

/* ── Editable quantity ───────────────────────────────── */
function EditableQty({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const ref = useRef(null);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  function commit() {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0) onSave(n);
    setEditing(false);
  }
  if (editing) {
    return (
      <input ref={ref} type="number" min={1} value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        style={{ width: '60px', padding: '3px 6px', border: '2px solid var(--primary)', borderRadius: '6px', fontSize: '13px', fontWeight: 700, textAlign: 'center' }}
      />
    );
  }
  return (
    <span onClick={e => { e.stopPropagation(); setVal(value); setEditing(true); }} title="Click to edit"
      style={{ cursor: 'pointer', fontWeight: 700, fontSize: '13px', borderBottom: '1px dashed #ccc', paddingBottom: '1px' }}>
      {value}
    </span>
  );
}

/* ── Plan Picker Modal ───────────────────────────────── */
function PlanPickerModal({ instrument, plans, onConfirm, onCancel }) {
  const [selectedPlanId, setSelectedPlanId] = useState('none');
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 900, padding: '16px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '380px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)', overflow: 'hidden',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ background: 'var(--primary)', padding: '16px 20px' }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: '16px' }}>{instrument.symbol}</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', marginTop: '2px' }}>
            {instrument.exchange} · {instrument.instrumentType || 'Instrument'}
          </div>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '12px' }}>Link to a plan?</div>

          {/* No plan */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
            borderRadius: '8px', cursor: 'pointer', marginBottom: '8px',
            border: `2px solid ${selectedPlanId === 'none' ? 'var(--primary)' : 'var(--border)'}`,
            background: selectedPlanId === 'none' ? 'var(--primary-light)' : '#fff',
          }}>
            <input type="radio" name="plan" value="none" checked={selectedPlanId === 'none'}
              onChange={() => setSelectedPlanId('none')} style={{ accentColor: 'var(--primary)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>No plan</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Just watch this instrument</div>
            </div>
          </label>

          {plans.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>
              No plans yet. You can still add to watchlist.
            </div>
          ) : plans.map(p => (
            <label key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
              borderRadius: '8px', cursor: 'pointer', marginBottom: '8px',
              border: `2px solid ${selectedPlanId === String(p.id) ? 'var(--primary)' : 'var(--border)'}`,
              background: selectedPlanId === String(p.id) ? 'var(--primary-light)' : '#fff',
            }}>
              <input type="radio" name="plan" value={String(p.id)}
                checked={selectedPlanId === String(p.id)}
                onChange={() => setSelectedPlanId(String(p.id))}
                style={{ accentColor: 'var(--primary)' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{p.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {p.date} · {p.bias} bias
                  {p.is_active ? <span style={{ color: 'var(--buy)', marginLeft: '6px' }}>● active</span> : ''}
                </div>
              </div>
            </label>
          ))}

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button onClick={() => onConfirm(selectedPlanId === 'none' ? null : Number(selectedPlanId))}
              className="btn btn-primary" style={{ flex: 1 }}>
              Add to Watchlist
            </button>
            <button onClick={onCancel} style={{
              padding: '10px 16px', border: '1px solid var(--border)', borderRadius: '8px',
              background: '#fff', color: '#666', cursor: 'pointer', fontWeight: 600,
            }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Watchlist Card ──────────────────────────────────── */
function WatchCard({ item, onDelete, onSaveQty, onLinkPlan, plans, onOrder }) {
  const hasPos = item.position && item.position.quantity !== 0;
  const hasLtp = item.ltp != null;
  const up  = hasLtp && (item.change != null ? item.change >= 0 : (item.change_pct ?? 0) >= 0);
  const clr = up ? 'var(--buy)' : 'var(--sell)';

  return (
    <div style={{
      background: '#fff',
      borderRadius: '10px',
      border: `1px solid ${hasPos ? '#a5d6a7' : 'var(--border)'}`,
      borderLeft: `3px solid ${hasPos ? 'var(--buy)' : (hasLtp ? clr : 'var(--border)')}`,
      padding: '10px 12px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column', gap: '6px',
    }}>

      {/* Row 1: Symbol + LTP + delete */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.symbol}
          </div>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginTop: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', padding: '1px 6px', borderRadius: '3px' }}>
              {item.exchange}
            </span>
            {item.plan_id ? (
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#e65100', background: '#fff3e0', padding: '1px 6px', borderRadius: '3px' }}>
                📋 #{item.plan_id}
              </span>
            ) : (
              <button onClick={e => { e.stopPropagation(); onLinkPlan(item); }}
                style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', background: 'none', border: '1px dashed #d1d5db', padding: '1px 6px', borderRadius: '3px', cursor: 'pointer' }}>
                + plan
              </button>
            )}
          </div>
        </div>

        {/* LTP */}
        <div style={{ textAlign: 'right', marginRight: '8px', flexShrink: 0 }}>
          {hasLtp ? (
            <>
              <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text)' }}>₹{fmt(item.ltp)}</div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: clr }}>
                {up ? '▲' : '▼'}{item.change != null ? fmt(Math.abs(item.change)) : '—'}
                {item.change_pct != null ? ` (${Math.abs(item.change_pct).toFixed(1)}%)` : ''}
              </div>
            </>
          ) : (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No data</div>
          )}
        </div>

        <button onClick={e => { e.stopPropagation(); onDelete(item.id, item.symbol); }} title="Remove"
          style={{ background: 'none', border: 'none', color: '#d1d5db', fontSize: '13px', cursor: 'pointer', padding: '0 2px', lineHeight: 1, flexShrink: 0 }}>
          ✕
        </button>
      </div>

      {/* Row 2: OHLC + qty (right-aligned) */}
      {item.ohlc && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>
          <span>O <b style={{ color: 'var(--text)' }}>{fmt(item.ohlc.open)}</b></span>
          <span>H <b style={{ color: 'var(--buy)' }}>{fmt(item.ohlc.high)}</b></span>
          <span>L <b style={{ color: 'var(--sell)' }}>{fmt(item.ohlc.low)}</b></span>
          <span>C <b style={{ color: 'var(--text)' }}>{fmt(item.ohlc.close)}</b></span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {hasPos && (
              <span style={{ fontWeight: 700, color: pnlColor(item.position.pnl) }}>
                P&L {item.position.pnl != null ? `${item.position.pnl >= 0 ? '+' : ''}₹${fmt(item.position.pnl)}` : '—'}
              </span>
            )}
            <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              qty: <EditableQty value={item.max_quantity} onSave={qty => onSaveQty(item.id, qty)} />
            </span>
          </div>
        </div>
      )}

      {/* Row 3: BUY/SELL full width */}
      {item.plan_id && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={e => { e.stopPropagation(); onOrder(item, 'BUY'); }}
            style={{ flex: 1, padding: '5px 0', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'var(--buy)', color: '#fff', fontWeight: 700, fontSize: '11px' }}>
            ▲ BUY
          </button>
          <button onClick={e => { e.stopPropagation(); onOrder(item, 'SELL'); }}
            style={{ flex: 1, padding: '5px 0', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'var(--sell)', color: '#fff', fontWeight: 700, fontSize: '11px' }}>
            ▼ SELL
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────── */
export default function WatchlistPage() {
  const [items, setItems] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [picker, setPicker] = useState(null);
  const [adding, setAdding] = useState(false);
  const [linkTarget, setLinkTarget] = useState(null);
  const [orderTarget, setOrderTarget] = useState(null); // { item, side }

  const fetchItems = useCallback(async () => {
    try {
      const res = await authFetch('/api/watchlist');
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    authFetch('/api/plans').then(r => r.json()).then(d => setPlans(d.plans || [])).catch(() => {});
    // No polling interval — live prices come from useMarketFeed SSE stream
  }, [fetchItems]);

  // ── Live price feed ───────────────────────────────────────────────────────
  const instrumentKeys = useMemo(() => items.map(i => i.instrument_key), [items]);
  const { prices: livePrices, connected: liveConnected } = useMarketFeed(instrumentKeys);

  // Merge live LTP into items (OHLC + position stay from REST snapshot)
  const displayItems = useMemo(() => items.map(item => {
    const live = livePrices[item.instrument_key]
              || livePrices[item.instrument_key?.replace('|', ':')]
              || {};
    return {
      ...item,
      ltp:        live.ltp        ?? item.ltp,
      change:     live.change     ?? item.change,
      change_pct: live.change_pct ?? item.change_pct,
    };
  }), [items, livePrices]);

  async function handleConfirmAdd(planId) {
    if (!picker) return;
    setAdding(true);
    try {
      const res = await authFetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: picker.symbol,
          instrumentToken: picker.instrumentKey,
          exchange: picker.exchange || 'NSE',
          maxQuantity: picker.lotSize || 25,
          notes: '',
          planId: planId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add');
      setToast({ message: `${picker.symbol} added to watchlist`, type: 'success' });
      setPicker(null);
      await fetchItems();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id, symbol) {
    try {
      const res = await authFetch(`/api/watchlist/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to remove');
      }
      setItems(prev => prev.filter(i => i.id !== id));
      setToast({ message: `${symbol} removed`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  }

  async function handleLinkPlan(item) {
    setLinkTarget(item);
  }

  async function handleConfirmLink(planId) {
    if (!linkTarget) return;
    try {
      await authFetch(`/api/watchlist/${linkTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: planId || null }),
      });
      setLinkTarget(null);
      await fetchItems();
    } catch {
      setToast({ message: 'Failed to link plan', type: 'error' });
    }
  }

  async function handleUpdateQty(id, maxQuantity) {
    try {
      await authFetch(`/api/watchlist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxQuantity }),
      });
      setItems(prev => prev.map(i => i.id === id ? { ...i, max_quantity: maxQuantity } : i));
    } catch {
      setToast({ message: 'Failed to update quantity', type: 'error' });
    }
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>👁️ Watchlist</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Search and add instruments ·
          {liveConnected
            ? <span style={{ color: '#2e7d32', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2e7d32', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                Live
              </span>
            : <span style={{ color: 'var(--text-muted)' }}>connecting…</span>
          }
        </p>
      </div>

      {/* Inline search — always visible */}
      <div style={{
        background: '#fff', borderRadius: '14px', border: '1px solid var(--border)',
        padding: '16px', marginBottom: '20px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Add to watchlist
        </div>
        <InstrumentSearch
          placeholder="Search instrument… e.g. NIFTY, BANKNIFTY, RELIANCE"
          onSelect={selected => setPicker(selected)}
          existingKeys={items.map(i => i.instrument_key)}
        />
      </div>

      {/* Watchlist cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading watchlist…
        </div>
      ) : items.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: '#fff', borderRadius: '14px', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>👁️</div>
          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>Nothing here yet</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Search for an instrument above to start watching
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {displayItems.map(item => (
              <WatchCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onSaveQty={handleUpdateQty}
                onLinkPlan={handleLinkPlan}
                plans={plans}
                onOrder={(item, side) => setOrderTarget({ item, side })}
              />
            ))}
          </div>
          <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
            {items.length} instrument{items.length !== 1 ? 's' : ''} · prices update every second
          </div>
        </>
      )}

      {orderTarget && (
        <QuickOrderModal
          item={orderTarget.item}
          side={orderTarget.side}
          planId={orderTarget.item.plan_id}
          onClose={() => setOrderTarget(null)}
          onSuccess={() => { setOrderTarget(null); fetchItems(); }}
        />
      )}

      {linkTarget && (
        <PlanPickerModal
          instrument={linkTarget}
          plans={plans}
          onConfirm={handleConfirmLink}
          onCancel={() => setLinkTarget(null)}
        />
      )}

      {/* Plan picker modal */}
      {picker && (
        <PlanPickerModal
          instrument={picker}
          plans={plans}
          onConfirm={handleConfirmAdd}
          onCancel={() => setPicker(null)}
        />
      )}
    </div>
  );
}
