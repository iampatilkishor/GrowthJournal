'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const INTERVALS = [
  { label: '1m',  value: '1minute',  mode: 'intraday' },
  { label: '5m',  value: '5minute',  mode: 'intraday' },
  { label: '15m', value: '15minute', mode: 'intraday' },
  { label: '30m', value: '30minute', mode: 'intraday' },
  { label: '1h',  value: '60minute', mode: 'intraday' },
  { label: '1D',  value: 'day',      mode: 'historical' },
];

function drawChart(canvas, candles) {
  if (!canvas || !candles.length) return;
  const ctx   = canvas.getContext('2d');
  const W     = canvas.width;
  const H     = canvas.height;
  const PAD   = { top: 20, right: 60, bottom: 40, left: 10 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top  - PAD.bottom;

  ctx.clearRect(0, 0, W, H);

  // background
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);

  const highs  = candles.map(c => c.high);
  const lows   = candles.map(c => c.low);
  const maxVal = Math.max(...highs);
  const minVal = Math.min(...lows);
  const range  = maxVal - minVal || 1;

  function toY(v) { return PAD.top + chartH - ((v - minVal) / range) * chartH; }

  const candleW  = Math.max(1, Math.floor(chartW / candles.length) - 1);
  const halfBody = Math.max(1, Math.floor(candleW / 2));

  // grid lines
  const steps = 5;
  ctx.strokeStyle = '#1e2530';
  ctx.lineWidth   = 1;
  ctx.setLineDash([4, 4]);
  for (let i = 0; i <= steps; i++) {
    const v = minVal + (range * i) / steps;
    const y = toY(v);
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(W - PAD.right, y);
    ctx.stroke();

    // price labels
    ctx.fillStyle   = '#6b7280';
    ctx.font        = '10px monospace';
    ctx.textAlign   = 'left';
    ctx.fillText(v.toFixed(v >= 100 ? 1 : 2), W - PAD.right + 4, y + 3);
  }
  ctx.setLineDash([]);

  // candles
  candles.forEach((c, i) => {
    const x      = PAD.left + i * (chartW / candles.length) + halfBody;
    const isUp   = c.close >= c.open;
    const color  = isUp ? '#26a69a' : '#ef5350';
    const bodyT  = toY(Math.max(c.open, c.close));
    const bodyB  = toY(Math.min(c.open, c.close));
    const bodyH  = Math.max(1, bodyB - bodyT);

    // wick
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(x, toY(c.high));
    ctx.lineTo(x, toY(c.low));
    ctx.stroke();

    // body
    ctx.fillStyle = color;
    ctx.fillRect(x - halfBody + 1, bodyT, Math.max(1, candleW - 1), bodyH);
  });

  // x-axis time labels (show ~6 labels)
  ctx.fillStyle = '#6b7280';
  ctx.font      = '9px monospace';
  ctx.textAlign = 'center';
  const step = Math.ceil(candles.length / 6);
  candles.forEach((c, i) => {
    if (i % step !== 0) return;
    const x   = PAD.left + i * (chartW / candles.length) + halfBody;
    const d   = new Date(c.time);
    const lbl = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    ctx.fillText(lbl, x, H - PAD.bottom + 14);
  });
}

export default function ChartModal({ item, onClose }) {
  const canvasRef                 = useRef(null);
  const [candles, setCandles]     = useState([]);
  const [interval, setIntervalV]  = useState(INTERVALS[3]); // 30m default
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [hovered, setHovered]     = useState(null); // { open, high, low, close, time }

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        instrumentKey: item.instrument_token,
        interval:      interval.value,
        mode:          interval.mode,
      });
      const res  = await fetch(`/api/market/candles?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setCandles(data.candles || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [item.instrument_token, interval]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!loading && candles.length) drawChart(canvasRef.current, candles);
  }, [loading, candles]);

  // resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      if (candles.length) drawChart(canvas, candles);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [candles]);

  function handleMouseMove(e) {
    const canvas = canvasRef.current;
    if (!canvas || !candles.length) return;
    const rect   = canvas.getBoundingClientRect();
    const x      = e.clientX - rect.left;
    const PAD_L  = 10;
    const chartW = canvas.width - PAD_L - 60;
    const idx    = Math.floor(((x - PAD_L) / chartW) * candles.length);
    if (idx >= 0 && idx < candles.length) setHovered(candles[idx]);
  }

  const ltp = item.ltp;
  const isUp = (item.change ?? 0) >= 0;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 950, padding: '16px' }}>
      <div style={{ background: '#0d1117', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e2530', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <span style={{ color: '#e6edf3', fontWeight: 800, fontSize: '16px' }}>{item.symbol}</span>
              <span style={{ fontSize: '11px', color: '#6b7280', background: '#1e2530', padding: '2px 8px', borderRadius: '4px' }}>{item.exchange}</span>
            </div>
            {ltp != null && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
                <span style={{ color: '#e6edf3', fontWeight: 700, fontSize: '20px' }}>₹{ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                {item.change != null && (
                  <span style={{ fontSize: '13px', fontWeight: 600, color: isUp ? '#26a69a' : '#ef5350' }}>
                    {isUp ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)} ({Math.abs(item.change_pct ?? 0).toFixed(2)}%)
                  </span>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: '#1e2530', border: 'none', color: '#6b7280', fontSize: '18px', cursor: 'pointer', borderRadius: '8px', padding: '6px 10px', lineHeight: 1 }}>✕</button>
        </div>

        {/* Interval selector */}
        <div style={{ padding: '10px 18px', borderBottom: '1px solid #1e2530', display: 'flex', gap: '6px', alignItems: 'center' }}>
          {INTERVALS.map(iv => (
            <button key={iv.value} onClick={() => setIntervalV(iv)} style={{
              padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              border: 'none',
              background: interval.value === iv.value ? '#26a69a' : '#1e2530',
              color:      interval.value === iv.value ? '#fff'     : '#6b7280',
            }}>{iv.label}</button>
          ))}
          <button onClick={load} style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: '#1e2530', border: 'none', color: '#6b7280', cursor: 'pointer' }}>↻</button>
        </div>

        {/* Hover info bar */}
        {hovered && (
          <div style={{ padding: '6px 18px', background: '#161b22', display: 'flex', gap: '16px', fontSize: '11px', fontFamily: 'monospace' }}>
            {[['O', hovered.open], ['H', hovered.high], ['L', hovered.low], ['C', hovered.close]].map(([lbl, val]) => (
              <span key={lbl} style={{ color: '#6b7280' }}>
                {lbl}: <span style={{ color: '#e6edf3' }}>{val?.toFixed(2)}</span>
              </span>
            ))}
            <span style={{ color: '#6b7280', marginLeft: 'auto' }}>
              {new Date(hovered.time).toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Chart */}
        <div style={{ flex: 1, minHeight: '300px', position: 'relative' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHovered(null)}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '14px' }}>
              Loading chart…
            </div>
          )}
          {error && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ef5350', gap: '10px' }}>
              <div>{error}</div>
              <button onClick={load} style={{ padding: '6px 16px', background: '#1e2530', border: 'none', color: '#6b7280', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Retry</button>
            </div>
          )}
          {!loading && !error && candles.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '14px' }}>
              No candle data available for this interval
            </div>
          )}
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      </div>
    </div>
  );
}
