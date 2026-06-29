'use client';

import { useState } from 'react';
import { authFetch } from '@/lib/authFetch.js';

/* ─── Currency list ──────────────────────────────────────────────────────── */
const CURRENCIES = [
  { code: 'INR', symbol: '₹',  name: 'Indian Rupee' },
  { code: 'USD', symbol: '$',  name: 'US Dollar' },
  { code: 'EUR', symbol: '€',  name: 'Euro' },
  { code: 'GBP', symbol: '£',  name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'JPY', symbol: '¥',  name: 'Japanese Yen' },
  { code: 'ZAR', symbol: 'R',  name: 'South African Rand' },
  { code: 'NGN', symbol: '₦',  name: 'Nigerian Naira' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
];

const STEP_LABELS = ['Currency', 'Starting Capital', 'Your Goal', 'Timeline', 'Journal Mode'];

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep]       = useState(0);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const [currency,       setCurrency]       = useState(CURRENCIES[0]);
  const [startCapital,   setStartCapital]   = useState('');
  const [goalCapital,    setGoalCapital]    = useState('');
  const [timelineMode,   setTimelineMode]   = useState('days'); // 'days' | 'date'
  const [goalDays,       setGoalDays]       = useState('365');
  const [goalDate,       setGoalDate]       = useState('');
  const [startDate,      setStartDate]      = useState(new Date().toISOString().slice(0, 10));
  const [testMode,       setTestMode]       = useState(false);

  /* helpers */
  const sym = currency.symbol;

  function fmt(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return val;
    return n.toLocaleString();
  }

  function canNext() {
    if (step === 0) return true;
    if (step === 1) return startCapital !== '' && parseFloat(startCapital) > 0;
    if (step === 2) return goalCapital  !== '' && parseFloat(goalCapital) > parseFloat(startCapital || 0);
    if (step === 3) {
      if (timelineMode === 'days') return goalDays !== '' && parseInt(goalDays) >= 7;
      return goalDate !== '' && goalDate > startDate;
    }
    if (step === 4) return true;
    return false;
  }

  async function handleFinish() {
    setSaving(true);
    setError('');
    try {
      const res = await authFetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency:         currency.code,
          currencySymbol:   currency.symbol,
          startingCapital:  parseFloat(startCapital),
          goalCapital:      parseFloat(goalCapital),
          goalDays:         timelineMode === 'days' ? parseInt(goalDays) : null,
          goalDate:         timelineMode === 'date' ? goalDate : null,
          journeyStartDate: startDate,
          testMode,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onComplete(data.settings);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '24px',
        width: '100%', maxWidth: '500px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}>

        {/* Progress bar */}
        <div style={{ height: '4px', background: '#f0f0f0' }}>
          <div style={{
            height: '100%',
            width: `${((step + 1) / 4) * 100}%`,
            background: 'linear-gradient(90deg, #5e35b1, #1a237e)',
            transition: 'width 0.4s ease',
            borderRadius: '0 4px 4px 0',
          }} />
        </div>

        <div style={{ padding: '36px 36px 28px' }}>

          {/* Step dots */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', alignItems: 'center' }}>
            {STEP_LABELS.map((l, i) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: i <= step ? 'var(--primary)' : '#f0f0f5',
                  color: i <= step ? '#fff' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 800, flexShrink: 0,
                  transition: 'all 0.3s',
                }}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div style={{ width: '24px', height: '2px', background: i < step ? 'var(--primary)' : '#f0f0f5', borderRadius: '2px', transition: 'background 0.3s' }} />
                )}
              </div>
            ))}
          </div>

          {/* ── Step 0: Currency ── */}
          {step === 0 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Step 1 of 4</div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.3px' }}>What currency do you trade in?</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
                All P&L, goals, and meter values will be shown in this currency.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
                      border: currency.code === c.code ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                      background: currency.code === c.code ? 'var(--primary-light)' : '#fff',
                      transition: 'all 0.15s', textAlign: 'left',
                    }}
                  >
                    <span style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: currency.code === c.code ? 'var(--primary)' : '#f5f5f5',
                      color: currency.code === c.code ? '#fff' : 'var(--text)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: 800, flexShrink: 0,
                    }}>{c.symbol}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: currency.code === c.code ? 'var(--primary)' : 'var(--text)' }}>{c.code}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 1: Starting Capital ── */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Step 2 of 4</div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.3px' }}>What's your starting capital?</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 28px', lineHeight: 1.6 }}>
                This is the amount you're starting your journey with today.
              </p>

              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <span style={{
                  position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '20px', fontWeight: 800, color: 'var(--text-muted)',
                }}>{sym}</span>
                <input
                  type="number" min="1" value={startCapital}
                  onChange={e => setStartCapital(e.target.value)}
                  placeholder="e.g. 15000"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '16px 16px 16px 40px', borderRadius: '12px',
                    border: '1.5px solid var(--border)', fontSize: '22px', fontWeight: 800,
                    color: 'var(--text)', outline: 'none',
                  }}
                  autoFocus
                />
              </div>
              {startCapital && (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  Starting with <strong style={{ color: 'var(--text)' }}>{sym}{fmt(startCapital)}</strong>
                </p>
              )}

              <div style={{ marginTop: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Journey start date</div>
                <input
                  type="date" value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{
                    padding: '10px 14px', borderRadius: '10px',
                    border: '1.5px solid var(--border)', fontSize: '14px',
                    color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Goal ── */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Step 3 of 4</div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.3px' }}>What's your capital goal?</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 28px', lineHeight: 1.6 }}>
                The number your Growth Meter counts up to. Be ambitious but realistic.
              </p>

              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <span style={{
                  position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '20px', fontWeight: 800, color: 'var(--text-muted)',
                }}>{sym}</span>
                <input
                  type="number" min="1" value={goalCapital}
                  onChange={e => setGoalCapital(e.target.value)}
                  placeholder="e.g. 1000000"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '16px 16px 16px 40px', borderRadius: '12px',
                    border: '1.5px solid var(--border)', fontSize: '22px', fontWeight: 800,
                    color: 'var(--text)', outline: 'none',
                  }}
                  autoFocus
                />
              </div>

              {goalCapital && parseFloat(goalCapital) > parseFloat(startCapital || 0) && (
                <div style={{ background: 'var(--primary-light)', borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 700 }}>
                    Target: <strong>{sym}{fmt(goalCapital)}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Need to grow {sym}{fmt((parseFloat(goalCapital) - parseFloat(startCapital || 0)).toFixed(0))} from your starting capital
                  </div>
                </div>
              )}
              {goalCapital && parseFloat(goalCapital) <= parseFloat(startCapital || 0) && (
                <p style={{ fontSize: '13px', color: '#c62828', margin: 0 }}>Goal must be greater than starting capital</p>
              )}

              {/* Quick suggestions */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>Quick picks</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { label: '10×', mult: 10 },
                    { label: '50×', mult: 50 },
                    { label: '100×', mult: 100 },
                  ].map(q => {
                    const val = parseFloat(startCapital || 0) * q.mult;
                    return (
                      <button key={q.label}
                        onClick={() => setGoalCapital(val.toString())}
                        style={{
                          padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                          border: '1.5px solid var(--border)', background: '#fff', color: 'var(--primary)',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {q.label} → {sym}{fmt(val.toFixed(0))}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Timeline ── */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Step 4 of 5</div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.3px' }}>When do you want to hit that goal?</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
                Set a deadline. It creates urgency, tracks your daily progress, and shows days remaining.
              </p>

              {/* Toggle */}
              <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
                {[['days', '# of days'], ['date', 'Specific date']].map(([mode, label]) => (
                  <button key={mode}
                    onClick={() => setTimelineMode(mode)}
                    style={{
                      flex: 1, padding: '9px', borderRadius: '9px', fontSize: '14px', fontWeight: 700,
                      border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                      background: timelineMode === mode ? '#fff' : 'transparent',
                      color: timelineMode === mode ? 'var(--primary)' : 'var(--text-muted)',
                      boxShadow: timelineMode === mode ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >{label}</button>
                ))}
              </div>

              {timelineMode === 'days' ? (
                <div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {[90, 180, 365, 730].map(d => (
                      <button key={d}
                        onClick={() => setGoalDays(d.toString())}
                        style={{
                          flex: 1, minWidth: '70px', padding: '10px 8px', borderRadius: '10px', fontSize: '14px', fontWeight: 800,
                          cursor: 'pointer', transition: 'all 0.15s',
                          border: goalDays === d.toString() ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                          background: goalDays === d.toString() ? 'var(--primary-light)' : '#fff',
                          color: goalDays === d.toString() ? 'var(--primary)' : 'var(--text)',
                        }}
                      >
                        {d} days
                        <div style={{ fontSize: '10px', fontWeight: 600, opacity: 0.6, marginTop: '2px' }}>
                          {d === 90 ? '3 months' : d === 180 ? '6 months' : d === 365 ? '1 year' : '2 years'}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number" min="7" value={goalDays}
                      onChange={e => setGoalDays(e.target.value)}
                      placeholder="Or enter custom days"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '12px 14px', borderRadius: '10px',
                        border: '1.5px solid var(--border)', fontSize: '16px',
                        color: 'var(--text)', outline: 'none',
                      }}
                    />
                  </div>
                  {goalDays && parseInt(goalDays) >= 7 && (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '10px' }}>
                      Deadline: <strong style={{ color: 'var(--text)' }}>
                        {new Date(new Date(startDate).getTime() + parseInt(goalDays) * 86400000).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </strong>
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="date" value={goalDate}
                    min={new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)}
                    onChange={e => setGoalDate(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '14px', borderRadius: '12px',
                      border: '1.5px solid var(--border)', fontSize: '18px', fontWeight: 700,
                      color: 'var(--text)', outline: 'none',
                    }}
                    autoFocus
                  />
                  {goalDate && (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '10px' }}>
                      That's {Math.ceil((new Date(goalDate) - new Date(startDate)) / 86400000)} days from your start date.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <p style={{ color: '#c62828', fontSize: '13px', marginTop: '12px' }}>{error}</p>
          )}

          {/* Nav buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '32px' }}>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{
                  padding: '12px 20px', borderRadius: '12px', fontSize: '15px', fontWeight: 700,
                  border: '1.5px solid var(--border)', background: '#fff', color: 'var(--text)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >← Back</button>
            )}
            <button
              onClick={step < 4 ? () => setStep(s => s + 1) : handleFinish}
              disabled={!canNext() || saving}
              style={{
                flex: 1, padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: 800,
                border: 'none', cursor: canNext() && !saving ? 'pointer' : 'not-allowed',
                background: canNext() && !saving
                  ? 'linear-gradient(135deg, #5e35b1, #1a237e)'
                  : '#e0e0e0',
                color: canNext() && !saving ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              {saving ? 'Saving...' : step < 4 ? 'Continue →' : '🚀 Start My Journey'}
            </button>
          </div>

          {/* ── Step 4: Journal Mode ── */}
          {step === 4 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Step 5 of 5</div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.3px' }}>How do you want to start?</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
                Choose your journaling mode. You can always switch later in your Profile.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  {
                    value: false,
                    icon: '📊',
                    title: 'Real Journaling',
                    desc: 'Every trade counts toward your actual performance, streaks, badges, and capital progress. Best if you\'re ready to track real trades.',
                    color: '#6366f1',
                    bg: '#ede9fe',
                    border: '#c4b5fd',
                  },
                  {
                    value: true,
                    icon: '🧪',
                    title: 'Test Mode',
                    desc: 'Explore the app without affecting your stats. Test trades are tracked separately and can be deleted anytime. Perfect for getting familiar.',
                    color: '#b45309',
                    bg: '#fef3c7',
                    border: '#fcd34d',
                  },
                ].map(opt => (
                  <div key={String(opt.value)} onClick={() => setTestMode(opt.value)} style={{
                    border: `2px solid ${testMode === opt.value ? opt.border : 'var(--border)'}`,
                    borderRadius: 14, padding: '16px 18px', cursor: 'pointer',
                    background: testMode === opt.value ? opt.bg : '#fff',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 22 }}>{opt.icon}</span>
                      <div style={{ fontSize: 15, fontWeight: 800, color: testMode === opt.value ? opt.color : 'var(--text)' }}>{opt.title}</div>
                      {testMode === opt.value && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: opt.color, background: '#fff', borderRadius: 10, padding: '2px 8px', border: `1px solid ${opt.border}` }}>Selected</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, paddingLeft: 32 }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 0 && (
            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', marginBottom: 0 }}>
              You can change any of this later in Settings
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
