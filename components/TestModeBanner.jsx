'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch } from '@/lib/authFetch.js';

export default function TestModeBanner() {
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    authFetch('/api/user-settings')
      .then(r => r.json())
      .then(d => setTestMode(!!d.settings?.test_mode))
      .catch(() => {});
  }, []);

  if (!testMode) return null;

  return (
    <div style={{
      background: '#fef3c7',
      borderBottom: '2px solid #f59e0b',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>🧪</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
          Test Mode is ON — trades are not counted in your real stats
        </span>
      </div>
      <Link href="/profile" style={{ fontSize: 12, fontWeight: 700, color: '#b45309', textDecoration: 'none', whiteSpace: 'nowrap' }}>
        Turn off →
      </Link>
    </div>
  );
}
