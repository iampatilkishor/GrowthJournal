'use client';

import { authFetch } from '@/lib/authFetch.js';
import { useState, useEffect, useRef, useCallback } from 'react';

// Exchange display mapping
const EXCHANGE_LABELS = {
  NSE_FO: 'NFO', BSE_FO: 'BFO', NSE_EQ: 'NSE', BSE_EQ: 'BSE',
  MCX_FO: 'MCX', NSE_INDEX: 'IDX', BSE_INDEX: 'IDX',
  NFO: 'NFO', BFO: 'BFO', NSE: 'NSE', BSE: 'BSE', MCX: 'MCX',
};

// Ordinal suffix
function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// Build human-readable instrument label
function buildDisplayName(item) {
  const type = item.instrument_type;
  const isOption = type === 'CE' || type === 'PE';
  const isFut = type === 'FUT';

  if ((isOption || isFut) && item.expiry) {
    const d = new Date(item.expiry);
    const day = d.getUTCDate();
    const month = d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' }).toUpperCase();
    const baseName = item.name || item.symbol;

    const isWeekly = isOption && day < 25;

    if (isWeekly) {
      return `${baseName} ${day}${ordinal(day)} ${month} ${item.strike_price} ${type}`;
    }
    if (isOption) {
      return `${baseName} ${month} ${item.strike_price} ${type}`;
    }
    if (isFut) {
      return `${baseName} ${month} FUT`;
    }
  }
  return item.symbol;
}

// Weekly sub-label e.g. "07 JUL WEEKLY"
function weeklyLabel(item) {
  const type = item.instrument_type;
  if ((type !== 'CE' && type !== 'PE') || !item.expiry) return null;
  const d = new Date(item.expiry);
  const day = d.getUTCDate();
  if (day >= 25) return null;
  const month = d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  return `${String(day).padStart(2,'0')} ${month} WEEKLY`;
}

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function InstrumentSearch({
  onSelect,
  placeholder = 'Search instrument… e.g. NIFTY, RELIANCE',
  disabled,
  existingKeys = [],
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [notAvailable, setNotAvailable] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);

  const fetchResults = useCallback(async (q) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`/api/instruments/search?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.status === 501) { setNotAvailable(true); setResults([]); setOpen(false); return; }
      setResults(data.results || []);
      setOpen(true);
      setHighlightIdx(-1);
    } catch {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResults(debouncedQuery); }, [debouncedQuery, fetchResults]);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(item) {
    onSelect({
      symbol: item.symbol,
      instrumentKey: item.instrument_key,
      exchange: item.exchange,
      lotSize: item.lot_size,
      instrumentType: item.instrument_type,
      name: item.name,
      displayName: buildDisplayName(item),
    });
    setQuery('');
    setOpen(false);
    setResults([]);
  }

  function handleKeyDown(e) {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && highlightIdx >= 0) { e.preventDefault(); handleSelect(results[highlightIdx]); }
    else if (e.key === 'Escape') setOpen(false);
  }

  function handleClear() {
    setQuery(''); setResults([]); setOpen(false); setError('');
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          className="form-input"
          value={query}
          onChange={e => { setQuery(e.target.value); setNotAvailable(false); }}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          style={{ paddingRight: '60px' }}
        />
        <div style={{
          position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          {loading && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>⏳</span>}
          {query && !loading && (
            <button type="button" onClick={handleClear} tabIndex={-1} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#bbb', fontSize: '14px', padding: '2px', lineHeight: 1,
            }}>✕</button>
          )}
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>🔍</span>
        </div>
      </div>

      {/* Hints */}
      {notAvailable && (
        <div style={{
          marginTop: '6px', padding: '10px 12px', background: '#fff3e0',
          border: '1px solid #ffcc02', borderRadius: '8px', fontSize: '12px', color: '#e65100',
        }}>
          ⚠️ Instrument search not available for Zerodha via API. Enter the token manually from the{' '}
          <a href="https://api.kite.trade/instruments" target="_blank" rel="noreferrer"
            style={{ color: '#e65100', fontWeight: 600 }}>instruments CSV</a>.
        </div>
      )}
      {error && <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--sell)' }}>{error}</div>}
      {query.length === 1 && (
        <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Type at least 2 characters to search
        </div>
      )}

      {/* Results dropdown */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 500, maxHeight: '360px', overflowY: 'auto',
        }}>
          {results.map((item, idx) => {
            const isHighlighted = idx === highlightIdx;
            const isAdded = existingKeys.includes(item.instrument_key);
            const exchLabel = EXCHANGE_LABELS[item.exchange] || item.exchange;
            const displayName = buildDisplayName(item);
            const wLabel = weeklyLabel(item);

            return (
              <div
                key={item.instrument_key}
                onClick={() => !isAdded && handleSelect(item)}
                onMouseEnter={() => setHighlightIdx(idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 14px',
                  cursor: isAdded ? 'default' : 'pointer',
                  background: isHighlighted && !isAdded ? '#f5f7ff' : '#fff',
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.1s',
                }}
              >
                {/* Exchange badge */}
                <span style={{
                  flexShrink: 0,
                  display: 'inline-block',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  background: '#f0f0f0',
                  color: '#555',
                  letterSpacing: '0.3px',
                  minWidth: '32px',
                  textAlign: 'center',
                }}>
                  {exchLabel}
                </span>

                {/* Name + sub-label */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                      {displayName}
                    </span>
                    {wLabel && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '16px', height: '16px', borderRadius: '50%',
                        background: '#3b5bdb', color: '#fff',
                        fontSize: '9px', fontWeight: 800, flexShrink: 0,
                      }}>W</span>
                    )}
                  </div>
                  {wLabel && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {wLabel}
                    </div>
                  )}
                </div>

                {/* Add / Already added button */}
                {isAdded ? (
                  <div style={{
                    flexShrink: 0,
                    width: '32px', height: '32px',
                    borderRadius: '6px',
                    background: 'var(--buy)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '16px',
                  }}>✓</div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSelect(item); }}
                    style={{
                      flexShrink: 0,
                      width: '32px', height: '32px',
                      borderRadius: '6px',
                      border: '2px solid var(--primary)',
                      background: 'transparent',
                      color: 'var(--primary)',
                      fontSize: '18px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', lineHeight: 1,
                    }}
                  >+</button>
                )}
              </div>
            );
          })}

          <div style={{
            padding: '6px 14px', fontSize: '11px', color: 'var(--text-muted)',
            background: '#fafafa', borderTop: '1px solid var(--border)', textAlign: 'right',
          }}>
            {results.length} result{results.length !== 1 ? 's' : ''} · ↑↓ navigate · Enter select
          </div>
        </div>
      )}

      {/* No results */}
      {open && !loading && results.length === 0 && query.length >= 2 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '16px', textAlign: 'center',
          fontSize: '13px', color: 'var(--text-muted)', zIndex: 500,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }}>
          No instruments found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
