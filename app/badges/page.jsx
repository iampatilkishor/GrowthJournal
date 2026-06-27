'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { authFetch } from '@/lib/authFetch.js';

const CAT_META = {
  streak:     { label: 'Journaling Streaks',  icon: '🔥', color: '#9a3412', bg: '#fff7ed', border: '#fed7aa', tip: 'Journal every day — even a quick note counts.' },
  milestone:  { label: 'Trade Milestones',    icon: '🚀', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', tip: 'Log every trade in the Trade Log to progress.' },
  discipline: { label: 'Discipline',          icon: '✅', color: '#166534', bg: '#f0fdf4', border: '#bbf7d0', tip: 'Mark "Followed Plan?" on each trade entry.' },
  capital:    { label: 'Capital Goals',       icon: '🏆', color: '#6b21a8', bg: '#faf5ff', border: '#e9d5ff', tip: 'Set a capital goal in Settings to track progress.' },
};

const CATS = ['streak', 'milestone', 'discipline', 'capital'];

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BadgesPage() {
  const [badges, setBadges] = useState(null);
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/badges')
      .then(r => r.json())
      .then(d => { setBadges(d.badges || []); setStats(d.stats || {}); })
      .catch(() => setBadges([]))
      .finally(() => setLoading(false));
  }, []);

  const earned = (badges || []).filter(b => b.earned).length;
  const total  = (badges || []).length;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          <Link href="/dashboard" style={{ color: '#9ca3af', textDecoration: 'none' }}>Dashboard</Link> › Badges
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#111', margin: 0, lineHeight: 1.2 }}>🏅 Your Badges</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
          Earn badges by journaling consistently, hitting trade milestones, maintaining discipline, and growing your capital.
        </p>
      </div>

      {/* Progress bar */}
      {!loading && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '18px 20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>Overall Progress</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: earned === total ? '#059669' : '#6366f1' }}>
              {earned} / {total} earned
            </span>
          </div>
          <div style={{ background: '#f3f4f6', borderRadius: 8, height: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 8, background: earned === total ? '#10b981' : '#6366f1', width: `${total ? (earned / total) * 100 : 0}%`, transition: 'width 0.6s ease' }} />
          </div>
          {stats && (
            <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
              {[
                { l: 'Journal streak', v: `${stats.journalStreak ?? 0}d` },
                { l: 'Total trades', v: stats.totalTrades ?? 0 },
                { l: 'Best week', v: stats.bestWeekPct ? `${stats.bestWeekPct}%` : '—' },
                { l: 'Capital goal', v: stats.goalPct != null ? `${stats.goalPct}%` : '—' },
              ].map(s => (
                <div key={s.l} style={{ flex: '1 1 100px', textAlign: 'center', background: '#f9fafb', borderRadius: 10, padding: '10px 8px' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#111' }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 120, background: '#f3f4f6', borderRadius: 16 }} />)}
        </div>
      )}

      {/* Badge categories */}
      {!loading && CATS.map(cat => {
        const meta     = CAT_META[cat];
        const catBadges = (badges || []).filter(b => b.cat === cat);
        const catEarned = catBadges.filter(b => b.earned).length;
        return (
          <div key={cat} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '20px', marginBottom: 16 }}>
            {/* Category header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: meta.color }}>
                {meta.icon} {meta.label}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, background: catEarned ? meta.bg : '#f3f4f6', color: catEarned ? meta.color : '#9ca3af', padding: '3px 10px', borderRadius: 20, border: `1px solid ${catEarned ? meta.border : '#e5e7eb'}` }}>
                {catEarned}/{catBadges.length}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 14 }}>💡 {meta.tip}</div>

            {/* Badge grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              {catBadges.map(b => (
                <div key={b.id} style={{
                  border: `1.5px solid ${b.isNew ? '#f59e0b' : b.earned ? meta.border : '#e5e7eb'}`,
                  borderRadius: 14,
                  padding: '16px 12px',
                  textAlign: 'center',
                  background: b.isNew ? '#fffbeb' : b.earned ? meta.bg : '#fafafa',
                  opacity: b.earned ? 1 : 0.5,
                  position: 'relative',
                  transition: 'opacity 0.2s',
                }}>
                  {b.isNew && (
                    <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 800, color: '#d97706', background: '#fef3c7', borderRadius: 6, padding: '2px 6px', textTransform: 'uppercase' }}>New!</div>
                  )}
                  {!b.earned && (
                    <div style={{ position: 'absolute', top: 8, right: 10, fontSize: 14 }}>🔒</div>
                  )}
                  <div style={{ fontSize: 30, marginBottom: 6, filter: b.earned ? 'none' : 'grayscale(1)' }}>{b.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: b.earned ? meta.color : '#6b7280', marginBottom: 3, lineHeight: 1.3 }}>{b.name}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.5 }}>{b.desc}</div>
                  {b.earned && b.earned_at && (
                    <div style={{ fontSize: 9, fontWeight: 700, color: meta.color, marginTop: 6, opacity: 0.8 }}>
                      Earned {fmtDate(b.earned_at)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
