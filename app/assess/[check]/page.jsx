'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

/* ─── Flowchart definitions ─────────────────────────────────────────────── */

const PROFITABILITY_FLOW = {
  id: 'profitability',
  title: 'Will You Become Profitable?',
  subtitle: 'Answer honestly — this is your trading reality check.',
  icon: '📈',
  steps: [
    {
      id: 'plan',
      question: 'Do you have a written trading plan with clear rules?',
      context: 'Entry criteria, exit rules, position sizing — all written down.',
      yesNext: 'risk',
      noResult: { verdict: 'NOT PROFITABLE', reason: 'No trading plan', fix: 'Create a written plan with entry/exit rules, position sizing, and max daily loss limits. Traders without a plan trade on impulse.' },
    },
    {
      id: 'risk',
      question: 'Do you risk 1–2% or less per trade?',
      context: 'A single bad trade should never wipe more than 2% of your capital.',
      yesNext: 'journal',
      noResult: { verdict: 'NOT PROFITABLE', reason: 'Poor risk management', fix: 'Fix your position sizing first. Risking too much per trade means a losing streak can destroy your account before your edge kicks in.' },
    },
    {
      id: 'journal',
      question: 'Do you journal every trade — entry, exit, and reason?',
      context: 'Every trade. No exceptions.',
      yesNext: 'review',
      noResult: { verdict: 'NOT PROFITABLE', reason: 'No trade journaling', fix: 'You cannot improve what you do not measure. Start journaling every trade with the setup, outcome, and emotional state.' },
    },
    {
      id: 'review',
      question: 'Do you review your journal at least weekly?',
      context: 'Looking for patterns — what setups work, what mistakes repeat.',
      yesNext: 'emotions',
      noResult: { verdict: 'NOT PROFITABLE', reason: 'Not reviewing trades', fix: 'A journal you never read is useless. Schedule a weekly review to identify your best setups, worst habits, and recurring mistakes.' },
    },
    {
      id: 'emotions',
      question: "Do you sit out when you're emotional, tired, or revenge trading?",
      context: 'FOMO, fear, and revenge are the biggest killers of capital.',
      yesNext: 'edge',
      noResult: { verdict: 'NOT PROFITABLE', reason: 'Emotional trading', fix: 'Emotional trades are almost always losing trades. Build a pre-trade checklist and make "no trade" the default when you are not in the right state.' },
    },
    {
      id: 'edge',
      question: 'Have you backtested your strategy over 50+ trades with a positive edge?',
      context: 'A proven edge means your win rate × avg win beats your loss rate × avg loss.',
      yesNext: 'consistent',
      noResult: { verdict: 'NOT PROFITABLE', reason: 'No proven edge', fix: 'Without backtesting, you are gambling. Test your strategy on historical data or paper trade for at least 50 trades before risking real capital.' },
    },
    {
      id: 'consistent',
      question: "Do you follow your rules consistently — even when it's hard?",
      context: 'Not just when convenient. Rule-following under pressure separates professionals.',
      yesNext: null,
      noResult: { verdict: 'NOT PROFITABLE', reason: 'Inconsistent execution', fix: 'Having rules you do not follow is the same as having no rules. Work on discipline — smaller position sizes, harder stop losses, accountability.' },
    },
  ],
  successResult: { verdict: 'PROFITABLE', message: 'You have the fundamentals. Stay consistent, keep reviewing, and compound your edge.' },
};

const PRETRADE_FLOW = {
  id: 'pre-trade',
  title: 'Are You a Disciplined Trader?',
  subtitle: 'Run this before every trade. Takes 30 seconds.',
  icon: '🎯',
  steps: [
    {
      id: 'setup',
      question: 'Is this a high-probability setup by your rules?',
      context: 'Does it meet ALL your entry criteria — not just some of them?',
      yesNext: 'rr',
      noResult: { verdict: 'NO TRADE', reason: 'Not a high-probability setup', fix: 'Only trade when ALL your criteria are met. Partial setups are not setups.' },
    },
    {
      id: 'rr',
      question: 'Is the Risk:Reward at least 1:2?',
      context: 'Your potential profit should be at least twice your maximum loss on this trade.',
      yesNext: 'plan',
      noResult: { verdict: 'WAIT', reason: 'R:R is below 1:2', fix: 'A bad R:R trade requires a very high win rate to be profitable. Wait for a better entry or a wider target.' },
    },
    {
      id: 'plan',
      question: "Does this trade align with your plan for today?",
      context: 'Is this instrument and direction in your plan? Did you plan to trade today?',
      yesNext: 'mindset',
      noResult: { verdict: 'NO TRADE', reason: "Outside today's plan", fix: 'Unplanned trades are impulse trades. If it was not in your plan this morning, it should not be in your portfolio tonight.' },
    },
    {
      id: 'mindset',
      question: 'Are you in the right mindset right now?',
      context: 'Calm, focused, not tired, not stressed about money, not desperate to make back losses.',
      yesNext: 'fomo',
      noResult: { verdict: 'WAIT', reason: 'Mindset is not right', fix: 'Step away. Take a break. The market will be there tomorrow. Trading in a bad state almost always leads to bad decisions.' },
    },
    {
      id: 'fomo',
      question: 'Are you entering because of FOMO or because the setup is genuinely valid?',
      context: 'Be brutally honest. Is the move already running and you are chasing it?',
      yesIsNegative: true,
      yesNext: null,
      noNext: null,
      yesResult: { verdict: 'NO TRADE', reason: 'This is FOMO', fix: 'You are chasing. The optimal entry has passed. FOMO trades have terrible R:R and high failure rates. Let it go.' },
      noResult: { verdict: 'EXECUTE', message: 'Setup is valid. Execute your plan with discipline — set your stop loss before entering.' },
    },
  ],
  successResult: { verdict: 'EXECUTE', message: 'Setup is valid. Execute your plan with discipline — set your stop loss before entering.' },
};

/* ─── Verdict styles ────────────────────────────────────────────────────── */

const VERDICT_STYLES = {
  PROFITABLE:       { bg: '#e8f5e9', border: '#2e7d32', color: '#1b5e20', icon: '✅' },
  'NOT PROFITABLE': { bg: '#fce4ec', border: '#c62828', color: '#b71c1c', icon: '❌' },
  EXECUTE:          { bg: '#e8f5e9', border: '#2e7d32', color: '#1b5e20', icon: '✅' },
  'NO TRADE':       { bg: '#fce4ec', border: '#c62828', color: '#b71c1c', icon: '🚫' },
  WAIT:             { bg: '#fff8e1', border: '#f57f17', color: '#e65100', icon: '⏸️' },
};

/* ─── Flowchart component ───────────────────────────────────────────────── */

function Flowchart({ flow }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);

  const currentStep = flow.steps[stepIndex];

  function answer(yes) {
    const step = flow.steps[stepIndex];

    if (step.yesIsNegative) {
      setResult(yes ? step.yesResult : flow.successResult);
      setHistory(h => [...h, { stepId: step.id, answer: yes ? 'YES' : 'NO' }]);
      return;
    }

    setHistory(h => [...h, { stepId: step.id, answer: yes ? 'YES' : 'NO' }]);

    if (!yes) { setResult(step.noResult); return; }

    const nextId = step.yesNext;
    if (!nextId) { setResult(flow.successResult); return; }
    setStepIndex(flow.steps.findIndex(s => s.id === nextId));
  }

  function reset() { setStepIndex(0); setHistory([]); setResult(null); }

  const vstyle = result ? (VERDICT_STYLES[result.verdict] || {}) : {};
  const totalSteps = flow.steps.length;
  const progress = result ? 100 : Math.round((stepIndex / totalSteps) * 100);
  const progressColor = result
    ? (result.verdict === 'NOT PROFITABLE' || result.verdict === 'NO TRADE' ? '#c62828'
       : result.verdict === 'WAIT' ? '#f57f17' : '#2e7d32')
    : 'var(--primary)';

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontSize: '24px' }}>{flow.icon}</span>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>{flow.title}</h1>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{flow.subtitle}</p>
        <div style={{ marginTop: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {result ? 'Complete' : `Question ${stepIndex + 1} of ${totalSteps}`}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{progress}%</span>
          </div>
          <div style={{ height: '4px', background: '#e0e0e0', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '2px', transition: 'width 0.3s ease', width: `${progress}%`, background: progressColor }} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '24px' }}>
        {!result ? (
          <>
            {history.length > 0 && (
              <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {history.map((h, i) => (
                  <span key={i} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, background: h.answer === 'YES' ? '#e8f5e9' : '#fce4ec', color: h.answer === 'YES' ? '#2e7d32' : '#c62828' }}>
                    Q{i + 1}: {h.answer}
                  </span>
                ))}
              </div>
            )}

            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.45 }}>{currentStep.question}</p>
              {currentStep.context && <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{currentStep.context}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button onClick={() => answer(true)} style={{ padding: '14px', borderRadius: '10px', border: '2px solid #2e7d32', background: '#e8f5e9', color: '#1b5e20', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                ✓ YES
              </button>
              <button onClick={() => answer(false)} style={{ padding: '14px', borderRadius: '10px', border: '2px solid #c62828', background: '#fce4ec', color: '#b71c1c', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                ✕ NO
              </button>
            </div>
          </>
        ) : (
          <div>
            <div style={{ background: vstyle.bg, border: `2px solid ${vstyle.border}`, borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>{vstyle.icon}</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: vstyle.color, letterSpacing: '0.5px', marginBottom: result.reason ? '6px' : 0 }}>{result.verdict}</div>
              {result.reason && <div style={{ fontSize: '14px', color: vstyle.color, fontWeight: 600, opacity: 0.85 }}>Reason: {result.reason}</div>}
            </div>

            {result.fix && (
              <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#e65100', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔧 What to fix</div>
                <p style={{ margin: 0, fontSize: '14px', color: '#424242', lineHeight: 1.6 }}>{result.fix}</p>
              </div>
            )}
            {result.message && !result.fix && (
              <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#2e7d32', lineHeight: 1.6 }}>{result.message}</p>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your answers</div>
              {history.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, minWidth: '36px', textAlign: 'center', background: h.answer === 'YES' ? '#e8f5e9' : '#fce4ec', color: h.answer === 'YES' ? '#2e7d32' : '#c62828' }}>{h.answer}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text)' }}>{flow.steps[i].question}</span>
                </div>
              ))}
            </div>

            <button onClick={reset} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)', background: '#fff', color: 'var(--text)', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
              ↺ Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Tab definitions ───────────────────────────────────────────────────── */

const TABS = [
  { slug: 'profitability', label: '📈 Profitability Check' },
  { slug: 'pre-trade',     label: '🎯 Pre-Trade Check'     },
];

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function AssessCheckPage() {
  const { check } = useParams();

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 16px 80px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 800, color: 'var(--text)' }}>
          Readiness Check
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
          Two tools to keep you honest before you trade.
        </p>
      </div>

      {/* Tab nav */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '4px' }}>
        {TABS.map(tab => {
          const active = check === tab.slug;
          return (
            <Link
              key={tab.slug}
              href={`/assess/${tab.slug}`}
              style={{
                padding: '10px 8px',
                borderRadius: '9px',
                border: 'none',
                background: active ? '#fff' : 'transparent',
                boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: active ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'none',
                textAlign: 'center',
                transition: 'all 0.15s',
                display: 'block',
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {check === 'profitability' && <Flowchart key="profitability" flow={PROFITABILITY_FLOW} />}
      {check === 'pre-trade'     && <Flowchart key="pre-trade"     flow={PRETRADE_FLOW} />}
    </div>
  );
}
