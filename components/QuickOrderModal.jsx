'use client';

import { useState } from 'react';
import JournalModal from './JournalModal.jsx';

/**
 * Props:
 *   item        — watchlist item (symbol, instrument_token, exchange, max_quantity, ltp, change_pct)
 *   side        — 'BUY' | 'SELL'  (also accepts defaultSide for legacy callers)
 *   plan        — plan object with .id  OR pass planId directly
 *   planId      — number  (overrides plan.id if passed)
 *   onClose     — () => void
 *   onSuccess   — () => void  (called after order placed; falls back to onClose)
 */
export default function QuickOrderModal({
  item,
  side: sideProp,
  defaultSide,
  plan,
  planId: planIdProp,
  onClose,
  onSuccess,
}) {
  const initialSide = sideProp || defaultSide || 'BUY';
  const resolvedPlanId = planIdProp ?? plan?.id ?? null;

  const [side, setSide] = useState(initialSide);
  const [quantity, setQuantity] = useState(item?.max_quantity ?? 25);
  const [orderType, setOrderType] = useState('MARKET');
  const [price, setPrice] = useState('');
  const [triggerPrice, setTriggerPrice] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [journalModal, setJournalModal] = useState({ open: false, orderId: null });

  if (!item) return null;

  const needsPrice   = orderType === 'LIMIT' || orderType === 'SL';
  const needsTrigger = orderType === 'SL' || orderType === 'SL-M';
  const activeColor  = side === 'BUY' ? 'var(--buy)' : 'var(--sell)';

  async function handlePlace() {
    if (!quantity || quantity < 1) { setError('Enter a valid quantity'); return; }
    setPlacing(true);
    setError('');
    try {
      const res = await fetch('/api/orders/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradingSymbol: item.symbol,
          instrumentToken: item.instrument_token,
          transactionType: side,
          quantity: Number(quantity),
          orderType,
          price: price ? parseFloat(price) : 0,
          triggerPrice: triggerPrice ? parseFloat(triggerPrice) : 0,
          planId: resolvedPlanId,
        }),
      });
      const data = await res.json();
      if (res.status === 403 && data.blocked) { setError(`Blocked: ${data.reason}`); return; }
      if (!res.ok) throw new Error(data.error || 'Order failed');
      if (data.promptJournal) {
        setJournalModal({ open: true, orderId: data.orderId });
      } else {
        (onSuccess || onClose)();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  function handleJournalClose() {
    setJournalModal({ open: false, orderId: null });
    (onSuccess || onClose)();
  }

  return (
    <>
      {/* Overlay — className lets CSS media query slide it up on mobile */}
      <div
        className="modal-overlay"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 900, padding: '16px',
        }}
      >
        <div
          className="modal"
          style={{
            background: '#fff', borderRadius: 'var(--radius)', width: '100%',
            maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            overflow: 'hidden',
          }}
        >
          {/* Header stripe */}
          <div style={{
            background: activeColor, padding: '14px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '17px' }}>{item.symbol}</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>{item.exchange}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {item.ltp != null && (
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '20px' }}>
                  ₹{item.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
              {item.change_pct != null && (
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px' }}>
                  {item.change_pct >= 0 ? '+' : ''}{item.change_pct.toFixed(2)}%
                </div>
              )}
              <button
                onClick={onClose}
                style={{
                  marginTop: '4px', background: 'rgba(255,255,255,0.2)', border: 'none',
                  color: '#fff', borderRadius: '50%', width: '26px', height: '26px',
                  cursor: 'pointer', fontSize: '14px', lineHeight: 1,
                }}
              >✕</button>
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            {/* BUY / SELL toggle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {['BUY', 'SELL'].map(s => (
                <button key={s} onClick={() => setSide(s)} style={{
                  padding: '10px', border: '2px solid',
                  borderColor: side === s ? (s === 'BUY' ? 'var(--buy)' : 'var(--sell)') : '#e0e0e0',
                  borderRadius: '8px',
                  background: side === s ? (s === 'BUY' ? 'var(--buy)' : 'var(--sell)') : '#fff',
                  color: side === s ? '#fff' : '#999',
                  fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                }}>
                  {s === 'BUY' ? '▲' : '▼'} {s}
                </button>
              ))}
            </div>

            {/* Quantity */}
            <div className="form-group">
              <label className="form-label">
                Quantity
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px', fontSize: '12px' }}>
                  (plan max: {item.max_quantity})
                </span>
              </label>
              <input className="form-input" type="number" min={1}
                value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>

            {/* Order type */}
            <div className="form-group">
              <label className="form-label">Order Type</label>
              <div className="pill-group">
                {['MARKET', 'LIMIT', 'SL', 'SL-M'].map(t => (
                  <button key={t}
                    className={`pill${orderType === t ? ' active' : ''}`}
                    onClick={() => setOrderType(t)}
                    style={{ fontSize: '12px', padding: '5px 12px' }}
                  >{t}</button>
                ))}
              </div>
            </div>

            {needsPrice && (
              <div className="form-group">
                <label className="form-label">Price (₹)</label>
                <input className="form-input" type="number" step="0.05"
                  value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
              </div>
            )}
            {needsTrigger && (
              <div className="form-group">
                <label className="form-label">Trigger Price (₹)</label>
                <input className="form-input" type="number" step="0.05"
                  value={triggerPrice} onChange={e => setTriggerPrice(e.target.value)} placeholder="0.00" />
              </div>
            )}

            {error && (
              <div style={{
                background: '#fff5f5', borderLeft: '3px solid var(--sell)',
                padding: '10px 12px', borderRadius: '6px', marginBottom: '12px',
                fontSize: '13px', color: 'var(--sell)',
              }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={handlePlace}
                disabled={placing}
                style={{
                  padding: '12px', border: 'none', borderRadius: '8px',
                  background: activeColor, color: '#fff',
                  fontWeight: 700, fontSize: '15px',
                  cursor: placing ? 'not-allowed' : 'pointer',
                  opacity: placing ? 0.7 : 1,
                }}
              >
                {placing ? '⏳ Placing…' : `${side === 'BUY' ? '▲' : '▼'} ${side}`}
              </button>
              <button onClick={onClose} style={{
                padding: '12px', border: '1px solid var(--border)',
                borderRadius: '8px', background: '#fff', color: '#666',
                fontWeight: 600, fontSize: '15px', cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <JournalModal
        isOpen={journalModal.open}
        orderId={journalModal.orderId}
        planId={resolvedPlanId}
        onClose={handleJournalClose}
      />
    </>
  );
}
