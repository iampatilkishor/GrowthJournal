import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';

function parseExpiry(expiry) {
  if (!expiry) return null;
  if (typeof expiry === 'number') {
    // Unix seconds (10 digits) vs milliseconds (13 digits)
    return new Date(expiry < 1e12 ? expiry * 1000 : expiry);
  }
  return new Date(expiry); // ISO string
}

export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);

    let query = db.from('profiles').select('broker_token, broker_token_expires_at');
    if (userId) {
      query = query.eq('id', userId);
    } else {
      query = query.not('broker_token', 'is', null).order('broker_token_expires_at', { ascending: false });
    }
    const { data } = await query.limit(1).single();

    if (!data?.broker_token) return NextResponse.json({ loggedIn: false });

    const expiryDate = parseExpiry(data.broker_token_expires_at);
    const loggedIn   = !expiryDate || expiryDate > new Date();
    return NextResponse.json({ loggedIn, expiresAt: data.broker_token_expires_at });
  } catch {
    return NextResponse.json({ loggedIn: false });
  }
}
