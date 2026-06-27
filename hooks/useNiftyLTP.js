'use client';
import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/authFetch.js';

export function useNiftyLTP() {
  const [ltp, setLtp]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchLTP = useCallback(async () => {
    try {
      const res  = await authFetch('/api/market/nifty');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setLtp(data.ltp);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLTP();
    const interval = setInterval(fetchLTP, 30000);
    return () => clearInterval(interval);
  }, [fetchLTP]);

  return { ltp, loading, error };
}
