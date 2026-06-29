'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthGate.jsx';
import { authFetch } from '@/lib/authFetch.js';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function daysSince(iso) {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function getInitials(email) {
  if (!email) return '?';
  const parts = email.split('@')[0].split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

function StatCard({ icon, label, value, sub, color = 'var(--primary)' }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)', borderRadius: '14px',
      padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: '6px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{ fontSize: '22px' }}>{icon}</div>
      <div style={{ fontSize: '24px', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{
        fontSize: '13px', fontWeight: 600, color: 'var(--text)',
        fontFamily: mono ? 'monospace' : 'inherit',
        maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{value}</span>
    </div>
  );
}

const BADGE_CAT_LABELS = {
  streak:     { label: '🔥 Journaling Streaks',  color: '#9a3412', bg: '#fff7ed', border: '#fed7aa' },
  milestone:  { label: '🚀 Trade Milestones',    color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  discipline: { label: '✅ Discipline',           color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' },
  capital:    { label: '🏆 Capital Goals',        color: '#6b21a8', bg: '#faf5ff', border: '#e9d5ff' },
};

function BadgeShowcase({ badges }) {
  if (!badges) return <div style={{ padding: 20, color: 'var(--text-muted)', textAlign: 'center', fontSize: 13 }}>Loading badges…</div>;

  const cats = ['streak', 'milestone', 'discipline', 'capital'];
  const earned = badges.filter(b => b.earned).length;

  return (
    <div style={{ marginBottom: '16px' }}>
      <div className="card" style={{ paddingBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🏅 Badges
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, background: earned > 0 ? '#e8f5e9' : '#f3f4f6', color: earned > 0 ? '#2e7d32' : '#9ca3af', padding: '3px 10px', borderRadius: 20 }}>
            {earned} / {badges.length} earned
          </span>
        </div>

        {cats.map(cat => {
          const catBadges = badges.filter(b => b.cat === cat);
          const meta = BADGE_CAT_LABELS[cat];
          return (
            <div key={cat} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{meta.label}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                {catBadges.map(b => (
                  <div key={b.id} title={b.desc} style={{
                    border: `1.5px solid ${b.isNew ? '#f59e0b' : b.earned ? meta.border : 'var(--border)'}`,
                    borderRadius: 12,
                    padding: '12px 10px',
                    textAlign: 'center',
                    background: b.isNew ? '#fffbeb' : b.earned ? meta.bg : '#fafafa',
                    opacity: b.earned ? 1 : 0.45,
                    position: 'relative',
                    transition: 'all 0.15s',
                  }}>
                    {b.isNew && <div style={{ position: 'absolute', top: 6, left: 8, fontSize: 9, fontWeight: 800, color: '#d97706', background: '#fef3c7', borderRadius: 6, padding: '1px 5px' }}>NEW</div>}
                    <div style={{ fontSize: 24, marginBottom: 4, filter: b.earned ? 'none' : 'grayscale(1)' }}>{b.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: b.earned ? meta.color : 'var(--text-muted)', lineHeight: 1.3, marginBottom: 2 }}>{b.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{b.desc}</div>
                    {b.earned && b.earned_at && (
                      <div style={{ fontSize: 9, color: meta.color, fontWeight: 700, marginTop: 4, opacity: 0.8 }}>
                        {new Date(b.earned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                    {!b.earned && (
                      <div style={{ position: 'absolute', top: 6, right: 8, fontSize: 12 }}>🔒</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, tier, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [badges, setBadges] = useState(null);
  const [testMode, setTestMode] = useState(false);
  const [testModeLoading, setTestModeLoading] = useState(false);

  useEffect(() => {
    authFetch('/api/badges').then(r => r.json()).then(d => setBadges(d.badges || [])).catch(() => setBadges([]));
    authFetch('/api/user-settings').then(r => r.json()).then(d => setTestMode(!!d.settings?.test_mode)).catch(() => {});
  }, []);

  async function toggleTestMode() {
    setTestModeLoading(true);
    const next = !testMode;
    try {
      await authFetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testMode: next }),
      });
      setTestMode(next);
    } catch { /* ignore */ } finally {
      setTestModeLoading(false);
    }
  }

  useEffect(() => {
    async function fetchStats() {
      try {
        const [journalRes, plansRes, ordersRes] = await Promise.allSettled([
          authFetch('/api/journal').then(r => r.json()),
          authFetch('/api/plans').then(r => r.json()),
          authFetch('/api/orders').then(r => r.json()),
        ]);

        const entries = journalRes.status === 'fulfilled' ? (journalRes.value.entries || []) : [];
        const plans   = plansRes.status   === 'fulfilled' ? (plansRes.value.plans   || []) : [];
        const orders  = ordersRes.status  === 'fulfilled' ? (ordersRes.value.orders  || []) : [];

        // Winning trades from journal
        const wins = entries.filter(e => (e.pnl ?? 0) > 0).length;
        const totalPnl = entries.reduce((s, e) => s + (e.pnl ?? 0), 0);

        setStats({
          journalCount: entries.length,
          planCount:    plans.length,
          orderCount:   orders.length,
          winCount:     wins,
          winRate:      entries.length > 0 ? Math.round((wins / entries.length) * 100) : null,
          totalPnl,
          activePlans:  plans.filter(p => p.is_active).length,
        });
      } catch {
        setStats({ journalCount: 0, planCount: 0, orderCount: 0, winRate: null, totalPnl: 0, activePlans: 0 });
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, []);

  const tierConfig = {
    guest:     { label: 'Guest',            bg: '#f5f5f5', color: '#757575', icon: '👤', desc: 'Not logged in' },
    user:      { label: 'Free Account',     bg: '#e3f2fd', color: '#1565c0', icon: '✉️', desc: 'Journal, plan, tools & assessments' },
    connected: { label: 'Broker Connected', bg: '#e8f5e9', color: '#2e7d32', icon: '🔗', desc: 'Full access — live trading enabled' },
  };
  const tc = tierConfig[tier] || tierConfig.guest;

  const memberDays = daysSince(user?.created_at);
  const initials   = getInitials(user?.email);

  // PnL color
  const pnlColor = !stats || stats.totalPnl === 0 ? 'var(--text)' : stats.totalPnl > 0 ? '#2e7d32' : '#c62828';
  const pnlSign  = stats && stats.totalPnl > 0 ? '+' : '';

  return (
    <div style={{ maxWidth: '620px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>👤 Profile</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Your account overview</p>
      </div>

      {/* Identity card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #6c3fdf 100%)',
        borderRadius: '18px', padding: '28px 24px', marginBottom: '20px',
        display: 'flex', alignItems: 'center', gap: '20px',
        boxShadow: '0 4px 20px rgba(63,114,234,0.25)',
      }}>
        {/* Avatar */}
        <div style={{
          width: '68px', height: '68px', borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.2)',
          border: '3px solid rgba(255,255,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '26px', fontWeight: 800, color: '#fff',
          backdropFilter: 'blur(4px)',
        }}>
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email?.split('@')[0] || '—'}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email || '—'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '3px 10px', borderRadius: '20px' }}>
              {tc.icon} {tc.label}
            </span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
              Member for {memberDays} day{memberDays !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatCard
          icon="📝"
          label="Journal Entries"
          value={loadingStats ? '—' : stats?.journalCount ?? 0}
          sub="trades recorded"
        />
        <StatCard
          icon="📋"
          label="Plans Created"
          value={loadingStats ? '—' : stats?.planCount ?? 0}
          sub={stats?.activePlans ? `${stats.activePlans} active` : 'total plans'}
          color="#e65100"
        />
        <StatCard
          icon="🎯"
          label="Win Rate"
          value={loadingStats ? '—' : stats?.winRate != null ? `${stats.winRate}%` : 'N/A'}
          sub={stats?.winCount != null ? `${stats.winCount} wins` : 'no trades yet'}
          color={stats?.winRate >= 50 ? '#2e7d32' : stats?.winRate != null ? '#c62828' : 'var(--text-muted)'}
        />
        <StatCard
          icon="💰"
          label="Total P&L"
          value={loadingStats ? '—' : stats?.totalPnl != null ? `${pnlSign}₹${Math.abs(stats.totalPnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
          sub="from journal"
          color={pnlColor}
        />
      </div>

      {/* Badges */}
      <BadgeShowcase badges={badges} />

      {/* Account details */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
          Account Details
        </div>
        <InfoRow label="Email"        value={user?.email || '—'} />
        <InfoRow label="User ID"      value={user?.id?.slice(0, 18) + '…' || '—'} mono />
        <InfoRow label="Member since" value={formatDate(user?.created_at)} />
        <InfoRow label="Days active"  value={`${memberDays} day${memberDays !== 1 ? 's' : ''}`} />
        <div style={{ padding: '12px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Account tier</span>
            <span style={{
              fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px',
              background: tc.bg, color: tc.color,
            }}>
              {tc.icon} {tc.label}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
            {tc.desc}
          </div>
        </div>
      </div>

      {/* Trading summary */}
      {!loadingStats && stats && stats.journalCount > 0 && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            Trading Summary
          </div>
          <InfoRow label="Trades journaled"  value={stats.journalCount} />
          <InfoRow label="Winning trades"    value={`${stats.winCount} / ${stats.journalCount}`} />
          <InfoRow label="Win rate"          value={stats.winRate != null ? `${stats.winRate}%` : 'N/A'} />
          <InfoRow label="Total P&L (journal)" value={`${pnlSign}₹${Math.abs(stats.totalPnl).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
          <div style={{ padding: '12px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Discipline</span>
              <span style={{
                fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px',
                background: stats.winRate >= 50 ? '#e8f5e9' : '#fce4ec',
                color: stats.winRate >= 50 ? '#2e7d32' : '#c62828',
              }}>
                {stats.winRate >= 60 ? '🔥 Strong edge' : stats.winRate >= 50 ? '✅ Positive' : stats.winRate != null ? '⚠️ Needs work' : '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Test Mode */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
          Journal Mode
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: testMode ? '#b45309' : 'var(--text)' }}>
              {testMode ? '🧪 Test Mode ON' : '📊 Real Mode'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
              {testMode
                ? 'All new trades are saved as test trades and excluded from real stats.'
                : 'All new trades count toward your real performance.'}
            </div>
          </div>
          <button
            onClick={toggleTestMode}
            disabled={testModeLoading}
            style={{
              width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
              background: testMode ? '#f59e0b' : '#d1d5db',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: testMode ? 25 : 3,
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s', display: 'block',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="card">
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
          Account Actions
        </div>
        <button onClick={logout} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 16px', borderRadius: '9px',
          border: '1.5px solid #ef9a9a', background: '#fff',
          color: '#c62828', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
        }}>
          🚪 Log Out
        </button>
      </div>
    </div>
  );
}
