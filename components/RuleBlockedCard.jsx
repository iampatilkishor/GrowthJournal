'use client';

export default function RuleBlockedCard({ reason, allViolations = [] }) {
  return (
    <div
      style={{
        borderLeft: '4px solid var(--sell)',
        background: '#fff5f5',
        borderRadius: 'var(--radius)',
        padding: '16px 20px',
        marginTop: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>🚫</span>
        <strong style={{ color: 'var(--sell)', fontSize: '16px' }}>Order Blocked</strong>
      </div>
      <p style={{ fontWeight: 600, color: '#333', marginBottom: '10px' }}>{reason}</p>
      {allViolations.length > 1 && (
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', fontSize: '14px' }}>
          {allViolations.map((v, i) => (
            <li key={i} style={{ marginBottom: '4px' }}>{v}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
