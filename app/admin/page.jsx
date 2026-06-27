'use client';

import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/authFetch.js';
import { useAuth } from '@/components/AuthGate.jsx';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/* ── helpers ── */
function fmt(n) { return (n ?? 0).toLocaleString(); }
function ago(ts) {
  if (!ts) return '—';
  const d = Math.floor((Date.now() - new Date(ts)) / 864e5);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}
function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const TIER_COLORS = {
  free:     { bg: '#f3f4f6', color: '#374151' },
  pro:      { bg: '#eff6ff', color: '#1d4ed8' },
  founding: { bg: '#f0fdf4', color: '#065f46' },
};
const ROLE_COLORS = {
  user:   { bg: '#f3f4f6', color: '#374151' },
  mentor: { bg: '#fef3c7', color: '#92400e' },
  admin:  { bg: '#fdf2f8', color: '#9d174d' },
};

function Badge({ label, map }) {
  const s = map[label] || map.user || { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'capitalize' }}>
      {label}
    </span>
  );
}

function Stat({ label, value, sub, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: color || '#111', lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/* ── Approve Payment Modal ───────────────────────────────────────────────── */
function ApproveModal({ req, userEmail, adminEmail, onConfirm, onClose }) {
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const TIER_LABEL = { founding: '🌟 Founding Member', quarterly: '📅 Pro — Quarterly', yearly: '🏆 Pro — Yearly', pro: '🏆 Pro' };

  async function handleApprove() {
    if (!password.trim()) { setError('Enter your admin password to confirm.'); return; }
    setLoading(true); setError('');
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email: adminEmail, password });
      if (authErr) { setError('Incorrect password. Not approved.'); return; }
      await onConfirm(req.id, 'approve');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    ['User',        userEmail || req.user_id],
    ['Plan',        TIER_LABEL[req.plan] || req.plan],
    ['Method',      req.payment_method],
    ['UTR / Ref',   req.transaction_ref],
    ['Amount',      req.amount ? `₹${req.amount}` : 'Not specified'],
    ['Submitted',   new Date(req.created_at).toLocaleString()],
    req.notes && ['Notes', req.notes],
  ].filter(Boolean);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: '28px', width: '100%', maxWidth: 460, boxShadow: '0 24px 80px rgba(0,0,0,0.25)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 14, color: '#6b7280' }}>✕</button>

        <div style={{ fontSize: 17, fontWeight: 900, color: '#065f46', marginBottom: 4 }}>✓ Approve Payment</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 22 }}>Review all details before upgrading the user's account.</div>

        {/* Details */}
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
          {fields.map(([k, v], i) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '11px 16px', borderBottom: i < fields.length - 1 ? '1px solid #f3f4f6' : 'none', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, flexShrink: 0, paddingTop: 1 }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0d0d1a', textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* What will happen */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>What happens on approval</div>
          <div style={{ fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
            User's account will be upgraded to <strong>{TIER_LABEL[req.plan] || req.plan}</strong> immediately. This cannot be undone without manually editing the user.
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 7 }}>🔐 Your Admin Password</label>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Enter password to confirm approval"
            onKeyDown={e => e.key === 'Enter' && handleApprove()}
            autoFocus
            style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: `1.5px solid ${error ? '#fca5a5' : '#e5e7eb'}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
          {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6, fontWeight: 600 }}>{error}</div>}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleApprove} disabled={loading}
            style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: loading ? '#9ca3af' : '#059669', color: '#fff', fontSize: 13, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Verifying…' : '✓ Approve & Upgrade'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Reject Payment Modal ────────────────────────────────────────────────── */
function RejectModal({ req, userEmail, adminEmail, onConfirm, onClose }) {
  const [reason,   setReason]   = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const TIER_LABEL = { founding: '🌟 Founding Member', quarterly: '📅 Pro — Quarterly', yearly: '🏆 Pro — Yearly', pro: '🏆 Pro' };

  const QUICK_REASONS = [
    'Transaction not found in our records',
    'Incorrect UTR / reference number',
    'Payment amount does not match plan price',
    'Duplicate request — already processed',
  ];

  async function handleReject() {
    if (!reason.trim()) { setError('Please provide a rejection reason.'); return; }
    if (!password.trim()) { setError('Enter your admin password to confirm.'); return; }
    setLoading(true); setError('');
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email: adminEmail, password });
      if (authErr) { setError('Incorrect password. Not rejected.'); return; }
      await onConfirm(req.id, 'reject', reason.trim());
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    ['User',      userEmail || req.user_id],
    ['Plan',      TIER_LABEL[req.plan] || req.plan],
    ['Method',    req.payment_method],
    ['UTR / Ref', req.transaction_ref],
    ['Amount',    req.amount ? `₹${req.amount}` : 'Not specified'],
    ['Submitted', new Date(req.created_at).toLocaleString()],
    req.notes && ['Notes', req.notes],
  ].filter(Boolean);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: '28px', width: '100%', maxWidth: 460, boxShadow: '0 24px 80px rgba(0,0,0,0.25)', position: 'relative', maxHeight: '92vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 14, color: '#6b7280' }}>✕</button>

        <div style={{ fontSize: 17, fontWeight: 900, color: '#dc2626', marginBottom: 4 }}>✗ Reject Payment</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>Review details and provide a reason. The user will see this message.</div>

        {/* Details */}
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
          {fields.map(([k, v], i) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '11px 16px', borderBottom: i < fields.length - 1 ? '1px solid #f3f4f6' : 'none', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, flexShrink: 0, paddingTop: 1 }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0d0d1a', textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Quick reasons */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Quick reasons</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {QUICK_REASONS.map(r => (
              <button key={r} onClick={() => setReason(r)}
                style={{ textAlign: 'left', padding: '9px 14px', borderRadius: 9, border: `1.5px solid ${reason === r ? '#fca5a5' : '#e5e7eb'}`, background: reason === r ? '#fef2f2' : '#fff', color: reason === r ? '#dc2626' : '#374151', fontSize: 12, fontWeight: reason === r ? 700 : 500, cursor: 'pointer', transition: 'all 0.12s' }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Custom reason */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
            Reason <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={e => { setReason(e.target.value); setError(''); }}
            placeholder="Or write a custom reason…"
            rows={3}
            style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: `1.5px solid ${error && !reason.trim() ? '#fca5a5' : '#e5e7eb'}`, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>This message is shown to the user on their upgrade page.</div>
        </div>

        {/* Password */}
        <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 7 }}>🔐 Admin Password</label>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Enter password to confirm rejection"
            onKeyDown={e => e.key === 'Enter' && handleReject()}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${error && !password.trim() ? '#fca5a5' : '#e5e7eb'}`, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
          {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6, fontWeight: 600 }}>{error}</div>}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleReject} disabled={loading}
            style={{ flex: 2, padding: 11, borderRadius: 10, border: 'none', background: loading ? '#9ca3af' : '#dc2626', color: '#fff', fontSize: 13, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Verifying…' : '✗ Reject Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Edit Payment Modal ──────────────────────────────────────────────────── */
function EditPaymentModal({ req, userRecord, adminEmail, onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10);

  const [plan,      setPlan]      = useState(req.plan      || 'founding');
  const [status,    setStatus]    = useState(req.status    || 'pending');
  const [amount,    setAmount]    = useState(req.amount    || '');
  const [startDate, setStartDate] = useState(req.start_date ? req.start_date.slice(0, 10) : today);
  const [endDate,   setEndDate]   = useState(req.end_date  ? req.end_date.slice(0, 10)  : '');
  const [password,  setPassword]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const PLAN_OPTIONS = [
    { value: 'founding',  label: '🌟 Founding Member' },
    { value: 'yearly',    label: '🏆 Pro — Yearly' },
    { value: 'quarterly', label: '📅 Pro — Quarterly' },
  ];
  const STATUS_OPTIONS = [
    { value: 'pending',  label: '⏳ Pending' },
    { value: 'approved', label: '✅ Approved' },
    { value: 'rejected', label: '❌ Rejected' },
  ];

  // Auto-fill end date based on plan when start date changes
  function autoEndDate(s, p) {
    if (!s) return;
    const d = new Date(s);
    if (p === 'quarterly') d.setMonth(d.getMonth() + 3);
    else d.setFullYear(d.getFullYear() + 1); // founding + yearly
    setEndDate(d.toISOString().slice(0, 10));
  }

  async function handleSave() {
    if (!password.trim()) { setError('Enter your admin password to confirm.'); return; }
    setLoading(true); setError('');
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email: adminEmail, password });
      if (authErr) { setError('Incorrect password. Changes not saved.'); return; }
      await onSave(req.id, { action: 'edit', plan, status, amount: amount || null, startDate: startDate || null, endDate: endDate || null });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, fontWeight: 700, outline: 'none', cursor: 'pointer', background: '#fff', boxSizing: 'border-box' };
  const inputStyle  = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' };
  const labelStyle  = { fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: '28px', width: '100%', maxWidth: 500, boxShadow: '0 24px 80px rgba(0,0,0,0.25)', position: 'relative', maxHeight: '92vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 14, color: '#6b7280' }}>✕</button>

        <div style={{ fontSize: 17, fontWeight: 900, color: '#0d0d1a', marginBottom: 4 }}>Edit Payment Record</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>{userRecord?.email || req.user_id}</div>

        {/* Current user plan pill */}
        {userRecord && (
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Current Account Status</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ ...TIER_COLORS[userRecord.tier], padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, textTransform: 'capitalize', background: TIER_COLORS[userRecord.tier]?.bg, color: TIER_COLORS[userRecord.tier]?.color }}>
                {userRecord.tier || 'free'} tier
              </span>
              <span style={{ ...ROLE_COLORS[userRecord.role], padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, textTransform: 'capitalize', background: ROLE_COLORS[userRecord.role]?.bg, color: ROLE_COLORS[userRecord.role]?.color }}>
                {userRecord.role || 'user'} role
              </span>
              {userRecord.tier === 'free' && (
                <span style={{ fontSize: 12, color: userRecord.trialExpired ? '#dc2626' : '#059669', fontWeight: 700 }}>
                  {userRecord.trialExpired ? '· Trial expired' : `· ${userRecord.trialDaysLeft}d trial left`}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Readonly info */}
        <div style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            ['Method', req.payment_method],
            ['UTR / Ref', req.transaction_ref],
            ['Submitted', new Date(req.created_at).toLocaleDateString()],
            req.notes && ['Notes', req.notes],
          ].filter(Boolean).map(([k, v]) => (
            <div key={k} style={{ gridColumn: k === 'Notes' ? '1 / -1' : 'auto' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0d0d1a', wordBreak: 'break-all' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Editable fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Plan</label>
            <select value={plan} onChange={e => { setPlan(e.target.value); autoEndDate(startDate, e.target.value); }} style={selectStyle}>
              {PLAN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Amount (₹)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 999" style={inputStyle} />
          </div>
          <div /> {/* spacer */}
          <div>
            <label style={labelStyle}>Start Date</label>
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); autoEndDate(e.target.value, plan); }} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Auto-fill hint */}
        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 20 }}>
          💡 End date auto-fills based on plan (quarterly = 3 months, others = 1 year from start).
          {status === 'approved' && <span style={{ color: '#059669', fontWeight: 700 }}> Saving as Approved will upgrade the user's tier.</span>}
        </div>

        {/* Password */}
        <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
          <label style={labelStyle}>🔐 Admin Password to Confirm</label>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Enter your password before saving"
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            style={{ ...inputStyle, border: `1.5px solid ${error ? '#fca5a5' : '#e5e7eb'}` }}
          />
          {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6, fontWeight: 600 }}>{error}</div>}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading}
            style={{ flex: 2, padding: 11, borderRadius: 10, border: 'none', background: loading ? '#9ca3af' : '#0d0d1a', color: '#fff', fontSize: 13, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Edit User Modal ─────────────────────────────────────────────────────── */
function EditUserModal({ user: u, adminEmail, onSave, onClose }) {
  const [tier,     setTier]     = useState(u.tier  || 'free');
  const [role,     setRole]     = useState(u.role  || 'user');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSave() {
    if (!password.trim()) { setError('Enter your admin password to confirm.'); return; }
    setLoading(true); setError('');
    try {
      // Verify admin password via Supabase re-auth
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password,
      });
      if (authErr) { setError('Incorrect password. Changes not saved.'); return; }
      await onSave(u.id, { tier, role });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: '28px 28px 24px', width: '100%', maxWidth: 420, boxShadow: '0 24px 80px rgba(0,0,0,0.2)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 14, color: '#6b7280' }}>✕</button>

        <div style={{ fontSize: 17, fontWeight: 900, color: '#0d0d1a', marginBottom: 4 }}>Edit User</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 22, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Tier</label>
            <select value={tier} onChange={e => setTier(e.target.value)}
              style={{ width: '100%', padding: '9px 10px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, fontWeight: 700, outline: 'none', cursor: 'pointer', background: '#fff' }}>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="founding">Founding</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              style={{ width: '100%', padding: '9px 10px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13, fontWeight: 700, outline: 'none', cursor: 'pointer', background: '#fff' }}>
              <option value="user">User</option>
              <option value="mentor">Mentor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>🔐 Your Admin Password</label>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Enter your password to confirm changes"
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${error ? '#fca5a5' : '#e5e7eb'}`, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
          />
          {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 7, fontWeight: 600 }}>{error}</div>}
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>Required to prevent accidental changes</div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading}
            style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: loading ? '#9ca3af' : '#0d0d1a', color: '#fff', fontSize: 13, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Verifying…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function AdminPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [tab,    setTab]    = useState('overview');
  const [stats,  setStats]  = useState(null);
  const [users,  setUsers]  = useState([]);
  const [reqs,   setReqs]   = useState([]);
  const [loading,     setLoading]     = useState(true);   // only true on first load
  const [annHistory,  setAnnHistory]  = useState([]);
  const [search,  setSearch]  = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [annMsg,  setAnnMsg]  = useState('');
  const [annType, setAnnType] = useState('info');
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState('');
  const [editUser,    setEditUser]    = useState(null);
  const [approveReq,  setApproveReq]  = useState(null);
  const [rejectReq,   setRejectReq]   = useState(null);
  const [editReq,     setEditReq]     = useState(null);

  // Payment settings state
  const [pay,        setPay]        = useState({ upi: '', bank: { accountName: '', bank: '', accountNo: '', ifsc: '' } });
  const [payLoading, setPayLoading] = useState(false);
  const [paySaved,   setPaySaved]   = useState(false);
  const [payPwd,     setPayPwd]     = useState('');
  const [payError,   setPayError]   = useState('');

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  const load = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [sr, ur] = await Promise.all([
        authFetch('/api/admin/stats'),
        authFetch('/api/admin/users'),
      ]);
      const [s, u] = await Promise.all([sr.json(), ur.json()]);
      if (s.error === 'Forbidden') { router.replace('/dashboard'); return; }
      setStats(s);
      setUsers(u.users || []);
    } catch {}
    finally { if (isInitial) setLoading(false); }
  }, [router]);

  const loadAnnouncements = useCallback(async () => {
    try {
      const res  = await authFetch('/api/admin/announcements?all=1');
      const json = await res.json();
      setAnnHistory(json.announcements || []);
    } catch {}
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      const res  = await authFetch('/api/admin/payment-requests');
      const json = await res.json();
      setReqs(json.requests || []);
    } catch {}
  }, []);

  const loadPaymentSettings = useCallback(async () => {
    try {
      const res  = await fetch('/api/payment-settings');
      const json = await res.json();
      if (json.payment) setPay(json.payment);
    } catch {}
  }, []);

  useEffect(() => { load(true); }, [load]);
  useEffect(() => { if (tab === 'payments')    loadRequests(); },      [tab, loadRequests]);
  useEffect(() => { if (tab === 'announce')    loadAnnouncements(); }, [tab, loadAnnouncements]);
  useEffect(() => { if (tab === 'paysettings') loadPaymentSettings(); }, [tab, loadPaymentSettings]);

  async function updateUser(userId, update) {
    await authFetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: userId, ...update }),
    });
    showToast('User updated ✓');
    load(); // silent — no loading flash
  }

  async function reviewPayment(id, action, reason) {
    await authFetch(`/api/payment-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, rejectionReason: reason }),
    });
    showToast(action === 'approve' ? 'Payment approved — user upgraded ✓' : 'Payment rejected');
    loadRequests(); load();
  }

  async function editPayment(id, updates) {
    const res  = await authFetch(`/api/payment-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    showToast('Payment record updated ✓');
    loadRequests(); load();
  }

  async function postAnnouncement() {
    if (!annMsg.trim()) return;
    setSaving(true);
    await authFetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: annMsg.trim(), type: annType, deactivateOthers: true }),
    });
    setAnnMsg('');
    setSaving(false);
    showToast('Announcement sent ✓');
    loadAnnouncements(); // silent — no loading flash
  }

  async function toggleAnnouncement(id, active) {
    await authFetch('/api/admin/announcements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active }),
    });
    showToast(active ? 'Announcement activated ✓' : 'Announcement deactivated ✓');
    loadAnnouncements();
  }

  async function deleteAnnouncement(id) {
    if (!window.confirm('Permanently delete this announcement? This cannot be undone.')) return;
    await authFetch('/api/admin/announcements', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    showToast('Announcement deleted ✓');
    loadAnnouncements(); // silent refresh
  }

  async function savePaymentSettings() {
    if (!payPwd.trim()) { setPayError('Enter your admin password to save.'); return; }
    setPayLoading(true); setPayError('');
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: user?.email,
        password: payPwd,
      });
      if (authErr) { setPayError('Incorrect password. Changes not saved.'); return; }

      const res  = await authFetch('/api/payment-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upi: pay.upi, bank: pay.bank }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setPayPwd('');
      setPaySaved(true);
      setTimeout(() => setPaySaved(false), 3000);
      showToast('Payment details saved ✓');
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPayLoading(false);
    }
  }

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.email?.toLowerCase().includes(q);
    const matchTier   = filterTier === 'all' || u.tier === filterTier;
    return matchSearch && matchTier;
  });

  const pendingReqs = reqs.filter(r => r.status === 'pending');

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#9ca3af', fontSize: 14 }}>Loading admin panel…</div>
    </div>
  );

  const inputStyle = {
    width: '100%', padding: '11px 13px', borderRadius: 10, border: '1.5px solid #e5e7eb',
    fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: 'system-ui, sans-serif' }}>
      {/* Edit user modal */}
      {editUser && (
        <EditUserModal
          user={editUser}
          adminEmail={user?.email}
          onSave={updateUser}
          onClose={() => setEditUser(null)}
        />
      )}

      {/* Reject payment modal */}
      {rejectReq && (
        <RejectModal
          req={rejectReq}
          userEmail={users.find(u => u.id === rejectReq.user_id)?.email}
          adminEmail={user?.email}
          onConfirm={reviewPayment}
          onClose={() => setRejectReq(null)}
        />
      )}

      {/* Approve payment modal */}
      {approveReq && (
        <ApproveModal
          req={approveReq}
          userEmail={users.find(u => u.id === approveReq.user_id)?.email}
          adminEmail={user?.email}
          onConfirm={reviewPayment}
          onClose={() => setApproveReq(null)}
        />
      )}

      {/* Edit payment modal */}
      {editReq && (
        <EditPaymentModal
          req={editReq}
          userRecord={users.find(u => u.id === editReq.user_id)}
          adminEmail={user?.email}
          onSave={editPayment}
          onClose={() => setEditReq(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#0d0d1a', color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700, zIndex: 9998, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      {/* Nav */}
      <div className="adm-nav">
        <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', paddingRight: 24, borderRight: '1px solid rgba(255,255,255,0.1)', marginRight: 8 }}>
          ⚡ Admin
        </div>
        {[
          ['overview',     '📊 Overview'],
          ['users',        '👥 Users'],
          ['payments',     `💳 Payments${stats?.pendingPayments ? ` (${stats.pendingPayments})` : ''}`],
          ['announce',     '📢 Announce'],
          ['paysettings',  '⚙️ Pay Settings'],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '16px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
            background: 'transparent', color: tab === k ? '#fff' : 'rgba(255,255,255,0.45)',
            borderBottom: tab === k ? '2px solid #00d97e' : '2px solid transparent',
            transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}>{l}</button>
        ))}
        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <a href="/dashboard" style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontWeight: 600, padding: '0 4px' }}>← App</a>
        </div>
      </div>

      <style>{`
        .adm-wrap { padding: 28px; max-width: 1100px; margin: 0 auto; }
        .adm-nav  { background: #0d0d1a; padding: 0 20px; display: flex; align-items: center; gap: 0; overflow-x: auto; }
        .adm-stats4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 28px; }
        .adm-utbl-hd { display: grid; grid-template-columns: 1fr auto; gap: 12px; padding: 10px 16px; border-bottom: 1px solid #f3f4f6; background: #f9fafb; }
        .adm-utbl-row { display: grid; grid-template-columns: 1fr auto; gap: 12px; padding: 14px 16px; align-items: center; }
        .adm-ptbl-row { display: grid; grid-template-columns: 2fr 90px 100px 80px 130px; gap: 12px; padding: 12px 16px; align-items: center; }
        .adm-input { width: 100%; padding: 11px 13px; border-radius: 10px; border: 1.5px solid #e5e7eb; font-size: 14px; outline: none; box-sizing: border-box; font-family: inherit; background: #fff; transition: border-color 0.15s; }
        .adm-input:focus { border-color: #6366f1; }
        @media (max-width: 900px) {
          .adm-stats4 { grid-template-columns: repeat(2,1fr); }
          .adm-ptbl-row { grid-template-columns: 2fr 90px 80px 130px; }
          .adm-ptbl-row > *:nth-child(3) { display: none; }
        }
        @media (max-width: 600px) {
          .adm-wrap { padding: 14px; }
          .adm-stats4 { grid-template-columns: 1fr 1fr; gap: 10px; }
          .adm-utbl-hd { display: none; }
          .adm-utbl-row { grid-template-columns: 1fr; gap: 6px; padding: 14px 14px; }
          .adm-ptbl-row { grid-template-columns: 1fr 1fr; gap: 8px; padding: 12px 14px; }
          .adm-ptbl-row > *:nth-child(3),
          .adm-ptbl-row > *:nth-child(4) { display: none; }
        }
      `}</style>
      <div className="adm-wrap">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && stats && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 24 }}>Overview</h1>
            <div className="adm-stats4">
              <Stat label="Total Users"    value={fmt(stats.totalUsers)} />
              <Stat label="Active Trials"  value={fmt(stats.activeTrials)}  color="#d97706" sub={`${fmt(stats.expiredTrials)} expired`} />
              <Stat label="Pending Payments" value={fmt(stats.pendingPayments)} color={stats.pendingPayments > 0 ? '#dc2626' : '#111'} />
              <Stat label="Total Revenue"  value={`₹${fmt(stats.totalRevenue)}`} color="#059669" />
            </div>
            <div className="adm-stats4">
              <Stat label="Free Users"  value={fmt(stats.tierCounts?.free     || 0)} />
              <Stat label="Pro Users"   value={fmt(stats.tierCounts?.pro      || 0)} color="#1d4ed8" />
              <Stat label="Founders"    value={fmt(stats.tierCounts?.founding || 0)} color="#065f46" />
              <Stat label="Trades (7d)" value={fmt(stats.trades7d)} sub={`${fmt(stats.tradesTotal)} all time`} />
            </div>
            {stats.recentPending?.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#dc2626', marginBottom: 16 }}>
                  🔔 {stats.recentPending.length} pending payment{stats.recentPending.length > 1 ? 's' : ''} need review
                </div>
                {stats.recentPending.slice(0, 3).map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{r.user_id?.slice(0, 8)}…</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{r.plan} · {r.transaction_ref} · {ago(r.created_at)}</div>
                    </div>
                    <button onClick={() => setTab('payments')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      Review →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111', margin: 0, flex: 1 }}>Users ({filteredUsers.length})</h1>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by email…"
                style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', minWidth: 220 }}
              />
              <select value={filterTier} onChange={e => setFilterTier(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
                <option value="all">All tiers</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="founding">Founding</option>
              </select>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div className="adm-utbl-hd">
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>User</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</div>
              </div>
              {filteredUsers.length === 0 && (
                <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No users found</div>
              )}
              {filteredUsers.map((u, i) => (
                <div key={u.id} className="adm-utbl-row" style={{ borderBottom: i < filteredUsers.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 5, alignItems: 'center' }}>
                      <Badge label={u.tier} map={TIER_COLORS} />
                      <Badge label={u.role} map={ROLE_COLORS} />
                      {u.tier === 'free' && (
                        <span style={{ fontSize: 11, color: u.trialExpired ? '#dc2626' : '#059669', fontWeight: 700 }}>
                          {u.trialExpired ? '· Trial expired' : `· ${u.trialDaysLeft}d left`}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: '#d1d5db' }}>Joined {fmtDate(u.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditUser(u)}
                    style={{ padding: '7px 18px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    ✏️ Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PAYMENTS ── */}
        {tab === 'payments' && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 20 }}>Payment Requests</h1>
            {pendingReqs.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#dc2626', marginBottom: 14 }}>🔔 Pending ({pendingReqs.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingReqs.map(r => (
                    <PaymentCard key={r.id} req={r} users={users} onApprove={setApproveReq} onReject={setRejectReq} />
                  ))}
                </div>
              </div>
            )}
            <div style={{ fontSize: 14, fontWeight: 800, color: '#374151', marginBottom: 14 }}>All Requests</div>
            {reqs.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                No payment requests yet
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                {reqs.map((r, i) => {
                  const reqUser = users.find(u => u.id === r.user_id);
                  return (
                    <div key={r.id} style={{ padding: '14px 18px', borderBottom: i < reqs.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        {/* User + plan info */}
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{reqUser?.email || r.user_id?.slice(0, 14) + '…'}</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 5, alignItems: 'center' }}>
                            <Badge label={r.plan} map={TIER_COLORS} />
                            {reqUser && <Badge label={reqUser.tier} map={TIER_COLORS} />}
                            <StatusBadge status={r.status} />
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 5 }}>
                            UTR: {r.transaction_ref}
                            {r.amount && <span> · ₹{r.amount}</span>}
                            <span> · {fmtDate(r.created_at)}</span>
                          </div>
                          {(r.start_date || r.end_date) && (
                            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>
                              📅 {r.start_date ? fmtDate(r.start_date) : '?'} → {r.end_date ? fmtDate(r.end_date) : '?'}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                          {r.status === 'pending' && (
                            <button onClick={() => setApproveReq(r)} style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: '#059669', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>✓ Approve</button>
                          )}
                          {r.status === 'pending' && (
                            <button onClick={() => setRejectReq(r)} style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>✗</button>
                          )}
                          <button onClick={() => setEditReq(r)} style={{ padding: '6px 14px', borderRadius: 7, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>✏️ Edit</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ANNOUNCEMENTS ── */}
        {tab === 'announce' && (() => {
          const ANN_STYLES = {
            info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af', icon: '💬' },
            warning: { bg: '#fefce8', border: '#fde047', color: '#92400e', icon: '⚠️' },
            success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#065f46', icon: '✅' },
          };
          const active   = annHistory.filter(a => a.active);
          const inactive = annHistory.filter(a => !a.active);
          return (
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 20 }}>Announcements</h1>

              {/* Compose */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 28 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 14 }}>Send a new announcement</div>
                <textarea value={annMsg} onChange={e => setAnnMsg(e.target.value)}
                  placeholder="Write your announcement…" rows={3}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 12 }}
                />
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[['info','💬 Info','#eff6ff','#1d4ed8'],['warning','⚠️ Warning','#fefce8','#92400e'],['success','✅ Success','#f0fdf4','#065f46']].map(([k, l, bg, c]) => (
                      <button key={k} onClick={() => setAnnType(k)} style={{
                        padding: '7px 14px', borderRadius: 8, border: `2px solid ${annType === k ? c : '#e5e7eb'}`,
                        background: annType === k ? bg : '#fff', color: annType === k ? c : '#6b7280',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      }}>{l}</button>
                    ))}
                  </div>
                  <button onClick={postAnnouncement} disabled={saving || !annMsg.trim()} style={{
                    marginLeft: 'auto', padding: '9px 20px', borderRadius: 10, border: 'none',
                    background: !annMsg.trim() ? '#e5e7eb' : '#0d0d1a', color: !annMsg.trim() ? '#9ca3af' : '#fff',
                    fontSize: 13, fontWeight: 800, cursor: annMsg.trim() ? 'pointer' : 'not-allowed',
                  }}>{saving ? 'Sending…' : 'Send to All Users →'}</button>
                </div>
              </div>

              {/* Active */}
              <div style={{ fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                Active
                <span style={{ background: active.length ? '#dcfce7' : '#f3f4f6', color: active.length ? '#15803d' : '#9ca3af', borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{active.length}</span>
              </div>
              {active.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13, marginBottom: 24 }}>No active announcements</div>
              ) : active.map(a => {
                const s = ANN_STYLES[a.type] || ANN_STYLES.info;
                return (
                  <div key={a.id} style={{ background: s.bg, borderRadius: 14, border: `1px solid ${s.border}`, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 10 }}>
                    <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{s.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginBottom: 4 }}>{a.message}</div>
                      <div style={{ fontSize: 11, color: s.color, opacity: 0.7 }}>{a.type} · {fmtDate(a.created_at)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => toggleAnnouncement(a.id, false)} style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${s.border}`, background: '#fff', color: s.color, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Deactivate
                      </button>
                      <button onClick={() => deleteAnnouncement(a.id)} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* History */}
              {inactive.length > 0 && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#374151', margin: '24px 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    History
                    <span style={{ background: '#f3f4f6', color: '#9ca3af', borderRadius: 99, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{inactive.length}</span>
                  </div>
                  {inactive.map(a => {
                    const s = ANN_STYLES[a.type] || ANN_STYLES.info;
                    return (
                      <div key={a.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 8, opacity: 0.7 }}>
                        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>{s.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{a.message}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{a.type} · {fmtDate(a.created_at)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button onClick={() => toggleAnnouncement(a.id, true)} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #d1fae5', background: '#f0fdf4', color: '#065f46', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            Reactivate
                          </button>
                          <button onClick={() => deleteAnnouncement(a.id)} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            🗑
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          );
        })()}

        {/* ── PAYMENT SETTINGS ── */}
        {tab === 'paysettings' && (
          <div style={{ maxWidth: 560 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111', marginBottom: 6 }}>Payment Details</h1>
            <p style={{ margin: '0 0 28px', fontSize: 13, color: '#9ca3af' }}>
              These details appear on the Upgrade page for users to make payments.
            </p>

            {/* UPI */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📱</span> UPI
              </div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>UPI ID</label>
              <input className="adm-input" value={pay.upi || ''} onChange={e => setPay(p => ({ ...p, upi: e.target.value }))}
                placeholder="yourname@upi" />
            </div>

            {/* Bank Transfer */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24, marginBottom: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🏦</span> Bank Transfer
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  ['accountName', 'Account Name',   'Full name as per bank'],
                  ['bank',        'Bank Name',       'e.g. HDFC Bank'],
                  ['accountNo',   'Account Number',  '12-digit account number'],
                  ['ifsc',        'IFSC Code',       'e.g. HDFC0001234'],
                ].map(([key, label, placeholder]) => (
                  <div key={key} style={{ gridColumn: key === 'accountNo' || key === 'accountName' ? 'auto' : 'auto' }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
                    <input className="adm-input"
                      value={pay.bank?.[key] || ''}
                      onChange={e => setPay(p => ({ ...p, bank: { ...p.bank, [key]: e.target.value } }))}
                      placeholder={placeholder} />
                  </div>
                ))}
              </div>
            </div>

            {/* Password + Save */}
            <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🔐 Admin Password to Confirm
              </label>
              <input
                type="password"
                className="adm-input"
                value={payPwd}
                onChange={e => { setPayPwd(e.target.value); setPayError(''); }}
                placeholder="Enter your password before saving"
                onKeyDown={e => e.key === 'Enter' && savePaymentSettings()}
              />
              {payError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 7, fontWeight: 600 }}>{payError}</div>}
            </div>

            <button onClick={savePaymentSettings} disabled={payLoading}
              style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: paySaved ? '#059669' : payLoading ? '#9ca3af' : '#0d0d1a', color: '#fff', fontSize: 14, fontWeight: 800, cursor: payLoading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
              {paySaved ? '✓ Saved!' : payLoading ? 'Verifying & Saving…' : 'Save Payment Details →'}
            </button>
            <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 10 }}>
              Changes appear immediately on the Upgrade page for all users
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:  { bg: '#fef3c7', color: '#92400e' },
    approved: { bg: '#f0fdf4', color: '#065f46' },
    rejected: { bg: '#fef2f2', color: '#dc2626' },
  };
  const s = map[status] || map.pending;
  return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'capitalize' }}>{status}</span>;
}

function PaymentCard({ req, users, onApprove, onReject }) {
  const user = users.find(u => u.id === req.user_id);
  return (
    <div style={{ background: '#fff', border: '2px solid #fecaca', borderRadius: 14, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{user?.email || req.user_id}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Submitted {new Date(req.created_at).toLocaleString()}</div>
        </div>
        <Badge label={req.plan} map={TIER_COLORS} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[['Method', req.payment_method], ['Amount', req.amount ? `₹${req.amount}` : 'Not specified'], ['UTR / Ref', req.transaction_ref]].map(([k, v]) => (
          <div key={k} style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{k}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111', wordBreak: 'break-all' }}>{v}</div>
          </div>
        ))}
      </div>
      {req.notes && (
        <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 12px', marginBottom: 14, fontSize: 13, color: '#374151' }}>
          <span style={{ fontWeight: 700 }}>Notes: </span>{req.notes}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => onApprove(req)} style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: '#059669', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
          ✓ Review & Approve
        </button>
        <button onClick={() => onReject(req)} style={{ padding: '12px 20px', borderRadius: 10, border: '2px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
          ✗ Reject
        </button>
      </div>
    </div>
  );
}
