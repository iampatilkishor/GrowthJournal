import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';
import { getWatchlistQuotes } from '@/lib/upstox.js';

export async function GET(request) {
  const db     = getAdminClient();
  const userId = await getUserId(request);
  const { data: items } = await db.from('watchlist').select('id, symbol, instrument_token, exchange').eq('user_id', userId);
  const tokens = (items || []).map(i => i.instrument_token);

  let quotes = {}, quotesError = null;
  try { quotes = await getWatchlistQuotes(tokens, userId); } catch (e) { quotesError = e.message; }

  return NextResponse.json({ storedTokens: tokens, quoteKeys: Object.keys(quotes), quotesError, items, rawQuotes: quotes });
}
