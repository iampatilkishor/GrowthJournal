import { getUserId } from '@/lib/supabase-server.js';
import { getToken } from '@/lib/brokers/upstox.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  // Auth
  const userId = await getUserId(request);
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Keys from query
  const { searchParams } = new URL(request.url);
  const keys = searchParams.get('keys')?.split(',').filter(Boolean) ?? [];
  if (!keys.length) {
    return new Response('No keys', { status: 400 });
  }

  // Broker token
  let token;
  try {
    token = await getToken(userId);
  } catch {
    return new Response('No broker token', { status: 403 });
  }

  const encoder = new TextEncoder();
  const signal  = request.signal;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) => {
        if (signal.aborted) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      // Send a heartbeat immediately so the browser knows the stream is alive
      send({ type: 'connected', keys });

      while (!signal.aborted) {
        try {
          const res = await fetch(
            `https://api.upstox.com/v2/market-quote/ltp?instrument_key=${encodeURIComponent(keys.join(','))}`,
            {
              headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
              signal: AbortSignal.timeout(3000),
            }
          );

          if (res.status === 401) break; // token expired — stop, client will retry

          if (res.ok) {
            const json = await res.json();
            const updates = {};
            for (const [k, v] of Object.entries(json.data || {})) {
              // Normalise separator — store with | to match instrument_token column
              updates[k.replace(':', '|')] = {
                ltp:        v.last_price,
                change:     v.net_change ?? 0,
                change_pct: v.net_change_percentage ?? 0,
              };
            }
            if (Object.keys(updates).length) {
              send({ type: 'tick', updates });
            }
          }
        } catch {
          // timeout or network blip — just skip this tick
        }

        // Wait 1 second before next poll
        await new Promise((r) => {
          const t = setTimeout(r, 1000);
          signal.addEventListener('abort', () => { clearTimeout(t); r(); }, { once: true });
        });
      }

      try { controller.close(); } catch {}
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':     'text/event-stream',
      'Cache-Control':    'no-cache, no-transform',
      'Connection':       'keep-alive',
      'X-Accel-Buffering':'no',   // disable nginx buffering
    },
  });
}
