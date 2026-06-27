/**
 * Broker Adapter
 *
 * Set BROKER=upstox (default) or BROKER=zerodha in your .env.local.
 * All API routes import from this file — the right broker is loaded automatically.
 */

import * as upstox from './brokers/upstox.js';
import * as kite from './brokers/kite.js';

function getBroker() {
  const b = (process.env.BROKER || 'upstox').toLowerCase();
  if (b === 'zerodha' || b === 'kite') return kite;
  return upstox;
}

const broker = getBroker();

export const getLoginUrl         = broker.getLoginUrl;
export const exchangeCodeForToken = broker.exchangeCodeForToken;
export const saveToken           = broker.saveToken;
export const getToken            = broker.getToken;
export const getTokenRow         = broker.getTokenRow;
export const getNiftyLTP         = broker.getNiftyLTP;
export const getPositions        = broker.getPositions;
export const placeOrder          = broker.placeOrder;
export const getAllOrders         = broker.getAllOrders;
export const cancelOrder         = broker.cancelOrder;
export const getFunds            = broker.getFunds;
export const getQuote            = broker.getQuote;
export const getWatchlistQuotes  = broker.getWatchlistQuotes;
export const searchInstruments   = broker.searchInstruments;
export const getUserProfile      = broker.getUserProfile;
export const modifyOrder = broker.modifyOrder;
