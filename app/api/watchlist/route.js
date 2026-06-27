import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';
import { getWatchlistQuotes, getPositions } from '@/lib/upstox.js';

function extractParts(str) {
  const u = str.toUpperCase().replace(/\s+/g, '');
  return {
    underlying: u.match(/^([A-Z]+)/)?.[1] || '',
    strike:     u.match(/(\d{3,6})/)?.[1]  || '',
    type:       u.match(/(CE|PE|FUT)/)?.[1] || '',
  };
}

function findQuote(quotes, item) {
  const exactKey = item.instrument_token;
  const colonKey = exactKey.replace('|', ':');
  if (quotes[exactKey]) return quotes[exactKey];
  if (quotes[colonKey]) return quotes[colonKey];
  const byNorm = Object.fromEntries(Object.entries(quotes).map(([k, v]) => [k.toLowerCase(), v]));
  if (byNorm[exactKey.toLowerCase()]) return byNorm[exactKey.toLowerCase()];
  const { underlying, strike, type } = extractParts(item.symbol);
  if (underlying && strike && type) {
    const match = Object.entries(quotes).find(([k]) => {
      const ku = k.toUpperCase();
      return ku.includes(underlying) && ku.includes(strike) && ku.includes(type);
    });
    if (match) return match[1];
  }
  return null;
}

export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: items } = await db.from('watchlist')
      .select('*').eq('user_id', userId)
      .order('sort_order', { ascending: true }).order('created_at', { ascending: true });

    if (!items || items.length === 0) return NextResponse.json({ items: [] });

    let quotes = {}, positions = [];
    try { quotes    = await getWatchlistQuotes(items.map(i => i.instrument_token), userId); } catch {}
    try { positions = await getPositions(userId); } catch {}

    const posMap = {};
    for (const p of positions) {
      const sym = (p.trading_symbol || p.tradingsymbol || '').toUpperCase();
      if (sym) posMap[sym] = p;
    }

    const enriched = items.map(item => {
      const quote = findQuote(quotes, item);
      const pos   = posMap[item.symbol.toUpperCase()] || null;
      return {
        ...item,
        ltp:        quote?.ltp        ?? null,
        change:     quote?.change     ?? null,
        change_pct: quote?.change_pct ?? null,
        ohlc: quote ? { open: quote.open, high: quote.high, low: quote.low, close: quote.close } : null,
        position: pos ? {
          quantity:      pos.quantity      ?? pos.net_quantity ?? 0,
          average_price: pos.average_price ?? pos.buy_price   ?? 0,
          pnl:           pos.pnl           ?? pos.unrealised  ?? null,
          product:       pos.product,
        } : null,
      };
    });

    return NextResponse.json({ items: enriched });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { symbol, instrumentToken, exchange = 'NSE', maxQuantity = 25, notes = '', planId = null } = body;
    if (!symbol || !instrumentToken) return NextResponse.json({ error: 'symbol and instrumentToken are required' }, { status: 400 });

    const { data: existing } = await db.from('watchlist').select('id').eq('instrument_token', instrumentToken).eq('user_id', userId).single();
    if (existing) return NextResponse.json({ error: 'Instrument already in watchlist' }, { status: 409 });

    const { data: maxRow } = await db.from('watchlist').select('sort_order').eq('user_id', userId).order('sort_order', { ascending: false }).limit(1).single();
    const sortOrder = (maxRow?.sort_order ?? -1) + 1;

    const { data: item } = await db.from('watchlist').insert({
      user_id: userId,
      symbol: symbol.toUpperCase(), instrument_token: instrumentToken.trim(),
      exchange: exchange.toUpperCase(), max_quantity: Number(maxQuantity),
      notes, plan_id: planId || null, sort_order: sortOrder,
    }).select().single();

    return NextResponse.json({ success: true, id: item.id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
