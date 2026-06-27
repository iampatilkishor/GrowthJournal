'use client';

import { useState, useEffect, useCallback } from 'react';
import JournalModal from '@/components/JournalModal.jsx';
import Toast from '@/components/Toast.jsx';

const ORDER_TYPES = ['MARKET', 'LIMIT', 'SL', 'SL-M'];

const STATUS_COLOR = {
  complete:        { bg: '#e8f5e9', color: '#2e7d32' },
  executed:        { bg: '#e8f5e9', color: '#2e7d32' },
  filled:          { bg: '#e8f5e9', color: '#2e7d32' },
  open:            { bg: '#e3f2fd', color: '#1565c0' },
  pending:         { bg: '#fff8e1', color: '#f57f17' },
  trigger_pending: { bg: '#fff8e1', color: '#f57f17' },
  cancelled:       { bg: '#fce4ec', color: '#b71c1c' },
  rejected:        { bg: '#fce4ec', color: '#b71c1c' },
};

function statusStyle(s) {
  return STATUS_COLOR[(s || '').toLowerCase()] || { bg: '#f5f5f5', color: '#666' };
}

function fmtTime(unixSec) {
  if (!unixSec) return '—';
  return new Date(unixSec * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/* ── Modify Modal ─────────────────────────────────── */
function ModifyModal({ order, onClose, onSave }) {
  const [qty,   setQty]   = useState(String(order.quantity));
  const [type,  setType]  = useState(order.order_type);
  const [price, setPrice] = useState(String(order.price || ''));
  const [trig,  setTrig]  = useState(String(order.trigger_price || ''));
  const [saving, setSaving] = useState(false);

  const needsPrice   = type === 'LIMIT' || type === 'SL';
  const needsTrigger = type === 'SL'    || type === 'SL-M';

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(order.id, {
        quantity:     parseInt(qty, 10),
        orderType:    type,
        price:        price ? parseFloat(price) : 0,
        triggerPrice: trig  ? parseFloat(trig)  : 0,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900, padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '380px', overflow: 'hidden' }}>
        <div style={{ background: 'var(--primary)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#fff', fontWeight: 800 }}>Modify — {order.trading_symbol}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Quantity</label>
            <input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} className="form-input" />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Order Type</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {ORDER_TYPES.map(t => (
                <button key={t} onClick={() => setType(t)} style={{
                  flex: 1, padding: '7px 0', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                  border: `2px solid ${type === t ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '6px',
                  background: type === t ? 'var(--primary-light)' : '#fff',
                  color: type === t ? 'var(--primary)' : '#666',
                }}>{t}</button>
              ))}
            </div>
          </div>
          {needsPrice && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Price (₹)</label>
              <input type="number" step="0.05" value={price} onChange={e => setPrice(e.target.value)} className="form-input" />
            </div>
          )}
          {needsTrigger && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Trigger Price (₹)</label>
              <input type="number" step="0.05" value={trig} onChange={e => setTrig(e.target.value)} className="form-input" />
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={onClose} style={{ padding: '10px 16px', border: '1px solid var(--border)', borderRadius: '8px', background: '#fff', color: '#666', cursor: 'pointer', fontWeight: 600 }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Order Card ───────────────────────────────────── */
function OrderCard({ order, onCancel, onModify, onJournal }) {
  const ss     = statusStyle(order.status);
  const isBuy  = order.transaction_type === 'BUY';
  const canAct = ['open', 'pending', 'trigger_pending'].includes((order.status || '').toLowerCase());

  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', padding: '14px 16px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '14px' }}>{order.trading_symbol}</span>
            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: isBuy ? '#e8f5e9' : '#fce4ec', color: isBuy ? 'var(--buy)' : 'var(--sell)' }}>
              {isBuy ? '▲' : '▼'} {order.transaction_type}
            </span>
            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: ss.bg, color: ss.color, textTransform: 'uppercase' }}>
              {order.status}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {order.order_type} · {order.quantity} qty
            {order.price > 0        ? ` · ₹${order.price}` : ''}
            {order.trigger_price > 0 ? ` · trigger ₹${order.trigger_price}` : ''}
            {order.average_price > 0 ? ` · avg ₹${order.average_price}` : ''}
          </div>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
          {fmtTime(order.placed_at)}
          {order.pnl != null && (
            <div style={{ fontWeight: 700, marginTop: '2px', color: order.pnl >= 0 ? 'var(--buy)' : 'var(--sell)' }}>
              {order.pnl >= 0 ? '+' : ''}₹{Number(order.pnl).toLocaleString('en-IN')}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {canAct && (
          <>
            <button onClick={() => onModify(order)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--primary)', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              ✏️ Modify
            </button>
            <button onClick={() => onCancel(order)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--sell)', background: '#fce4ec', color: 'var(--sell)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              ✕ Cancel
            </button>
          </>
        )}
        {!order.journal_id
          ? <button onClick={() => onJournal(order)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #ccc', background: '#f8f9fa', color: '#555', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>📓 Journal</button>
          : <span style={{ fontSize: '11px', color: 'var(--buy)', padding: '5px 0' }}>✓ Journalled</span>
        }
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────── */
export default function OrderPage() {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [modifyTarget, setModifyTarget] = useState(null);
  const [journalModal, setJournalModal] = useState({ open: false, orderId: null, planId: null });
  const [toast, setToast]             = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res  = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function handleCancel(order) {
    if (!confirm(`Cancel order for ${order.trading_symbol}?`)) return;
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setToast({ message: 'Order cancelled', type: 'success' });
      await fetchOrders();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  }

  async function handleModifySave(id, updates) {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to modify'); }
    setToast({ message: 'Order modified', type: 'success' });
    await fetchOrders();
  }

  const openCount = orders.filter(o => ['open', 'pending', 'trigger_pending'].includes((o.status || '').toLowerCase())).length;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '2px' }}>📋 Today's Orders</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {openCount > 0 && (
            <span style={{ fontSize: '11px', background: '#fff3e0', color: '#e65100', padding: '4px 10px', borderRadius: '10px', fontWeight: 700 }}>
              {openCount} open
            </span>
          )}
          <button onClick={fetchOrders} style={{ fontSize: '13px', color: 'var(--primary)', background: 'none', border: '1px solid var(--primary)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading…</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📭</div>
          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>No orders today</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Orders placed today will appear here</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {orders.map(o => (
            <OrderCard key={o.id} order={o}
              onCancel={handleCancel}
              onModify={setModifyTarget}
              onJournal={o => setJournalModal({ open: true, orderId: o.id, planId: o.plan_id || null })}
            />
          ))}
        </div>
      )}

      {modifyTarget && (
        <ModifyModal order={modifyTarget} onClose={() => setModifyTarget(null)} onSave={handleModifySave} />
      )}

      {journalModal.open && (
        <JournalModal
          isOpen={journalModal.open}
          orderId={journalModal.orderId}
          planId={journalModal.planId}
          onClose={() => setJournalModal({ open: false, orderId: null, planId: null })}
          onSaved={() => { setJournalModal({ open: false, orderId: null, planId: null }); fetchOrders(); }}
        />
      )}
    </div>
  );
}
