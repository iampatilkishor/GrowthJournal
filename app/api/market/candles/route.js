import { NextResponse } from 'next/server';
import { getToken } from '@/lib/upstox.js';
import { getUserId } from '@/lib/supabase-server.js';
import axios from 'axios';

const BASE_URL = 'https://api.upstox.com/v2';

function toIST(d) {
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

export async function GET(request) {
  try {
    const userId = await getUserId(request);
    const { searchParams } = new URL(request.url);
    const instrumentKey = searchParams.get('instrumentKey');
    const interval      = searchParams.get('interval') || '30minute';
    const mode          = searchParams.get('mode') || 'intraday';
    if (!instrumentKey) return NextResponse.json({ error: 'instrumentKey required' }, { status: 400 });

    const token   = await getToken(userId);
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    let candles   = [];

    if (mode === 'intraday') {
      const res = await axios.get(`${BASE_URL}/historical-candle/intraday/${encodeURIComponent(instrumentKey)}/${interval}`, { headers });
      candles = res.data?.data?.candles || [];
    } else {
      const now = new Date(), from = new Date(now);
      from.setDate(from.getDate() - 30);
      const res = await axios.get(`${BASE_URL}/historical-candle/${encodeURIComponent(instrumentKey)}/${interval}/${toIST(now)}/${toIST(from)}`, { headers });
      candles = res.data?.data?.candles || [];
    }

    return NextResponse.json({
      candles: candles.map(c => ({ time: c[0], open: c[1], high: c[2], low: c[3], close: c[4], volume: c[5] })).reverse(),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
