'use client';

import { useState } from 'react';
import { authFetch } from '@/lib/authFetch.js';

const EMOTIONS = [
  { key: 'calm',      label: '😌 Calm',       color: '#1976d2' },
  { key: 'confident', label: '💪 Confident',   color: '#2e7d32' },
  { key: 'fomo',      label: '😰 FOMO',        color: '#f57c00' },
  { key: 'revenge',   label: '😤 Revenge',     color: '#c62828' },
  { key: 'anxious',   label: '😟 Anxious',     color: '#f9a825' },
  { key: 'unsure',    label: '🤔 Unsure',      color: '#7b1fa2' },
];

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
        {label}{required && <span style={{ color: 'var(--sell)', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, placeholder, step = '0.01' }) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      step={step}
      style={{
        width: '100%', padding: '9px 12px',
        border: '1px solid var(--border)', borderRadius: '8px',
        fontSize: '14px', fontFamily: 'inherit', outline: 'none',
        background: '#fff',
      }}
    />
  );
}

export default function ManualJournalModal({ isOpen, onClose, onSaved }) {
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    tradeDate:   today,
    instrument:  '',
    direction:   '',
    entryPrice:  '',
    stopLoss:    '',
    targetPrice: '',
    exitPrice:   '',
    qty:         '',
    grossPnl:    '',
    brokerage:   '',
    followedPlan: null,
    emotion:     '',
    entryReason: '',
    outcomeNotes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  if (!isOpen) return null;

  function set(key, val) {
    setForm(prev => {
      const next = { ...prev, [key]: val };
      // Auto-calculate gross P&L whenever price fields change
      if (['exitPrice', 'entryPrice', 'qty', 'direction'].includes(key)) {
        const ep  = parseFloat(next.entryPrice) || 0;
        const xp  = parseFloat(next.exitPrice)  || 0;
        const q   = parseFloat(next.qty)        || 0;
        const dir = next.direction;
        if (ep && xp && q && dir) {
          const gross = dir === 'BUY' ? (xp - ep) * q : (ep - xp) * q;
          next.grossPnl = gross.toFixed(2);
        }
      }
      return next;
    });
  }

  // Net P&L = gross - brokerage
  const grossNum = parseFloat(form.grossPnl) || 0;
  const brokerNum = parseFloat(form.brokerage) || 0;
  const netPnl = grossNum - brokerNum;
  const netColor = netPnl > 0 ? '#2e7d32' : netPnl < 0 ? '#c62828' : 'var(--text-muted)';

  async function handleSave() {
    if (!form.instrument.trim()) { setError('Instrument is required'); return; }
    if (!form.direction) { setError('Select BUY or SELL'); return; }
    if (form.followedPlan === null) { setError('Did you follow your plan?'); return; }

    setSaving(true);
    setError('');
    try {
      const res = await authFetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeDate:   form.tradeDate,
          instrument:  form.instrument.trim().toUpperCase(),
          direction:   form.direction,
          entryPrice:  form.entryPrice ? parseFloat(form.entryPrice) : null,
          stopLoss:    form.stopLoss   ? parseFloat(form.stopLoss)   : null,
          targetPrice: form.targetPrice ? parseFloat(form.targetPrice) : null,
          exitPrice:   form.exitPrice  ? parseFloat(form.exitPrice)  : null,
          qty:         form.qty        ? parseInt(form.qty)          : null,
          grossPnl:    form.grossPnl   ? parseFloat(form.grossPnl)   : null,
          brokerage:   form.brokerage  ? parseFloat(form.brokerage)  : null,
          followedPlan: form.followedPlan,
          emotion:     form.emotion,
          entryReason: form.entryReason,
          outcomeNotes: form.outcomeNotes,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save');
      }
      // Reset form
      setForm({ tradeDate: today, instrument: '', direction: '', entryPrice: '', stopLoss: '', targetPrice: '', exitPrice: '', qty: '', grossPnl: '', brokerage: '', followedPlan: null, emotion: '', entryReason: '', outcomeNotes: '' });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, padding: '0' }}>
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '600px',
        maxHeight: '92vh', overflowY: 'auto', padding: '24px 20px 32px',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
      }}>
        {/* Handle bar */}
        <div style={{ width: '40px', height: '4px', background: '#e0e0e0', borderRadius: '2px', margin: '0 auto 20px' }} />

        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>📝</div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>Log a Trade</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>Record your trade for the Crorepati journey</p>
        </div>

        {/* Section: Trade Details */}
        <div style={{ background: '#f8f9ff', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>Trade Details</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Date" required>
                <input
                  type="date"
                  value={form.tradeDate}
                  onChange={e => set('tradeDate', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
                />
              </Field>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Instrument" required>
                <input
                  type="text"
                  value={form.instrument}
                  onChange={e => set('instrument', e.target.value)}
                  placeholder="NIFTY, RELIANCE, BANKNIFTY..."
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', textTransform: 'uppercase' }}
                />
              </Field>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Direction" required>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {['BUY', 'SELL'].map(d => (
                    <button key={d} onClick={() => set('direction', d)} style={{
                      padding: '10px', borderRadius: '8px', border: '2px solid',
                      borderColor: form.direction === d ? (d === 'BUY' ? 'var(--buy)' : 'var(--sell)') : 'var(--border)',
                      background: form.direction === d ? (d === 'BUY' ? '#e8f5e9' : '#fce4ec') : '#fff',
                      color: form.direction === d ? (d === 'BUY' ? 'var(--buy)' : 'var(--sell)') : 'var(--text-muted)',
                      fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                    }}>
                      {d === 'BUY' ? '🟢' : '🔴'} {d}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <Field label="Entry Price">
              <NumInput value={form.entryPrice} onChange={v => set('entryPrice', v)} placeholder="0.00" />
            </Field>
            <Field label="Qty">
              <NumInput value={form.qty} onChange={v => set('qty', v)} placeholder="0" step="1" />
            </Field>
            <Field label="Stop Loss">
              <NumInput value={form.stopLoss} onChange={v => set('stopLoss', v)} placeholder="0.00" />
            </Field>
            <Field label="Target Price">
              <NumInput value={form.targetPrice} onChange={v => set('targetPrice', v)} placeholder="0.00" />
            </Field>
            <Field label="Exit Price">
              <NumInput value={form.exitPrice} onChange={v => set('exitPrice', v)} placeholder="0.00" />
            </Field>
          </div>
        </div>

        {/* Section: P&L */}
        <div style={{ background: '#f8fff9', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>P&amp;L</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Gross P&L (₹)">
              <NumInput value={form.grossPnl} onChange={v => set('grossPnl', v)} placeholder="0.00" />
            </Field>
            <Field label="Brokerage (₹)">
              <NumInput value={form.brokerage} onChange={v => set('brokerage', v)} placeholder="0.00" />
            </Field>
          </div>
          {(form.grossPnl || form.brokerage) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: '8px', padding: '10px 14px', border: '1px solid var(--border)', marginTop: '4px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Net P&L</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: netColor }}>
                {netPnl >= 0 ? '+' : ''}₹{netPnl.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Section: Psychology */}
        <div style={{ background: '#fdf8ff', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#7b1fa2', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>Psychology</div>

          <Field label="Followed Plan?" required>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={() => set('followedPlan', true)} style={{
                padding: '10px', borderRadius: '8px', border: '2px solid',
                borderColor: form.followedPlan === true ? 'var(--buy)' : 'var(--border)',
                background: form.followedPlan === true ? '#e8f5e9' : '#fff',
                color: form.followedPlan === true ? 'var(--buy)' : 'var(--text-muted)',
                fontWeight: 600, fontSize: '13px', cursor: 'pointer',
              }}>✅ Yes, followed</button>
              <button onClick={() => set('followedPlan', false)} style={{
                padding: '10px', borderRadius: '8px', border: '2px solid',
                borderColor: form.followedPlan === false ? 'var(--sell)' : 'var(--border)',
                background: form.followedPlan === false ? '#fff5f5' : '#fff',
                color: form.followedPlan === false ? 'var(--sell)' : 'var(--text-muted)',
                fontWeight: 600, fontSize: '13px', cursor: 'pointer',
              }}>❌ Impulsive</button>
            </div>
          </Field>

          <Field label="Emotion During Trade">
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {EMOTIONS.map(({ key, label, color }) => (
                <button key={key} onClick={() => set('emotion', key === form.emotion ? '' : key)} style={{
                  padding: '5px 12px', borderRadius: '20px', border: '2px solid',
                  borderColor: form.emotion === key ? color : 'var(--border)',
                  background: form.emotion === key ? color : '#fff',
                  color: form.emotion === key ? '#fff' : 'var(--text-muted)',
                  fontSize: '12px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  {label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Why did you take this trade?">
            <textarea
              value={form.entryReason}
              onChange={e => set('entryReason', e.target.value)}
              placeholder="Breakout, trend continuation, news catalyst..."
              rows={2}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
            />
          </Field>

          <Field label="Notes / Lessons">
            <textarea
              value={form.outcomeNotes}
              onChange={e => set('outcomeNotes', e.target.value)}
              placeholder="What could you do better next time?"
              rows={2}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
            />
          </Field>
        </div>

        {error && (
          <div style={{ background: '#fce4ec', border: '1px solid #ef9a9a', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', color: 'var(--sell)', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '13px', background: 'var(--primary)', color: '#fff',
            border: 'none', borderRadius: '10px', cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '15px', fontWeight: 700, opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Saving...' : '💾 Save Trade'}
          </button>
          <button onClick={onClose} style={{
            padding: '13px', background: '#fff', color: 'var(--text-muted)',
            border: '1px solid var(--border)', borderRadius: '10px',
            cursor: 'pointer', fontSize: '15px',
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
