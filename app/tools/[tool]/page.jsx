'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';

/* ─── Shared UI primitives ──────────────────────────────────────────────── */

function Card({ children }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    }}>
      {children}
    </div>
  );
}

function CardHeader({ icon, title, subtitle }) {
  return (
    <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '3px' }}>
        <span style={{ fontSize: '22px' }}>{icon}</span>
        <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>{title}</h1>
      </div>
      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{subtitle}</p>
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, unit = '', onChange, color = 'var(--primary)', prefix = '' }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{label}</label>
        <span style={{ fontSize: '14px', fontWeight: 700, color }}>{prefix}{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color, height: '4px', cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{prefix}{min}{unit}</span>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{prefix}{max}{unit}</span>
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange, prefix = '', suffix = '', min, step = 1 }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
        {prefix && <span style={{ padding: '10px 12px', background: 'var(--bg)', borderRight: '1px solid var(--border)', fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>{prefix}</span>}
        <input
          type="number" value={value} min={min} step={step}
          onChange={e => onChange(Number(e.target.value))}
          style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: '14px', fontWeight: 600, color: 'var(--text)', background: 'transparent' }}
        />
        {suffix && <span style={{ padding: '10px 12px', background: 'var(--bg)', borderLeft: '1px solid var(--border)', fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>{suffix}</span>}
      </div>
    </div>
  );
}

function ResultRow({ label, value, color, large, muted, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: muted ? '12px' : '13px', color: muted ? 'var(--text-muted)' : 'var(--text)', flexShrink: 1, minWidth: 0 }}>{label}</span>
      <span style={{ fontSize: large ? '18px' : '14px', fontWeight: large ? 800 : bold ? 700 : 600, color: color || 'var(--text)', flexShrink: 0, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

function Verdict({ children, type }) {
  const styles = {
    danger:  { bg: '#fce4ec', border: '#e57373', color: '#b71c1c', icon: '⚠️' },
    warning: { bg: '#fff8e1', border: '#ffb300', color: '#e65100', icon: '⚡' },
    safe:    { bg: '#e8f5e9', border: '#66bb6a', color: '#1b5e20', icon: '✅' },
    info:    { bg: '#e3f2fd', border: '#64b5f6', color: '#0d47a1', icon: 'ℹ️' },
  };
  const s = styles[type] || styles.info;
  return (
    <div style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: '10px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '14px' }}>
      <span style={{ fontSize: '16px', flexShrink: 0 }}>{s.icon}</span>
      <p style={{ margin: 0, fontSize: '13px', color: s.color, lineHeight: 1.5 }}>{children}</p>
    </div>
  );
}

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR ₹' },
  { code: 'USD', symbol: '$', label: 'USD $' },
  { code: 'EUR', symbol: '€', label: 'EUR €' },
  { code: 'GBP', symbol: '£', label: 'GBP £' },
];

const fmt = (n, decimals = 2) => n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const fmtCurrency = (n, symbol = '₹') => symbol + fmt(n);

/* ─── 1. Loss Recovery ──────────────────────────────────────────────────── */

function LossRecoveryCalc({ symbol = '₹' }) {
  const [loss, setLoss] = useState(20);
  const gainNeeded = loss >= 100 ? Infinity : (loss / (100 - loss)) * 100;
  const remaining = 100 - loss;
  const barColor = loss < 10 ? '#2e7d32' : loss < 30 ? '#f57f17' : '#c62828';
  const verdictType = loss < 10 ? 'safe' : loss < 30 ? 'warning' : 'danger';
  const verdictMsg = loss < 10
    ? `A ${loss}% loss needs only a ${gainNeeded.toFixed(1)}% gain to recover. Manageable — cut it early.`
    : loss < 30
    ? `A ${loss}% loss requires a ${gainNeeded.toFixed(1)}% gain just to break even. This is why stop losses matter.`
    : loss < 60
    ? `A ${loss}% loss needs a ${gainNeeded.toFixed(1)}% gain to recover. The math is working against you.`
    : `A ${loss}% loss needs a ${gainNeeded.toFixed(0)}% gain. Nearly impossible. Never let losses get here.`;

  return (
    <Card>
      <CardHeader icon="🔻" title="Loss Recovery Calculator" subtitle="How much gain do you need to get back to break even?" />
      <div style={{ padding: '20px 22px' }}>
        <Slider label="Loss on your account" value={loss} min={1} max={95} unit="%" onChange={setLoss} color={barColor} />
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', height: '36px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ width: `${remaining}%`, background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#2e7d32', transition: 'width 0.2s' }}>
              {remaining > 15 ? `${remaining}% left` : ''}
            </div>
            <div style={{ width: `${loss}%`, background: '#fce4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#c62828', transition: 'width 0.2s' }}>
              {loss > 10 ? `-${loss}%` : ''}
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>Your account after loss</div>
        </div>
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Gain needed to recover (capped at 500%)</div>
          <div style={{ height: '10px', background: '#f5f5f5', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '5px', transition: 'width 0.3s, background 0.3s', width: `${Math.min((gainNeeded / 500) * 100, 100)}%`, background: barColor }} />
          </div>
        </div>
        <div style={{ marginTop: '16px' }}>
          <ResultRow label="Account after loss" value={`${symbol}${remaining.toFixed(0)} of ${symbol}100`} />
          <ResultRow label="Gain needed to break even" value={gainNeeded === Infinity ? '∞' : `${gainNeeded.toFixed(2)}%`} color={barColor} large />
          <ResultRow label={`On a ${symbol}10,000 account, you'd need to earn`} muted value={gainNeeded === Infinity ? '∞' : fmtCurrency((10000 - loss * 100) * gainNeeded / 100, symbol)} />
        </div>
        <Verdict type={verdictType}>{verdictMsg}</Verdict>
      </div>
    </Card>
  );
}

/* ─── 2. Leverage Impact ────────────────────────────────────────────────── */

function LeverageCalc({ symbol = '₹' }) {
  const [leverage, setLeverage] = useState(5);
  const [move, setMove] = useState(10);
  const capitalLost = Math.min(leverage * move, 100);
  const liquidationAt = parseFloat((100 / leverage).toFixed(2));
  const isLiquidated = capitalLost >= 100;
  const barColor = isLiquidated ? '#c62828' : capitalLost >= 50 ? '#e53935' : capitalLost >= 20 ? '#f57f17' : '#2e7d32';

  return (
    <Card>
      <CardHeader icon="⚡" title="Leverage Impact Calculator" subtitle="See how leverage turns small moves into big losses." />
      <div style={{ padding: '20px 22px' }}>
        <Slider label="Leverage" value={leverage} min={1} max={50} unit="x" onChange={setLeverage} color={barColor} />
        <Slider label="Adverse move against you" value={move} min={1} max={50} unit="%" onChange={setMove} color={barColor} />
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Capital lost</div>
          <div style={{ height: '12px', background: '#f5f5f5', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '6px', transition: 'width 0.3s, background 0.3s', width: `${capitalLost}%`, background: barColor }} />
          </div>
        </div>
        <div style={{ marginTop: '16px' }}>
          <ResultRow label="Leverage" value={`${leverage}x`} />
          <ResultRow label="Adverse move" value={`${move}%`} />
          <ResultRow label="Capital lost" value={isLiquidated ? '100% — LIQUIDATED' : `${capitalLost.toFixed(1)}%`} color={barColor} large />
          <ResultRow label="Liquidation threshold" value={`${liquidationAt}% adverse move`} muted />
          <ResultRow label={`On ${symbol}10,000 — you lose`} value={fmtCurrency(10000 * capitalLost / 100, symbol)} muted />
        </div>
        {isLiquidated
          ? <Verdict type="danger">With {leverage}x leverage, a {move}% move wipes your entire account. The market only needs a small move in the wrong direction.</Verdict>
          : capitalLost >= 50
          ? <Verdict type="danger">You'd lose {capitalLost.toFixed(0)}% of capital. You now need a {((capitalLost / (100 - capitalLost)) * 100).toFixed(0)}% gain just to recover.</Verdict>
          : capitalLost >= 20
          ? <Verdict type="warning">A {capitalLost.toFixed(0)}% loss is significant. Always set a stop loss before this level is hit.</Verdict>
          : <Verdict type="safe">{capitalLost.toFixed(1)}% loss is manageable at this leverage. Your liquidation point is {liquidationAt}% away.</Verdict>
        }
      </div>
    </Card>
  );
}

/* ─── 3. Win Rate × R:R Edge ────────────────────────────────────────────── */

function EdgeCalc({ symbol = '₹' }) {
  const [winRate, setWinRate] = useState(50);
  const [rr, setRr] = useState(2);
  const lossRate = 100 - winRate;
  const expectancy = (winRate / 100) * rr - (lossRate / 100);
  const breakEvenRR = lossRate / winRate;
  const minHealthyRR = breakEvenRR * 1.2;
  const winRateNeeded = (1 / (1 + rr)) * 100;
  const hasEdge = expectancy > 0;
  const isStrong = expectancy > 0.3;
  const barColor = isStrong ? '#2e7d32' : hasEdge ? '#f57f17' : '#c62828';
  const expBarPct = Math.min(Math.max(((expectancy + 1) / 2) * 100, 0), 100);

  return (
    <Card>
      <CardHeader icon="📐" title="Win Rate × R:R Edge Calculator" subtitle="Find out if your strategy has a mathematical edge — and how strong it is." />
      <div style={{ padding: '20px 22px' }}>
        <Slider label="Your win rate" value={winRate} min={10} max={90} unit="%" onChange={setWinRate} color={barColor} />
        <Slider label="Average R:R (reward per 1 unit of risk)" value={rr} min={0.5} max={10} step={0.25} onChange={setRr} color={barColor} />
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Expectancy per trade (negative → positive)</div>
          <div style={{ height: '10px', background: '#f5f5f5', borderRadius: '5px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: '#bdbdbd', transform: 'translateX(-50%)' }} />
            <div style={{ height: '100%', borderRadius: '5px', transition: 'width 0.3s, background 0.3s', width: `${expBarPct}%`, background: barColor }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
            <span style={{ fontSize: '10px', color: '#c62828' }}>−1R (losing)</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>break-even</span>
            <span style={{ fontSize: '10px', color: '#2e7d32' }}>+1R (strong edge)</span>
          </div>
        </div>
        <div style={{ marginTop: '16px' }}>
          <ResultRow label="Win rate" value={`${winRate}%`} />
          <ResultRow label="Loss rate" value={`${lossRate}%`} />
          <ResultRow label="Your R:R" value={`1 : ${rr}`} />
          <ResultRow label="Expectancy per trade" value={`${expectancy >= 0 ? '+' : ''}${expectancy.toFixed(3)}R`} color={barColor} large />
          <ResultRow label="Break-even R:R at this win rate" value={`1 : ${breakEvenRR.toFixed(2)}`} muted />
          <ResultRow label="Recommended minimum R:R (+20% cushion)" value={`1 : ${minHealthyRR.toFixed(2)}`} muted />
          <ResultRow label="Win rate needed to break even at this R:R" value={`${winRateNeeded.toFixed(1)}%`} muted />
          <ResultRow label={`Per 100 trades (${symbol}100 risk each) — expected P&L`} value={`${expectancy >= 0 ? '+' : ''}${fmtCurrency(expectancy * 100 * 100, symbol)}`} muted />
        </div>
        {!hasEdge
          ? <Verdict type="danger">Negative expectancy of {expectancy.toFixed(3)}R. You will lose money over time. Raise your R:R to at least 1:{minHealthyRR.toFixed(1)} or improve your win rate.</Verdict>
          : isStrong
          ? <Verdict type="safe">Strong edge: {expectancy.toFixed(3)}R per trade. Over 100 trades risking {symbol}100 each, expect +{fmtCurrency(expectancy * 100 * 100, symbol)}. Stay consistent.</Verdict>
          : <Verdict type="warning">Thin positive edge of {expectancy.toFixed(3)}R. Works mathematically, but slippage or a bad streak can erase it. Consider raising your R:R target.</Verdict>
        }
      </div>
    </Card>
  );
}

/* ─── 4. Position Size Calculator ──────────────────────────────────────── */

function PositionSizeCalc({ symbol = "₹" }) {
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPct, setRiskPct] = useState(1);
  const [entryPrice, setEntryPrice] = useState(100);
  const [stopPrice, setStopPrice] = useState(95);

  const riskAmount = accountSize * (riskPct / 100);
  const stopDistance = Math.abs(entryPrice - stopPrice);
  const stopPct = entryPrice > 0 ? (stopDistance / entryPrice) * 100 : 0;
  const positionSize = stopDistance > 0 ? riskAmount / stopDistance : 0;
  const positionValue = positionSize * entryPrice;
  const isLong = entryPrice > stopPrice;

  const barColor = riskPct <= 1 ? '#2e7d32' : riskPct <= 2 ? '#f57f17' : '#c62828';
  const verdictType = riskPct <= 1 ? 'safe' : riskPct <= 2 ? 'warning' : 'danger';

  return (
    <Card>
      <CardHeader icon="📏" title="Position Size Calculator" subtitle="Risk a fixed % of your account — never more, never less." />
      <div style={{ padding: '20px 22px' }}>
        {/* Account inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '12px' }}>
          <NumberInput label="Account size" value={accountSize} onChange={setAccountSize} prefix={symbol} min={100} step={500} />
          <NumberInput label="Entry price" value={entryPrice} onChange={setEntryPrice} prefix={symbol} min={0.01} step={0.01} />
        </div>
        <NumberInput label="Stop loss price" value={stopPrice} onChange={setStopPrice} prefix={symbol} min={0.01} step={0.01} />

        <Slider
          label="Risk per trade"
          value={riskPct}
          min={0.25}
          max={100}
          step={0.25}
          unit="%"
          onChange={setRiskPct}
          color={barColor}
        />

        {/* Direction badge */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '10px', fontWeight: 700, background: isLong ? '#e8f5e9' : '#fce4ec', color: isLong ? '#2e7d32' : '#c62828', flexShrink: 0 }}>
            {isLong ? '▲ LONG' : '▼ SHORT'}
          </span>
          <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '10px', fontWeight: 600, background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', minWidth: 0, wordBreak: 'break-word' }}>
            Stop distance: {stopDistance > 0 ? `${symbol}${fmt(stopDistance)} (${stopPct.toFixed(2)}%)` : '—'}
          </span>
        </div>

        {/* Results */}
        <div style={{ marginBottom: '4px' }}>
          <ResultRow label="Account size" value={fmtCurrency(accountSize, symbol)} />
          <ResultRow label="Risk per trade" value={`${riskPct}% = ${fmtCurrency(riskAmount, symbol)}`} />
          <ResultRow label="Stop distance" value={stopDistance > 0 ? `${symbol}${fmt(stopDistance)} (${stopPct.toFixed(2)}%)` : '—'} />
          <ResultRow
            label="Position size"
            value={stopDistance > 0 ? `${fmt(positionSize, 0)} units` : '—'}
            color="var(--primary)"
            large
          />
          <ResultRow label="Position value" value={stopDistance > 0 ? fmtCurrency(positionValue, symbol) : '—'} bold />
          <ResultRow label="Max loss on this trade" value={fmtCurrency(riskAmount, symbol)} muted />
          <ResultRow label="Account % deployed" value={accountSize > 0 ? `${((positionValue / accountSize) * 100).toFixed(1)}%` : '—'} muted />
        </div>

        <Verdict type={verdictType}>
          {riskPct <= 1
            ? `Risking ${riskPct}% (${symbol}${fmt(riskAmount, 0)}) is conservative and sustainable. You can absorb a 20-trade losing streak and still have 82% of your account.`
            : riskPct <= 2
            ? `Risking ${riskPct}% (${symbol}${fmt(riskAmount, 0)}) per trade is the maximum most professionals recommend. A 10-trade losing streak loses ${(100 - Math.pow(1 - riskPct / 100, 10) * 100).toFixed(1)}% of your account.`
            : `Risking ${riskPct}% per trade is aggressive. A 10-trade losing streak would cost you ${(100 - Math.pow(1 - riskPct / 100, 10) * 100).toFixed(1)}% of your account. Reduce to 1–2%.`
          }
        </Verdict>
      </div>
    </Card>
  );
}

/* ─── 5. Compounding Calculator ─────────────────────────────────────────── */

const PERIOD_CONFIG = {
  daily:   { label: 'Daily',   unit: 'day',   unitPlural: 'days',   depositLabel: 'Daily deposit',   sliderMin: 0.01, sliderMax: 100,  sliderStep: 0.01, periodMin: 1,   periodMax: 365,  periodStep: 1,   periodUnit: 'd',  tableEvery: (n) => n <= 14 ? 1 : n <= 60 ? 7 : n <= 180 ? 14 : 30, highThreshold: 1,   warnThreshold: 0.5  },
  monthly: { label: 'Monthly', unit: 'month', unitPlural: 'months', depositLabel: 'Monthly deposit', sliderMin: 0.5,  sliderMax: 500,  sliderStep: 0.5,  periodMin: 1,   periodMax: 120,  periodStep: 1,   periodUnit: 'mo', tableEvery: (n) => n <= 12 ? 1 : n <= 36 ? 3 : 6,    highThreshold: 10,  warnThreshold: 5    },
  yearly:  { label: 'Yearly',  unit: 'year',  unitPlural: 'years',  depositLabel: 'Yearly deposit',  sliderMin: 1,    sliderMax: 10000,sliderStep: 10,   periodMin: 1,   periodMax: 30,   periodStep: 1,   periodUnit: 'yr', tableEvery: (n) => 1,                                         highThreshold: 50,  warnThreshold: 20   },
};

// Cross-period equivalents for context
function toMonthlyRate(rate, mode) {
  if (mode === 'daily')   return (Math.pow(1 + rate / 100, 30) - 1) * 100;
  if (mode === 'yearly')  return (Math.pow(1 + rate / 100, 1 / 12) - 1) * 100;
  return rate;
}
function toYearlyRate(rate, mode) {
  if (mode === 'daily')   return (Math.pow(1 + rate / 100, 365) - 1) * 100;
  if (mode === 'monthly') return (Math.pow(1 + rate / 100, 12) - 1) * 100;
  return rate;
}

function CompoundingCalc({ symbol = "₹" }) {
  const [mode, setMode] = useState('monthly');
  const [capital, setCapital] = useState(10000);
  const [returnRate, setReturnRate] = useState(5);
  const [periods, setPeriods] = useState(12);
  const [deposit, setDeposit] = useState(0);

  const cfg = PERIOD_CONFIG[mode];

  // Keep sliders in range when switching mode
  const clampedRate   = Math.min(Math.max(returnRate, cfg.sliderMin), cfg.sliderMax);
  const clampedPeriods = Math.min(Math.max(periods, cfg.periodMin), cfg.periodMax);

  const rows = useMemo(() => {
    const data = [];
    let balance = capital;
    for (let p = 1; p <= clampedPeriods; p++) {
      const gain = balance * (clampedRate / 100);
      balance = balance + gain + deposit;
      data.push({ period: p, balance, gain });
    }
    return data;
  }, [capital, clampedRate, clampedPeriods, deposit]);

  const finalBalance  = rows[rows.length - 1]?.balance ?? capital;
  const totalGain     = finalBalance - capital - deposit * clampedPeriods;
  const totalDeposited = deposit * clampedPeriods;
  const totalReturn   = ((finalBalance - capital) / capital) * 100;

  const barColor = clampedRate >= cfg.warnThreshold ? '#2e7d32' : '#1565c0';

  // Equivalents
  const monthlyEq = toMonthlyRate(clampedRate, mode);
  const yearlyEq  = toYearlyRate(clampedRate, mode);

  // Milestones
  const double = rows.find(r => r.balance >= capital * 2);
  const triple = rows.find(r => r.balance >= capital * 3);

  // Sparkline
  const sparkStep = Math.max(1, Math.floor(rows.length / 40));
  const sparkSample = rows.filter((_, i) => i % sparkStep === 0 || i === rows.length - 1);
  const sparkMax = finalBalance;
  const sparkPoints = sparkSample.map((r, i, arr) => {
    const x = (i / (arr.length - 1)) * 300;
    const y = 50 - ((r.balance - capital) / (sparkMax - capital || 1)) * 45;
    return `${x},${y}`;
  }).join(' ');

  // Table rows
  const every = cfg.tableEvery(clampedPeriods);
  const tableRows = rows.filter(r => r.period % every === 0 || r.period === clampedPeriods);

  const periodLabel = clampedPeriods === 1 ? cfg.unit : cfg.unitPlural;

  return (
    <Card>
      <CardHeader icon="📈" title="Compounding Calculator" subtitle="Watch consistent returns build exponential wealth over time." />
      <div style={{ padding: '20px 22px' }}>

        {/* Period mode toggle */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          {Object.entries(PERIOD_CONFIG).map(([key, c]) => {
            const active = mode === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setMode(key);
                  // Clamp rate & periods to new mode's range
                  const nc = PERIOD_CONFIG[key];
                  setReturnRate(r => Math.min(Math.max(r, nc.sliderMin), nc.sliderMax));
                  setPeriods(p => Math.min(Math.max(p, nc.periodMin), nc.periodMax));
                }}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: '10px', cursor: 'pointer',
                  border: active ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                  background: active ? 'var(--primary)' : '#fff',
                  color: active ? '#fff' : 'var(--text)',
                  fontWeight: active ? 700 : 500, fontSize: '13px',
                  transition: 'all 0.15s',
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '12px' }}>
          <NumberInput label="Starting capital" value={capital} onChange={setCapital} prefix={symbol} min={100} step={1000} />
          <NumberInput label={cfg.depositLabel + ' (optional)'} value={deposit} onChange={setDeposit} prefix={symbol} min={0} step={100} />
        </div>

        <Slider
          label={`${cfg.label} return`}
          value={clampedRate}
          min={cfg.sliderMin}
          max={cfg.sliderMax}
          step={cfg.sliderStep}
          unit="%"
          onChange={setReturnRate}
          color={barColor}
        />

        {/* Equivalent rates context */}
        {mode !== 'monthly' || true ? (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {mode !== 'monthly' && (
              <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '10px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                ≈ <strong>{monthlyEq.toFixed(2)}%</strong>/month
              </span>
            )}
            {mode !== 'yearly' && (
              <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '10px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                ≈ <strong>{yearlyEq < 1000 ? yearlyEq.toFixed(1) : yearlyEq.toLocaleString('en-US', { maximumFractionDigits: 0 })}%</strong>/year
              </span>
            )}
            {mode !== 'daily' && (
              <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '10px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                ≈ <strong>{(toMonthlyRate(clampedRate, mode) / 30).toFixed(3)}%</strong>/day
              </span>
            )}
          </div>
        ) : null}

        <Slider
          label="Time period"
          value={clampedPeriods}
          min={cfg.periodMin}
          max={cfg.periodMax}
          step={cfg.periodStep}
          unit={` ${cfg.periodUnit}`}
          onChange={setPeriods}
          color={barColor}
        />

        {/* Sparkline */}
        {rows.length > 1 && (
          <div style={{ marginBottom: '16px', background: 'var(--bg)', borderRadius: '10px', padding: '12px', border: '1px solid var(--border)' }}>
            <svg viewBox="0 0 300 55" style={{ width: '100%', height: '60px' }}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={barColor} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={barColor} stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <polygon points={`0,50 ${sparkPoints} 300,50`} fill="url(#cg)" />
              <polyline points={sparkPoints} fill="none" stroke={barColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              <span>{cfg.unit.charAt(0).toUpperCase() + cfg.unit.slice(1)} 0 — {fmtCurrency(capital, symbol)}</span>
              <span>{cfg.unit.charAt(0).toUpperCase() + cfg.unit.slice(1)} {clampedPeriods} — {fmtCurrency(finalBalance, symbol)}</span>
            </div>
          </div>
        )}

        {/* Summary */}
        <div style={{ marginBottom: '4px' }}>
          <ResultRow label="Starting capital" value={fmtCurrency(capital, symbol)} />
          {deposit > 0 && <ResultRow label={`Total ${cfg.label.toLowerCase()} deposits`} value={fmtCurrency(totalDeposited, symbol)} />}
          <ResultRow label="Total compounding gains" value={fmtCurrency(totalGain, symbol)} color="#2e7d32" />
          <ResultRow label="Final balance" value={fmtCurrency(finalBalance, symbol)} color={barColor} large />
          <ResultRow label="Total return on starting capital" value={`+${totalReturn.toFixed(1)}%`} bold />
          {double && <ResultRow label="Account doubles at" value={`${cfg.unit.charAt(0).toUpperCase() + cfg.unit.slice(1)} ${double.period}`} muted />}
          {triple && <ResultRow label="Account triples at" value={`${cfg.unit.charAt(0).toUpperCase() + cfg.unit.slice(1)} ${triple.period}`} muted />}
        </div>

        {/* Milestone badges */}
        {(double || triple) && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            {double && (
              <div style={{ flex: 1, minWidth: '100px', background: '#e8f5e9', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#2e7d32' }}>2×</div>
                <div style={{ fontSize: '11px', color: '#388e3c', fontWeight: 600 }}>{cfg.unit.charAt(0).toUpperCase() + cfg.unit.slice(1)} {double.period}</div>
              </div>
            )}
            {triple && (
              <div style={{ flex: 1, minWidth: '100px', background: '#e3f2fd', borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#1565c0' }}>3×</div>
                <div style={{ fontSize: '11px', color: '#1976d2', fontWeight: 600 }}>{cfg.unit.charAt(0).toUpperCase() + cfg.unit.slice(1)} {triple.period}</div>
              </div>
            )}
          </div>
        )}

        {/* Growth table */}
        <div style={{ marginTop: '16px', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '52px minmax(0,1fr) minmax(0,1fr)', background: 'var(--bg)', padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{cfg.label}</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Balance</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Gain</span>
          </div>
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {tableRows.map((r, i) => (
              <div key={r.period} style={{
                display: 'grid', gridTemplateColumns: '52px minmax(0,1fr) minmax(0,1fr)',
                padding: '7px 14px',
                borderBottom: i < tableRows.length - 1 ? '1px solid var(--border)' : 'none',
                background: r.period === clampedPeriods ? '#f0fdf4' : 'transparent',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: r.period === clampedPeriods ? 700 : 400 }}>{r.period}</span>
                <span style={{ fontSize: '12px', fontWeight: r.period === clampedPeriods ? 800 : 600, color: r.period === clampedPeriods ? barColor : 'var(--text)', textAlign: 'right', wordBreak: 'break-all' }}>{fmtCurrency(r.balance, symbol)}</span>
                <span style={{ fontSize: '12px', color: '#2e7d32', textAlign: 'right', fontWeight: 600, wordBreak: 'break-all' }}>+{fmtCurrency(r.gain, symbol)}</span>
              </div>
            ))}
          </div>
        </div>

        <Verdict type={clampedRate >= cfg.highThreshold ? 'warning' : 'info'}>
          {clampedRate >= cfg.highThreshold
            ? `${clampedRate}%/${cfg.unit} is extremely aggressive (≈${yearlyEq < 1000 ? yearlyEq.toFixed(0) : yearlyEq.toLocaleString('en-US', { maximumFractionDigits: 0 })}%/year). Very few traders sustain this. If real, ${fmtCurrency(capital, symbol)} becomes ${fmtCurrency(finalBalance, symbol)} in ${clampedPeriods} ${periodLabel} — but drawdowns at this level are severe.`
            : clampedRate >= cfg.warnThreshold
            ? `${clampedRate}%/${cfg.unit} is ambitious but achievable for skilled traders. ${fmtCurrency(capital, symbol)} → ${fmtCurrency(finalBalance, symbol)} over ${clampedPeriods} ${periodLabel} (≈${monthlyEq.toFixed(1)}%/month).`
            : `${clampedRate}%/${cfg.unit} is realistic for a disciplined trader. Compounding ${fmtCurrency(capital, symbol)} gives ${fmtCurrency(finalBalance, symbol)} in ${clampedPeriods} ${periodLabel}. Consistency beats chasing high returns.`
          }
        </Verdict>
      </div>
    </Card>
  );
}

/* ─── Tab definitions ───────────────────────────────────────────────────── */

const TABS = [
  { slug: 'loss-recovery',  label: '🔻 Loss Recovery'   },
  { slug: 'leverage',       label: '⚡ Leverage'         },
  { slug: 'edge',           label: '📐 Edge'             },
  { slug: 'position-size',  label: '📏 Position Size'    },
  { slug: 'compounding',    label: '📈 Compounding'      },
];

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function ToolPage() {
  const { tool } = useParams();
  const [currencyCode, setCurrencyCode] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('tw_currency') || 'INR';
    return 'INR';
  });

  useEffect(() => {
    localStorage.setItem('tw_currency', currencyCode);
  }, [currencyCode]);

  const symbol = CURRENCIES.find(c => c.code === currencyCode)?.symbol || '₹';

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 16px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 800, color: 'var(--text)' }}>
            Trading Calculators
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
            The math every trader needs to understand before sizing a position.
          </p>
        </div>
        {/* Currency picker */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '3px', flexShrink: 0 }}>
          {CURRENCIES.map(c => (
            <button key={c.code} onClick={() => setCurrencyCode(c.code)}
              style={{
                padding: '5px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: 700,
                background: currencyCode === c.code ? 'var(--primary)' : 'transparent',
                color: currencyCode === c.code ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab nav — scrollable on mobile */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {TABS.map(tab => {
          const active = tool === tab.slug;
          return (
            <Link
              key={tab.slug}
              href={`/tools/${tab.slug}`}
              style={{
                padding: '8px 14px',
                borderRadius: '20px',
                border: active ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                background: active ? 'var(--primary)' : '#fff',
                color: active ? '#fff' : 'var(--text)',
                fontWeight: active ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {tool === 'loss-recovery' && <LossRecoveryCalc symbol={symbol} />}
      {tool === 'leverage'      && <LeverageCalc symbol={symbol} />}
      {tool === 'edge'          && <EdgeCalc symbol={symbol} />}
      {tool === 'position-size' && <PositionSizeCalc symbol={symbol} />}
      {tool === 'compounding'   && <CompoundingCalc symbol={symbol} />}
    </div>
  );
}
