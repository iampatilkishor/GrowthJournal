import axios from 'axios';
import { getAdminClient } from '../supabase-server.js';

const BASE_URL = 'https://api.upstox.com/v2';

/* ─── Token storage via Supabase profiles ───────────────────────────────── */

export function getLoginUrl() {
  const clientId   = process.env.UPSTOX_API_KEY;
  const redirectUri = encodeURIComponent(process.env.UPSTOX_REDIRECT_URI);
  return `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
}

export async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    code,
    client_id:     process.env.UPSTOX_API_KEY,
    client_secret: process.env.UPSTOX_API_SECRET,
    redirect_uri:  process.env.UPSTOX_REDIRECT_URI,
    grant_type:    'authorization_code',
  });
  const res = await axios.post(
    `${BASE_URL}/login/authorization/token`,
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' } }
  );
  return res.data.access_token;
}

export async function saveToken(accessToken, userId = null) {
  const db     = getAdminClient();
  const expiry = Math.floor(Date.now() / 1000) + 86400; // Unix seconds for bigint column
  if (userId) {
    await db.from('profiles').upsert({
      id: userId, broker_token: accessToken,
      broker_token_expires_at: expiry, broker: 'upstox',
    });
  } else {
    await db.from('profiles')
      .update({ broker_token: accessToken, broker_token_expires_at: expiry, broker: 'upstox' })
      .not('broker_token', 'is', null);
  }
}

export async function getTokenRow(userId = null) {
  const db = getAdminClient();
  let query = db.from('profiles').select('broker_token, broker_token_expires_at');
  if (userId) {
    query = query.eq('id', userId);
  } else {
    query = query.not('broker_token', 'is', null).order('broker_token_expires_at', { ascending: false });
  }
  const { data, error } = await query.limit(1).single();
  if (error || !data?.broker_token) return null;
  const expiry = data.broker_token_expires_at;
  if (expiry) {
    const d = typeof expiry === 'number'
      ? new Date(expiry < 1e12 ? expiry * 1000 : expiry)
      : new Date(expiry);
    if (d <= new Date()) return null; // expired
  }
  return { broker_token: data.broker_token, expires_at: expiry };
}

export async function getToken(userId = null) {
  const row = await getTokenRow(userId);
  if (!row) throw new Error('No Upstox token found. Please authenticate via /profile.');
  return row.broker_token;
}

/* ─── Auth helpers ─────────────────────────────────────────────────────── */

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/* ─── Market data ──────────────────────────────────────────────────────── */

export async function getNiftyLTP(userId = null) {
  const token = await getToken(userId);
  const res = await axios.get(`${BASE_URL}/market-quote/quotes`, {
    params: { instrument_key: 'NSE_INDEX|Nifty 50' },
    headers: authHeaders(token),
  });
  const data = res.data.data;
  const key  = Object.keys(data)[0];
  return data[key].last_price;
}

export async function getPositions(userId = null) {
  const token = await getToken(userId);
  const res = await axios.get(`${BASE_URL}/portfolio/short-term-positions`, {
    headers: authHeaders(token),
  });
  return res.data.data || [];
}

export async function getFunds(userId = null) {
  const token = await getToken(userId);
  const res = await axios.get(`${BASE_URL}/user/get-funds-and-margin`, {
    params: { segment: 'SEC' },
    headers: authHeaders(token),
  });
  return res.data.data;
}

export async function getQuote(key, userId = null) {
  const token = await getToken(userId);
  const res = await axios.get(`${BASE_URL}/market-quote/quotes`, {
    params: { instrument_key: key },
    headers: authHeaders(token),
  });
  return res.data.data;
}

export async function getWatchlistQuotes(instrumentKeys, userId = null) {
  if (!instrumentKeys || instrumentKeys.length === 0) return {};
  const token = await getToken(userId);
  const res = await axios.get(`${BASE_URL}/market-quote/quotes`, {
    params: { instrument_key: instrumentKeys.join(',') },
    headers: authHeaders(token),
  });
  const raw    = res.data.data || {};
  const result = {};
  for (const [key, val] of Object.entries(raw)) {
    const close = val.ohlc?.close || val.last_price;
    const change = val.net_change ?? (val.last_price - close);
    const quote  = {
      ltp:        val.last_price,
      change,
      change_pct: close ? (((val.last_price - close) / close) * 100) : 0,
      open:  val.ohlc?.open,
      high:  val.ohlc?.high,
      low:   val.ohlc?.low,
      close,
    };
    result[key]                   = quote;
    result[key.replace(':', '|')] = quote;
    result[key.replace('|', ':')] = quote;
  }
  return result;
}

export async function searchInstruments(query, userId = null) {
  const token = await getToken(userId);
  const res = await axios.get(`${BASE_URL}/instruments/search`, {
    params: { query },
    headers: authHeaders(token),
  });
  const raw = res.data.data || [];
  return raw.map(item => ({
    instrument_key:  item.instrument_key,
    symbol:          item.trading_symbol || item.tradingsymbol || '',
    name:            item.name || item.short_name || '',
    exchange:        item.exchange || '',
    instrument_type: item.instrument_type || '',
    expiry:          item.expiry || null,
    strike_price:    item.strike_price ?? null,
    lot_size:        item.lot_size ?? null,
    tick_size:       item.tick_size ?? null,
  }));
}

export async function getUserProfile(userId = null) {
  const token = await getToken(userId);
  const res = await axios.get(`${BASE_URL}/user/profile`, { headers: authHeaders(token) });
  return res.data.data;
}

/* ─── Order management ─────────────────────────────────────────────────── */

export async function placeOrder({
  tradingSymbol, instrumentToken, transactionType, quantity,
  orderType, price = 0, triggerPrice = 0, product = 'I',
}, userId = null) {
  const token = await getToken(userId);
  const body  = {
    quantity, product, validity: 'DAY', price,
    tag: 'TRADING_APP', instrument_token: instrumentToken,
    order_type: orderType, transaction_type: transactionType,
    disclosed_quantity: 0, trigger_price: triggerPrice, is_amo: false,
  };
  const res = await axios.post(`${BASE_URL}/order/place`, body, { headers: authHeaders(token) });
  return res.data.data;
}

export async function getAllOrders(userId = null) {
  const token = await getToken(userId);
  const res = await axios.get(`${BASE_URL}/order/retrieve-all`, { headers: authHeaders(token) });
  return res.data.data || [];
}

export async function cancelOrder(orderId, userId = null) {
  const token = await getToken(userId);
  const res = await axios.delete(`${BASE_URL}/order/cancel`, {
    params: { order_id: orderId },
    headers: authHeaders(token),
  });
  return res.data;
}

export async function modifyOrder(upstoxOrderId, { quantity, orderType, price = 0, triggerPrice = 0 }, userId = null) {
  const token = await getToken(userId);
  const body  = {
    order_id:           upstoxOrderId,
    quantity,
    order_type:         orderType,
    price,
    trigger_price:      triggerPrice,
    validity:           'DAY',
    disclosed_quantity: 0,
  };
  const res = await axios.put(`${BASE_URL}/order/modify`, body, { headers: authHeaders(token) });
  return res.data.data;
}
