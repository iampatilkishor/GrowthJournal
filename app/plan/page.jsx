'use client';

import { useState, useEffect, useCallback } from 'react';
import Toast from '@/components/Toast.jsx';
import { authFetch } from '@/lib/authFetch.js';

function todayIST() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

const CONDITION_TYPES = ['range', 'above', 'below'];
const ACTIONS = ['buy', 'sell', 'buy_ce', 'buy_pe', 'sell_ce', 'sell_pe', 'buy_fut', 'sell_fut'];
const ACTION_LABELS = { buy: 'BUY', sell: 'SELL', buy_ce: 'BUY CE', buy_pe: 'BUY PE', sell_ce: 'SELL CE', sell_pe: 'SELL PE', buy_fut: 'BUY FUT', sell_fut: 'SELL FUT' };

function blankScenario() {
  return { conditionType: 'range', conditionValueLow: '', conditionValueHigh: '', action: 'buy', instrument: '', maxQuantity: 25, entryReason: '', entryPrice: '', targetPrice: '', stopLoss: '', exitReason: '', product: 'I' };
}

function DeleteModal({ plan, onConfirm, onCancel }) {
  const hasWatchlist = plan.watchlist_count > 0;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900, padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <div style={{ background: 'var(--sell)', padding: '14px 18px' }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: '15px' }}>Delete Plan</div>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '10px' }}>Delete <strong>{plan.title}</strong>?</p>
          {hasWatchlist ? (
            <div style={{ background: '#fff3e0', border: '1px solid #ffcc02', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ fontWeight: 700, color: '#e65100', marginBottom: '6px' }}>⚠️ {plan.watchlist_count} watchlist instrument{plan.watchlist_count > 1 ? 's are' : ' is'} using this plan</div>
              <div style={{ color: '#7c4700', fontSize: '12px' }}>{plan.watchlist_symbols}</div>
              <div style={{ color: '#7c4700', fontSize: '12px', marginTop: '6px' }}>These instruments will remain in your watchlist but will be unlinked from this plan.</div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>This will permanently delete the plan and all its scenarios.</p>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onConfirm} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: 'var(--sell)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
              {hasWatchlist ? 'Unlink & Delete' : 'Delete'}
            </button>
            <button onClick={onCancel} style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: '#fff', color: '#666', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, onEdit, onDelete }) {
  return (
    <div style={{ background: '#fff', borderRadius: '10px', border: `1px solid ${plan.is_active ? 'var(--primary)' : 'var(--border)'}`, borderLeft: `3px solid ${plan.is_active ? 'var(--primary)' : 'var(--border)'}`, padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>{plan.title}</span>
            {plan.is_active === 1 && <span style={{ fontSize: '10px', fontWeight: 700, background: 'var(--primary-light)', color: 'var(--primary)', padding: '1px 8px', borderRadius: '10px' }}>ACTIVE</span>}
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{plan.bias}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span>{plan.date}</span>
            <span>{plan.scenario_count} scenario{plan.scenario_count !== 1 ? 's' : ''}</span>
            {plan.watchlist_count > 0 && <span style={{ color: '#e65100' }}>📋 {plan.watchlist_count} instrument{plan.watchlist_count > 1 ? 's' : ''}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '10px' }}>
          <button onClick={() => onEdit(plan)} style={{ padding: '5px 10px', border: '1px solid var(--primary)', borderRadius: '6px', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>✏️ Edit</button>
          <button onClick={() => onDelete(plan)} style={{ padding: '5px 10px', border: '1px solid #fca5a5', borderRadius: '6px', background: '#fef2f2', color: 'var(--sell)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>🗑</button>
        </div>
      </div>
    </div>
  );
}

export default function PlanPage() {
  const today = todayIST();
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle]         = useState('');
  const [date, setDate]           = useState(today);
  const [bias, setBias]           = useState('neutral');
  const [niftyLow, setNiftyLow]   = useState('');
  const [niftyHigh, setNiftyHigh] = useState('');
  const [maxTrades, setMaxTrades] = useState(5);
  const [maxLoss, setMaxLoss]     = useState(5000);
  const [notes, setNotes]         = useState('');
  const [maxQtyPerScript, setMaxQtyPerScript] = useState(50);
  const [noTradeBefore, setNoTradeBefore]     = useState(15);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [scenarios, setScenarios] = useState([blankScenario()]);
  const [showForm, setShowForm]   = useState(false);
  const [plans, setPlans]         = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast]         = useState(null);

  const fetchPlans = useCallback(async () => {
    try {
      const res  = await authFetch('/api/plans');
      const data = await res.json();
      setPlans(data.plans || []);
    } catch {}
    finally { setLoadingPlans(false); }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  function resetForm() {
    setEditingId(null);
    setTitle(''); setDate(today); setBias('neutral');
    setNiftyLow(''); setNiftyHigh('');
    setMaxTrades(5); setMaxLoss(5000); setNotes('');
    setMaxQtyPerScript(50); setNoTradeBefore(15); setAllowDuplicates(false);
    setScenarios([blankScenario()]);
  }

  async function handleEdit(plan) {
    try {
      const res  = await authFetch(`/api/plans/${plan.id}`);
      const data = await res.json();
      const p = data.plan; const r = data.riskRules; const s = data.scenarios || [];
      setEditingId(p.id); setTitle(p.title); setDate(p.date); setBias(p.bias || 'neutral');
      setNiftyLow(p.nifty_range_low ?? ''); setNiftyHigh(p.nifty_range_high ?? '');
      setMaxTrades(p.max_trades_per_day); setMaxLoss(p.max_loss_per_day); setNotes(p.notes || '');
      setMaxQtyPerScript(r?.max_quantity_per_script ?? 50);
      setNoTradeBefore(r?.no_trade_before_minutes ?? 15);
      setAllowDuplicates(r?.allow_duplicate_scripts === 1);
      setScenarios(s.length ? s.map(sc => ({
        conditionType: sc.condition_type, conditionValueLow: sc.condition_value_low ?? '',
        conditionValueHigh: sc.condition_value_high ?? '', action: sc.action,
        instrument: sc.instrument, maxQuantity: sc.max_quantity,
        entryReason: sc.entry_reason || '', entryPrice: sc.entry_price ?? '',
        targetPrice: sc.target_price ?? '', stopLoss: sc.stop_loss ?? '',
        exitReason: sc.exit_reason || '', product: sc.product || 'I',
      })) : [blankScenario()]);
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch { setToast({ message: 'Failed to load plan', type: 'error' }); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const res = await authFetch(`/api/plans/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const d = await res.json();
      setToast({ message: d.watchlistUnlinked > 0 ? `Plan deleted. ${d.watchlistUnlinked} instrument(s) unlinked.` : 'Plan deleted.', type: 'success' });
      setDeleteTarget(null);
      if (editingId === deleteTarget.id) { resetForm(); setShowForm(false); }
      await fetchPlans();
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
  }

  async function handleSave() {
    if (!title.trim()) { setToast({ message: 'Plan title is required', type: 'error' }); return; }
    setSaving(true);
    try {
      const body = {
        title, date, bias,
        niftyRangeLow: niftyLow ? parseFloat(niftyLow) : null,
        niftyRangeHigh: niftyHigh ? parseFloat(niftyHigh) : null,
        maxTradesPerDay: parseInt(maxTrades, 10), maxLossPerDay: parseFloat(maxLoss), notes,
        scenarios: scenarios.map(s => ({
          ...s,
          conditionValueLow:  s.conditionValueLow  ? parseFloat(s.conditionValueLow)  : null,
          conditionValueHigh: s.conditionValueHigh ? parseFloat(s.conditionValueHigh) : null,
          maxQuantity: parseInt(s.maxQuantity, 10),
          entryPrice:  s.entryPrice  ? parseFloat(s.entryPrice)  : null,
          targetPrice: s.targetPrice ? parseFloat(s.targetPrice) : null,
          stopLoss:    s.stopLoss    ? parseFloat(s.stopLoss)    : null,
        })),
        riskRules: { maxQuantityPerScript: parseInt(maxQtyPerScript, 10), noTradeBeforeMinutes: parseInt(noTradeBefore, 10), allowDuplicateScripts: allowDuplicates },
      };
      const url = editingId ? `/api/plans/${editingId}` : '/api/plans';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setToast({ message: editingId ? 'Plan updated!' : 'Plan created!', type: 'success' });
      resetForm(); setShowForm(false);
      await fetchPlans();
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
    finally { setSaving(false); }
  }

  function addScenario() { setScenarios(prev => [...prev, blankScenario()]); }
  function removeScenario(idx) { setScenarios(prev => prev.filter((_, i) => i !== idx)); }
  function updateScenario(idx, field, value) { setScenarios(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s)); }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {deleteTarget && <DeleteModal plan={deleteTarget} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '2px' }}>📋 Plans</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>IF/THEN scenario planner for your trades</p>
        </div>
        {!showForm && (
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary" style={{ fontSize: '13px' }}>+ New Plan</button>
        )}
      </div>

      {!showForm && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {loadingPlans ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading…</div>
          ) : plans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
              <div style={{ fontWeight: 700, marginBottom: '6px' }}>No plans yet</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>Create your first trading plan to get started</div>
              <button onClick={() => setShowForm(true)} className="btn btn-primary">+ New Plan</button>
            </div>
          ) : plans.map(p => (
            <PlanCard key={p.id} plan={p} onEdit={handleEdit} onDelete={() => setDeleteTarget(p)} />
          ))}
        </div>
      )}

      {showForm && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>{editingId ? 'Edit Plan' : 'New Plan'}</h2>
            <button onClick={() => { resetForm(); setShowForm(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div>
              <div className="card" style={{ marginBottom: '16px' }}>
                <div className="card-title">Plan Details</div>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. SPY Breakout Strategy" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bias</label>
                    <select className="form-input" value={bias} onChange={e => setBias(e.target.value)}>
                      <option value="bullish">Bullish</option>
                      <option value="neutral">Neutral</option>
                      <option value="bearish">Bearish</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Market Range Low</label>
                    <input className="form-input" type="number" value={niftyLow} onChange={e => setNiftyLow(e.target.value)} placeholder="e.g. 200.00" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Market Range High</label>
                    <input className="form-input" type="number" value={niftyHigh} onChange={e => setNiftyHigh(e.target.value)} placeholder="e.g. 210.00" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Max Trades/Day</label>
                    <input className="form-input" type="number" min={1} value={maxTrades} onChange={e => setMaxTrades(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Loss (₹)</label>
                    <input className="form-input" type="number" min={0} value={maxLoss} onChange={e => setMaxLoss(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Market outlook, key levels…" style={{ resize: 'vertical' }} />
                </div>
              </div>

              <div className="card">
                <div className="card-title">Risk Rules</div>
                <div className="form-group">
                  <label className="form-label">Max Qty per Script</label>
                  <input className="form-input" type="number" min={1} value={maxQtyPerScript} onChange={e => setMaxQtyPerScript(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">No-Trade Window (min after 9:15)</label>
                  <input className="form-input" type="number" min={0} value={noTradeBefore} onChange={e => setNoTradeBefore(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Allow Duplicate Scripts
                    <label className="toggle-switch">
                      <input type="checkbox" checked={allowDuplicates} onChange={e => setAllowDuplicates(e.target.checked)} />
                      <span className="toggle-slider" />
                    </label>
                  </label>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Scenarios (IF / THEN)</div>
              {scenarios.map((s, idx) => (
                <div className="scenario-card" key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Scenario {idx + 1}</strong>
                    {scenarios.length > 1 && <button onClick={() => removeScenario(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sell)', fontSize: '16px' }}>✕</button>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Condition</label>
                    <div className="pill-group" style={{ marginBottom: '8px' }}>
                      {CONDITION_TYPES.map(t => (
                        <button key={t} className={`pill${s.conditionType === t ? ' active' : ''}`} onClick={() => updateScenario(idx, 'conditionType', t)} style={{ padding: '4px 12px', fontSize: '13px' }}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: s.conditionType === 'range' ? '1fr 1fr' : '1fr', gap: '8px' }}>
                      <input className="form-input" type="number"
                        placeholder={s.conditionType === 'range' ? 'Low' : s.conditionType === 'above' ? 'Above' : 'Below'}
                        value={s.conditionValueLow} onChange={e => updateScenario(idx, 'conditionValueLow', e.target.value)} />
                      {s.conditionType === 'range' && (
                        <input className="form-input" type="number" placeholder="High" value={s.conditionValueHigh} onChange={e => updateScenario(idx, 'conditionValueHigh', e.target.value)} />
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Action</label>
                    <div className="pill-group">
                      {ACTIONS.map(a => (
                        <button key={a} className={`pill${s.action === a ? ' active' : ''}`} onClick={() => updateScenario(idx, 'action', a)}
                          style={{ padding: '4px 10px', fontSize: '12px', ...(s.action === a ? { background: a.startsWith('buy') ? 'var(--buy)' : 'var(--sell)', borderColor: a.startsWith('buy') ? 'var(--buy)' : 'var(--sell)', color: '#fff' } : {}) }}>
                          {ACTION_LABELS[a]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: '8px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Instrument</label>
                      <input className="form-input" value={s.instrument} onChange={e => updateScenario(idx, 'instrument', e.target.value.toUpperCase())} placeholder="AAPL / BTCUSD / CE" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Max Qty</label>
                      <input className="form-input" type="number" min={1} value={s.maxQuantity} onChange={e => updateScenario(idx, 'maxQuantity', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Product</label>
                      <select className="form-input" value={s.product} onChange={e => updateScenario(idx, 'product', e.target.value)}>
                        <option value="I">Intraday</option>
                        <option value="D">Delivery</option>
                        <option value="CO">CO</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: '10px', marginBottom: 0 }}>
                    <label className="form-label">Entry Reason</label>
                    <input className="form-input" value={s.entryReason} onChange={e => updateScenario(idx, 'entryReason', e.target.value)} placeholder="Breakout above resistance, VWAP bounce…" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Entry Price (₹)</label>
                      <input className="form-input" type="number" step="0.5" value={s.entryPrice ?? ''} onChange={e => updateScenario(idx, 'entryPrice', e.target.value)} placeholder="200" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: 'var(--buy)' }}>Target (₹)</label>
                      <input className="form-input" type="number" step="0.5" value={s.targetPrice} onChange={e => updateScenario(idx, 'targetPrice', e.target.value)} placeholder="250" style={{ borderColor: s.targetPrice ? 'var(--buy)' : undefined }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: 'var(--sell)' }}>Stop Loss (₹)</label>
                      <input className="form-input" type="number" step="0.5" value={s.stopLoss} onChange={e => updateScenario(idx, 'stopLoss', e.target.value)} placeholder="180" style={{ borderColor: s.stopLoss ? 'var(--sell)' : undefined }} />
                    </div>
                  </div>
                  {s.entryPrice && s.targetPrice && s.stopLoss && (() => {
                    const entry  = parseFloat(s.entryPrice);
                    const target = parseFloat(s.targetPrice);
                    const sl     = parseFloat(s.stopLoss);
                    const reward = Math.abs(target - entry);
                    const risk   = Math.abs(entry - sl);
                    if (!risk) return null;
                    const rr = (reward / risk).toFixed(2);
                    return isNaN(rr) ? null : (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                        R:R = <strong style={{ color: parseFloat(rr) >= 1.5 ? 'var(--buy)' : 'var(--sell)' }}>{rr}:1</strong>
                        <span style={{ marginLeft: 8 }}>Risk ₹{risk.toFixed(1)} · Reward ₹{reward.toFixed(1)}</span>
                      </div>
                    );
                  })()}
                  <div className="form-group" style={{ marginBottom: 0, marginTop: '8px' }}>
                    <label className="form-label">Exit / Invalidation</label>
                    <input className="form-input" value={s.exitReason} onChange={e => updateScenario(idx, 'exitReason', e.target.value)} placeholder="Close below support, time-based exit at 2:30pm…" />
                  </div>
                </div>
              ))}
              <button onClick={addScenario} style={{ width: '100%', padding: '10px', border: '2px dashed var(--border)', borderRadius: '8px', background: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '14px' }}>+ Add Scenario</button>
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editingId ? '💾 Update Plan' : '💾 Save Plan'}
            </button>
            <button onClick={() => { resetForm(); setShowForm(false); }} style={{ padding: '10px 20px', border: '1px solid var(--border)', borderRadius: '8px', background: '#fff', color: '#666', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
