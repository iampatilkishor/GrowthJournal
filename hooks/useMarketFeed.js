'use client';

import { useEffect, useRef, useState } from 'react';
import { authFetch } from '@/lib/authFetch.js';

/**
 * useMarketFeed — live LTP updates via SSE from /api/market-feed.
 *
 * @param {string[]} instrumentKeys  e.g. ['NSE_INDEX|Nifty 50', 'NSE_EQ|RELIANCE']
 * @returns {{ prices: Object, connected: boolean }}
 *   prices: { [instrumentKey]: { ltp, change, change_pct } }
 */
export function useMarketFeed(instrumentKeys = []) {
  const [prices,    setPrices]    = useState({});
  const [connected, setConnected] = useState(false);
  const abortRef   = useRef(null);
  const cancelRef  = useRef(false);
  const keysStr    = instrumentKeys.join(',');

  useEffect(() => {
    if (!keysStr) return;

    cancelRef.current = false;

    async function connect() {
      // Abort any previous stream
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await authFetch(
          `/api/market-feed?keys=${encodeURIComponent(keysStr)}`,
          {
            signal:  controller.signal,
            headers: { Accept: 'text/event-stream' },
          }
        );

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}`);
        }

        setConnected(true);

        const reader  = response.body.getReader();
        const decoder = new TextDecoder();
        let   buffer  = '';

        // Read stream chunks
        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelRef.current) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE events are separated by double newlines
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';   // keep incomplete last part

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data: ')) continue;
            try {
              const msg = JSON.parse(line.slice(6));
              if (msg.type === 'tick') {
                setPrices(prev => ({ ...prev, ...msg.updates }));
              }
            } catch {}
          }
        }
      } catch (err) {
        // AbortError is expected on cleanup — don't log
        if (err?.name !== 'AbortError') {
          console.warn('[useMarketFeed] stream error:', err?.message);
        }
      }

      setConnected(false);

      // Auto-reconnect after 3 s unless the hook was unmounted
      if (!cancelRef.current) {
        await new Promise(r => setTimeout(r, 3000));
        if (!cancelRef.current) connect();
      }
    }

    connect();

    return () => {
      cancelRef.current = true;
      abortRef.current?.abort();
      setConnected(false);
    };
  }, [keysStr]); // reconnect whenever the key list changes

  return { prices, connected };
}
