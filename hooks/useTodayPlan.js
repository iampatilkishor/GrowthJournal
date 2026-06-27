'use client';
import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/authFetch.js';

export function useTodayPlan() {
  const [plan, setPlan]       = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch('/api/plans/today');
      const data = await res.json();
      setPlan(data.plan || null);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);
  return { plan, loading, refetch };
}
