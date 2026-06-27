'use client';

export default function StatCard({ label, value, color, subtext }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={color ? { color } : {}}>
        {value ?? '—'}
      </div>
      {subtext && <div className="stat-subtext">{subtext}</div>}
    </div>
  );
}
