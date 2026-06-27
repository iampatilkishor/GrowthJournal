'use client';
import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/authFetch.js';

export function useTodayOrders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res  = await authFetch('/api/orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  return { orders, loading, refetch };
}
