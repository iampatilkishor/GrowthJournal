import axios from 'axios';
import crypto from 'crypto';
import { getAdminClient } from '../supabase-server.js';

const BASE_URL = 'https://api.kite.trade';

function getApiKey() { return process.env.ZERODHA_API_KEY; }

function authHeaders(token) {
  return { Authorization: `token ${getApiKey()}:${token}`, 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', 'X-Kite-Version': '3' };
}
function jsonHeaders(token) {
  return { Authorization: `token ${getApiKey()}:${token}`, 'Content-Type': 'application/json', Accept: 'application/json', 'X-Kite-Version': '3' };
}

function mapProduct(p) { return p === 'I' ? 'MIS' : p === 'D' ? 'CNC' : p || 'MIS'; }

function parseInstrumentToken(instrumentToken, tradingSymbol) {
  if (instrumentToken && instrumentToken.includes(':')) {
    const [exchange, ...rest] = instrumentToken.split(':');
    return { exchange, tradingsymbol: rest.join(':') || tradingSymbol };
  }
  const sym = (tradingSymbol || '').toUpperCase();
  return { exchange: /CE$|PE$|FUT$/.test(sym) ? 'NFO' : 'NSE', tradingsymbol: tradingSymbol };
}

export function getLoginUrl() {
  return `https://kite.zerodha.com/connect/login?api_key=${getApiKey()}&v=3`;
}

export async function exchangeCodeForToken(requestToken) {
  const apiKey = process.env.ZERODHA_API_KEY, apiSecret = process.env.ZERODHA_API_SECRET;
  const checksum = crypto.createHash('sha256').update(apiKey + requestToken + apiSecret).digest('hex');
  const params = new URLSearchParams({ api_key: apiKey, request_token: requestToken, checksum });
  const res = await axios.post(`${BASE_URL}/session/token`, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', 'X-Kite-Version': '3' },
  });
  return res.data.data.access_token;
}

export async function saveToken(accessToken, userId = null) {
  const db = getAdminClient(), expiry = Math.floor(Date.now() / 1000) + 86400; // Unix seconds for bigint column
  if (userId) {
    await db.from('profiles').upsert({ id: userId, broker_token: accessToken, broker_token_expires_at: expiry, broker: 'zerodha' });
  } else {
    await db.from('profiles').update({ broker_token: accessToken, broker_token_expires_at: expiry, broker: 'zerodha' }).not('broker_token', 'is', null);
  }
}

export async function getToken(userId = null) {
  const row = await getTokenRow(userId);
  if (!row) throw new Error('No Zerodha token found. Please authenticate.');
  return row.broker_token;
}

export async function getTokenRow(userId = null) {
  const db = getAdminClient();
  let q = db.from('profiles').select('broker_token, broker_token_expires_at');
  q = userId ? q.eq('id', userId) : q.not('broker_token', 'is', null).order('broker_token_expires_at', { ascending: false });
  const { data, error } = await q.limit(1).single();
  if (error || !data?.broker_token) return null;
  return { broker_token: data.broker_token, expires_at: data.broker_token_expires_at };
}

export async function getNiftyLTP(userId = null) {
  const token = await getToken(userId);
  const res = await axios.get(`${BASE_URL}/quote`, { params: { i: 'NSE:NIFTY 50' }, headers: jsonHeaders(token) });
  const key = Object.keys(res.data.data)[0];
  return res.data.data[key].last_price;
}

export async function getQuote(key, userId = null) {
  const token = await getToken(userId);
  const res = await axios.get(`${BASE_URL}/quote`, { params: { i: key }, headers: jsonHeaders(token) });
  return res.data.data;
}

export async function getWatchlistQuotes(instrumentKeys, userId = null) {
  if (!instrumentKeys?.length) return {};
  const token = await getToken(userId);
  const params = new URLSearchParams(); instrumentKeys.forEach(k => params.append('i', k));
  const res = await axios.get(`${BASE_URL}/quote?${params}`, { headers: jsonHeaders(token) });
  const result = {};
  for (const [k, v] of Object.entries(res.data.data || {})) {
    const close = v.ohlc?.close || v.last_price, change = v.net_change ?? (v.last_price - close);
    result[k] = { ltp: v.last_price, change, change_pct: close ? ((v.last_price - close) / close * 100) : 0, open: v.ohlc?.open, high: v.ohlc?.high, low: v.ohlc?.low, close };
  }
  return result;
}

export async function searchInstruments() {
  throw new Error('Instrument search unavailable for Zerodha. Download instrument CSV from https://api.kite.trade/instruments');
}

export async function getPositions(userId = null) {
  const token = await getToken(userId);
  const res = await axios.get(`${BASE_URL}/portfolio/positions`, { headers: jsonHeaders(token) });
  return res.data.data?.net || [];
}

export async function getFunds(userId = null) {
  const token = await getToken(userId);
  const res = await axios.get(`${BASE_URL}/user/margins`, { headers: jsonHeaders(token) });
  const equity = res.data.data?.equity;
  return { equity: { available_margin: equity?.available?.live_balance ?? 0, used_margin: equity?.utilised?.debits ?? 0 } };
}

export async function getUserProfile(userId = null) {
  const token = await getToken(userId);
  const res = await axios.get(`${BASE_URL}/user/profile`, { headers: jsonHeaders(token) });
  const d = res.data.data;
  return { email: d.email, user_id: d.user_id, user_name: d.user_name, broker: 'ZERODHA', exchanges: d.exchanges || [], products: d.products || [], order_types: d.order_types || [], user_type: d.user_type, is_active: true, avatar_url: d.avatar_url || null };
}

export async function placeOrder({ tradingSymbol, instrumentToken, transactionType, quantity, orderType, price = 0, triggerPrice = 0, product = 'I' }, userId = null) {
  const token = await getToken(userId);
  const { exchange, tradingsymbol } = parseInstrumentToken(instrumentToken, tradingSymbol);
  const params = new URLSearchParams({ tradingsymbol, exchange, transaction_type: transactionType, order_type: orderType, quantity: String(quantity), product: mapProduct(product), price: String(price), trigger_price: String(triggerPrice), validity: 'DAY', tag: 'TRADING_APP', disclosed_quantity: '0' });
  const res = await axios.post(`${BASE_URL}/orders/regular`, params.toString(), { headers: authHeaders(token) });
  return { order_id: res.data.data?.order_id };
}

export async function getAllOrders(userId = null) {
  const token = await getToken(userId);
  const res = await axios.get(`${BASE_URL}/orders`, { headers: jsonHeaders(token) });
  return (res.data.data || []).map(o => ({ order_id: o.order_id, status: o.status?.toLowerCase(), average_price: o.average_price || 0, filled_quantity: o.filled_quantity || 0 }));
}

export async function cancelOrder(orderId, userId = null) {
  const token = await getToken(userId);
  return (await axios.delete(`${BASE_URL}/orders/regular/${orderId}`, { headers: jsonHeaders(token) })).data;
}

export async function modifyOrder(orderId, { quantity, orderType, price = 0, triggerPrice = 0 }, userId = null) {
  const token = await getToken(userId);
  const params = new URLSearchParams({ quantity: String(quantity), order_type: orderType, price: String(price), trigger_price: String(triggerPrice), validity: 'DAY', disclosed_quantity: '0' });
  return (await axios.put(`${BASE_URL}/orders/regular/${orderId}`, params.toString(), { headers: authHeaders(token) })).data;
}
