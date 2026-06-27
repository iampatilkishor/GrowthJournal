'use client';

const ACTION_LABELS = {
  buy_ce: 'BUY CE',
  buy_pe: 'BUY PE',
  sell_ce: 'SELL CE',
  sell_pe: 'SELL PE',
};

export default function ScenarioMatchBanner({ scenario, niftyLevel, onDismiss }) {
  if (!scenario) return null;

  return (
    <div
      style={{
        background: '#e8f5e9',
        border: '1px solid #a5d6a7',
        borderRadius: 'var(--radius)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '20px' }}>📋</span>
        <div>
          <strong style={{ color: '#1b5e20', fontSize: '15px' }}>
            Scenario Matched at Nifty {niftyLevel?.toLocaleString('en-IN')}
          </strong>
          <div style={{ color: '#2e7d32', fontSize: '14px', marginTop: '4px' }}>
            Action: <strong>{ACTION_LABELS[scenario.action] || scenario.action}</strong> &nbsp;|&nbsp;
            Instrument: <strong>{scenario.instrument}</strong> &nbsp;|&nbsp;
            Max Qty: <strong>{scenario.max_quantity}</strong>
          </div>
          {scenario.entry_reason && (
            <div style={{ color: '#555', fontSize: '13px', marginTop: '2px' }}>
              Reason: {scenario.entry_reason}
            </div>
          )}
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            color: '#2e7d32',
            flexShrink: 0,
          }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
