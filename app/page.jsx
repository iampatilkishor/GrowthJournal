"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthGate.jsx";
import UpgradeModal from "@/components/UpgradeModal.jsx";

/* ── PPP pricing regions ─────────────────────────────────────────────────── */
const REGIONS = {
  IN: {
    sym: "₹",
    founding: "₹999",
    quarterly: "₹499",
    yearly: "₹1,499",
    label: "India",
  },
  US: {
    sym: "$",
    founding: "$19",
    quarterly: "$9",
    yearly: "$29",
    label: "United States",
  },
  GB: {
    sym: "£",
    founding: "£16",
    quarterly: "£7",
    yearly: "£24",
    label: "United Kingdom",
  },
  EU: {
    sym: "€",
    founding: "€17",
    quarterly: "€8",
    yearly: "€25",
    label: "Europe",
  },
  AU: {
    sym: "A$",
    founding: "A$29",
    quarterly: "A$13",
    yearly: "A$39",
    label: "Australia",
  },
  SG: {
    sym: "S$",
    founding: "S$25",
    quarterly: "S$11",
    yearly: "S$34",
    label: "Singapore",
  },
  DEFAULT: {
    sym: "$",
    founding: "$15",
    quarterly: "$7",
    yearly: "$20",
    label: "Global",
  },
};
const EU_COUNTRIES = [
  "DE",
  "FR",
  "IT",
  "ES",
  "NL",
  "BE",
  "AT",
  "PT",
  "FI",
  "IE",
  "GR",
  "PL",
  "CZ",
  "RO",
  "HU",
  "SK",
  "BG",
  "HR",
  "SI",
  "EE",
  "LV",
  "LT",
  "LU",
  "MT",
  "CY",
  "DK",
  "SE",
];
function getRegion(country) {
  if (!country) return REGIONS.DEFAULT;
  if (REGIONS[country]) return REGIONS[country];
  if (EU_COUNTRIES.includes(country)) return REGIONS.EU;
  return REGIONS.DEFAULT;
}

export default function LandingPage() {
  const { tier } = useAuth();
  const isLoggedIn = tier !== "guest";
  const [billing, setBilling] = useState("annual");
  const [menuOpen, setMenuOpen] = useState(false);
  const [region, setRegion] = useState(REGIONS.IN); // default India
  const [upgradeModal, setUpgradeModal] = useState(null); // null | 'founding' | 'pro'

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((d) => setRegion(getRegion(d.country_code)))
      .catch(() => {}); // silently fall back to default
  }, []);

  return (
    <>
      {upgradeModal && (
        <UpgradeModal
          plan={upgradeModal}
          onClose={() => setUpgradeModal(null)}
        />
      )}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #060911;
          --surface: #0d1220;
          --border: rgba(255,255,255,0.07);
          --green: #00d97e;
          --green-dim: rgba(0,217,126,0.1);
          --purple: #7c4dff;
          --purple-dim: rgba(124,77,255,0.12);
          --text: #e8eaf2;
          --muted: rgba(232,234,242,0.45);
          --card: rgba(255,255,255,0.04);
        }

        body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

        .w { max-width: 1160px; margin: 0 auto; padding: 0 24px; }

        /* ─ NAV ─ */
        .nav {
          position: sticky; top: 0; z-index: 200;
          background: rgba(6,9,17,0.85); backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .nav-i {
          max-width: 1160px; margin: 0 auto; padding: 0 24px;
          height: 62px; display: flex; align-items: center; gap: 4px;
        }
        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; margin-right: auto; flex-shrink: 0;
        }
        .nav-logo-mark {
          width: 32px; height: 32px; border-radius: 8px;
          background: var(--green); display: flex; align-items: center;
          justify-content: center; font-size: 16px; flex-shrink: 0;
        }
        .nav-logo-name { font-size: 17px; font-weight: 900; color: var(--text); letter-spacing: -0.3px; }
        .nl { text-decoration: none; font-size: 14px; font-weight: 600; color: var(--muted); padding: 8px 14px; border-radius: 8px; transition: color 0.15s; white-space: nowrap; }
        .nl:hover { color: var(--text); }
        .nc {
          text-decoration: none; font-size: 14px; font-weight: 700;
          color: #000; background: var(--green); padding: 9px 22px;
          border-radius: 22px; white-space: nowrap; transition: opacity 0.15s; margin-left: 8px;
        }
        .nc:hover { opacity: 0.85; }
        .nav-burger { display: none; background: none; border: 1px solid var(--border); cursor: pointer; font-size: 18px; padding: 6px 10px; color: var(--text); border-radius: 8px; line-height: 1; }
        .nav-drawer { overflow: hidden; max-height: 0; transition: max-height 0.3s ease; background: var(--surface); border-bottom: 1px solid var(--border); }
        .nav-drawer.open { max-height: 300px; }
        .nav-drawer a { display: block; padding: 14px 24px; font-size: 15px; font-weight: 600; color: var(--muted); text-decoration: none; border-bottom: 1px solid var(--border); }
        .nav-drawer a:last-child { border-bottom: none; }
        .nav-drawer a.nc { margin: 10px 16px 12px; border-radius: 12px; text-align: center; border: none; color: #000; display: block; }
        @media (max-width: 640px) {
          .nl, .nc { display: none; }
          .nav-burger { display: block; }
        }

        /* ─ HERO ─ */
        .hero {
          background: var(--bg); min-height: 95vh;
          display: flex; align-items: center; position: relative; overflow: hidden;
        }
        .hero-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(0,217,126,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,217,126,0.03) 1px, transparent 1px);
          background-size: 56px 56px;
        }
        .hero-glow-l {
          position: absolute; top: -20%; left: -5%; width: 50%; height: 80%;
          background: radial-gradient(ellipse, rgba(124,77,255,0.15) 0%, transparent 65%);
          pointer-events: none;
        }
        .hero-glow-r {
          position: absolute; bottom: -20%; right: -5%; width: 50%; height: 80%;
          background: radial-gradient(ellipse, rgba(0,217,126,0.1) 0%, transparent 65%);
          pointer-events: none;
        }
        .hero-inner {
          max-width: 1160px; margin: 0 auto; padding: 80px 24px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center;
          position: relative; z-index: 1; width: 100%;
        }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          border: 1px solid rgba(0,217,126,0.3); background: rgba(0,217,126,0.06);
          color: var(--green); font-size: 11px; font-weight: 700; letter-spacing: 2px;
          text-transform: uppercase; padding: 6px 16px; border-radius: 20px; margin-bottom: 24px;
        }
        .hero-h1 {
          font-size: clamp(44px, 5.5vw, 76px); font-weight: 900; color: var(--text);
          line-height: 1.0; margin: 0 0 28px; letter-spacing: -2.5px;
        }
        .hero-h1 .line-accent {
          color: var(--green);
        }
        .hero-sub {
          font-size: 18px; color: var(--muted); line-height: 1.75; margin: 0 0 44px;
          max-width: 460px; font-weight: 400;
        }
        .hero-btns { display: flex; gap: 14px; flex-wrap: wrap; }
        .btn-primary {
          padding: 16px 32px; border-radius: 12px; font-weight: 800; font-size: 15px;
          text-decoration: none; color: #000; background: var(--green);
          transition: transform 0.15s, opacity 0.15s;
        }
        .btn-primary:hover { transform: translateY(-2px); opacity: 0.9; }
        .btn-ghost {
          padding: 16px 28px; border-radius: 12px; font-weight: 700; font-size: 15px;
          text-decoration: none; color: var(--text); border: 1px solid var(--border);
          background: var(--card); transition: border-color 0.15s, transform 0.15s;
        }
        .btn-ghost:hover { border-color: rgba(255,255,255,0.2); transform: translateY(-2px); }

        /* Hero card */
        .hero-card {
          background: var(--surface); border-radius: 20px;
          border: 1px solid var(--border);
          box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,217,126,0.08);
          overflow: hidden;
        }
        .hc-bar {
          background: rgba(255,255,255,0.03); padding: 12px 18px;
          display: flex; align-items: center; gap: 6px;
          border-bottom: 1px solid var(--border);
        }
        .hc-dot { width: 10px; height: 10px; border-radius: 50%; }
        .hc-title { margin-left: 8px; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.25); }
        .hc-body { padding: 22px; }
        .hc-date { font-size: 11px; color: rgba(255,255,255,0.25); font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 18px; }
        .hc-kpi { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
        .hc-k { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 14px; }
        .hc-k-l { font-size: 10px; color: var(--muted); font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 6px; }
        .hc-k-v { font-size: 20px; font-weight: 900; }
        .hc-trades { display: flex; flex-direction: column; gap: 8px; }
        .hc-trade {
          display: flex; align-items: center; gap: 10px;
          background: var(--card); border-radius: 10px; padding: 10px 14px;
          border: 1px solid var(--border);
        }
        .hc-tag { font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
        .hc-tag.b { background: rgba(0,217,126,0.12); color: var(--green); }
        .hc-tag.s { background: rgba(239,83,80,0.12); color: #ef9a9a; }
        .hc-inst { font-size: 13px; font-weight: 700; color: var(--text); flex: 1; }
        .hc-pnl { font-size: 14px; font-weight: 900; }
        .hc-pnl.pos { color: var(--green); }
        .hc-pnl.neg { color: #ef5350; }
        .hc-bar-bottom {
          margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .hc-pill { font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 8px; }

        @media (max-width: 880px) {
          .hero-inner { grid-template-columns: 1fr; gap: 48px; padding: 64px 24px; min-height: auto; }
          .hero { min-height: auto; }
          .hero-card { display: none; }
        }

        /* ─ MARQUEE ─ */
        .marquee-wrap {
          background: var(--green); overflow: hidden;
          padding: 12px 0; border-top: none; border-bottom: none;
        }
        .marquee-track {
          display: flex; gap: 0; white-space: nowrap;
          width: max-content;
        }
        .marquee-track span {
          font-size: 12px; font-weight: 800; color: #000; letter-spacing: 3px;
          text-transform: uppercase; padding: 0 32px;
        }
        .marquee-track span.dot { padding: 0; opacity: 0.4; }

        /* ─ PROBLEM ─ */
        .problem { background: var(--bg); padding: 100px 24px; }
        .section-tag { font-size: 11px; font-weight: 800; color: var(--green); letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 16px; }
        .section-h2 { font-size: clamp(28px, 4vw, 52px); font-weight: 900; color: var(--text); line-height: 1.1; letter-spacing: -1.5px; }
        .section-h2 em { font-style: normal; color: var(--green); }
        .section-sub { font-size: 17px; color: var(--muted); line-height: 1.75; max-width: 560px; margin-top: 16px; }
        .prob-g { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; margin-top: 60px; background: var(--border); border-radius: 20px; overflow: hidden; }
        .prob-c { background: var(--surface); padding: 40px 32px; }
        .prob-pct { font-size: 56px; font-weight: 900; line-height: 1; letter-spacing: -2px; margin-bottom: 12px; }
        .prob-ttl { font-size: 17px; font-weight: 800; color: var(--text); margin-bottom: 10px; }
        .prob-desc { font-size: 14px; color: var(--muted); line-height: 1.7; }
        @media (max-width: 760px) { .prob-g { grid-template-columns: 1fr; } }

        /* ─ HOW IT WORKS ─ */
        .how { background: var(--surface); padding: 100px 24px; }
        .how-g { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; margin-top: 64px; }
        .how-step {
          padding: 36px 28px; border-right: 1px solid var(--border);
          position: relative;
        }
        .how-step:last-child { border-right: none; }
        .how-n {
          font-size: 11px; font-weight: 800; color: var(--green); letter-spacing: 2px;
          text-transform: uppercase; margin-bottom: 20px;
          display: flex; align-items: center; gap: 12px;
        }
        .how-n::after { content: ''; flex: 1; height: 1px; background: var(--border); }
        .how-ic { font-size: 32px; margin-bottom: 16px; display: block; }
        .how-t { font-size: 18px; font-weight: 900; color: var(--text); margin-bottom: 12px; letter-spacing: -0.3px; }
        .how-d { font-size: 14px; color: var(--muted); line-height: 1.7; }
        @media (max-width: 760px) {
          .how-g { grid-template-columns: 1fr 1fr; }
          .how-step { border-right: none; border-bottom: 1px solid var(--border); }
          .how-step:last-child { border-bottom: none; }
        }
        @media (max-width: 480px) { .how-g { grid-template-columns: 1fr; } }

        /* ─ FEATURES ─ */
        .features { background: var(--bg); padding: 100px 24px; }
        .feat-g { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; margin-top: 64px; background: var(--border); border-radius: 20px; overflow: hidden; }
        .feat-c { background: var(--surface); padding: 32px 26px; transition: background 0.2s; }
        .feat-c:hover { background: rgba(255,255,255,0.06); }
        .feat-ico { font-size: 28px; margin-bottom: 16px; display: block; }
        .feat-t { font-size: 15px; font-weight: 800; color: var(--text); margin-bottom: 8px; }
        .feat-d { font-size: 13px; color: var(--muted); line-height: 1.65; }
        @media (max-width: 900px) { .feat-g { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .feat-g { grid-template-columns: 1fr; } }

        /* ─ DASHBOARD PREVIEW ─ */
        .preview { background: var(--surface); padding: 100px 24px; overflow: hidden; }
        .preview-inner { max-width: 1160px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1.4fr; gap: 72px; align-items: center; }
        .preview-screen {
          background: var(--bg); border-radius: 16px;
          border: 1px solid var(--border); overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5);
        }
        .ps-bar { background: rgba(255,255,255,0.03); padding: 10px 16px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid var(--border); }
        .ps-dot { width: 9px; height: 9px; border-radius: 50%; }
        .ps-body { padding: 20px; }
        .ps-head { font-size: 11px; color: var(--muted); font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 14px; }
        .ps-chart { display: flex; align-items: flex-end; gap: 6px; height: 80px; margin-bottom: 16px; }
        .ps-bar-el { border-radius: 4px 4px 0 0; flex: 1; min-width: 0; }
        .ps-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .ps-stat { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
        .ps-stat-v { font-size: 17px; font-weight: 900; color: var(--text); }
        .ps-stat-l { font-size: 10px; color: var(--muted); margin-top: 3px; font-weight: 600; }
        .preview-copy .section-sub { max-width: 100%; }
        .preview-list { margin-top: 28px; display: flex; flex-direction: column; gap: 16px; }
        .preview-item { display: flex; gap: 16px; align-items: flex-start; }
        .preview-item-dot { width: 8px; height: 8px; background: var(--green); border-radius: 50%; flex-shrink: 0; margin-top: 6px; }
        .preview-item-text { font-size: 15px; color: var(--muted); line-height: 1.6; }
        .preview-item-text strong { color: var(--text); }
        @media (max-width: 860px) { .preview-inner { grid-template-columns: 1fr; } .preview-screen { order: -1; } }

        /* ─ PRICING ─ */
        .pricing { background: #fff; padding: 100px 24px; }
        .pricing .section-tag { color: #5e35b1; }
        .pricing .section-h2 { color: #0d0d1a; }
        .pricing .section-h2 em { color: #5e35b1; }
        .pricing .section-sub { color: #666; }
        .price-toggle-wrap { display: flex; justify-content: center; margin-top: 32px; }
        .price-toggle { display: inline-flex; background: #f1f1f6; border-radius: 40px; padding: 4px; gap: 4px; }
        .pt-btn { padding: 8px 24px; border-radius: 36px; font-size: 14px; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; background: transparent; color: #888; }
        .pt-btn.active { background: #fff; color: #1a237e; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
        .price-g { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 48px; max-width: 1040px; margin-left: auto; margin-right: auto; }
        .price-c { border-radius: 24px; padding: 36px; border: 1.5px solid #e5e7eb; background: #fff; position: relative; overflow: hidden; display: flex; flex-direction: column; }
        .price-c.hl { background: linear-gradient(160deg, #1a237e 0%, #4a148c 100%); border-color: transparent; box-shadow: 0 16px 56px rgba(26,35,126,0.3); }
        .price-c.founder { background: linear-gradient(160deg, #0d4f2e 0%, #065f46 100%); border-color: transparent; box-shadow: 0 16px 56px rgba(6,95,70,0.35); }
        .price-ico { width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 20px; }
        .price-name { font-size: 20px; font-weight: 900; margin-bottom: 6px; }
        .price-amt { display: flex; align-items: flex-end; gap: 4px; margin-bottom: 4px; }
        .price-rs { font-size: 38px; font-weight: 900; line-height: 1; }
        .price-per { font-size: 14px; font-weight: 600; padding-bottom: 5px; opacity: 0.55; }
        .price-orig { font-size: 13px; margin-bottom: 24px; min-height: 20px; }
        .price-list { list-style: none; padding: 0; margin: 0 0 32px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
        .price-item { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; line-height: 1.5; }
        .price-chk { font-size: 13px; font-weight: 800; flex-shrink: 0; margin-top: 1px; }
        .price-btn-el { display: block; text-align: center; padding: 15px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 15px; transition: transform 0.15s, opacity 0.15s; cursor: pointer; border: none; width: 100%; }
        .price-btn-el:hover { transform: translateY(-1px); opacity: 0.9; }
        .price-tag { position: absolute; top: 22px; right: -30px; color:#fff; font-size:11px; font-weight:800; padding:4px 40px; letter-spacing:0.5px; text-transform:uppercase; }
        .price-tag.limited { background: linear-gradient(135deg,#ff6f00,#ff8f00); transform:rotate(35deg); box-shadow:0 2px 8px rgba(255,111,0,0.4); }
        .price-ppp { display:inline-flex; align-items:center; gap:6px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:20px; padding:5px 12px; font-size:12px; color:#166534; font-weight:700; margin-bottom:24px; }
        @media (max-width: 860px) { .price-g { grid-template-columns: 1fr; max-width: 440px; } }
        @media (max-width: 480px) { .price-c { padding: 24px; } }

        /* ─ CTA ─ */
        .final-cta {
          background: var(--bg); padding: 120px 24px; text-align: center;
          position: relative; overflow: hidden;
        }
        .final-cta-glow {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          width: 80%; height: 80%;
          background: radial-gradient(ellipse, rgba(0,217,126,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .cta-h2 { font-size: clamp(36px, 5vw, 64px); font-weight: 900; color: var(--text); line-height: 1.05; letter-spacing: -2px; margin-bottom: 20px; position: relative; z-index: 1; }
        .cta-h2 em { font-style: normal; color: var(--green); }
        .cta-sub { font-size: 18px; color: var(--muted); line-height: 1.7; max-width: 480px; margin: 0 auto 48px; position: relative; z-index: 1; }
        .cta-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; position: relative; z-index: 1; }

        /* ─ DISCIPLINE CHALLENGE ─ */
        .disc { background: var(--bg); padding: 100px 24px; position: relative; overflow: hidden; }
        .disc-glow {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          width: 70%; height: 70%;
          background: radial-gradient(ellipse, rgba(124,77,255,0.12) 0%, transparent 60%);
          pointer-events: none;
        }
        .disc-inner { max-width: 1160px; margin: 0 auto; position: relative; z-index: 1; }
        .disc-hero { text-align: center; margin-bottom: 72px; }
        .disc-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, rgba(124,77,255,0.15), rgba(0,217,126,0.1));
          border: 1px solid rgba(124,77,255,0.35); color: #b39ddb;
          font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;
          padding: 6px 18px; border-radius: 20px; margin-bottom: 24px;
        }
        .disc-h2 { font-size: clamp(30px, 4.5vw, 58px); font-weight: 900; color: var(--text); letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 20px; }
        .disc-h2 em { font-style: normal; background: linear-gradient(135deg, var(--purple), var(--green)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .disc-sub { font-size: 17px; color: var(--muted); line-height: 1.75; max-width: 560px; margin: 0 auto 0; }
        .disc-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); border-radius: 20px; overflow: hidden; margin-bottom: 48px; }
        .disc-step { background: var(--surface); padding: 36px 28px; position: relative; }
        .disc-step-n { font-size: 11px; font-weight: 800; color: var(--purple); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .disc-step-n::after { content: ''; flex: 1; height: 1px; background: var(--border); }
        .disc-step-ico { font-size: 32px; margin-bottom: 14px; display: block; }
        .disc-step-t { font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 10px; }
        .disc-step-d { font-size: 13px; color: var(--muted); line-height: 1.65; }
        .disc-earn { background: linear-gradient(135deg, rgba(124,77,255,0.12), rgba(0,217,126,0.08)); border: 1px solid rgba(124,77,255,0.2); border-radius: 20px; padding: 48px 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
        .disc-earn-h { font-size: clamp(22px, 3vw, 36px); font-weight: 900; color: var(--text); letter-spacing: -1px; line-height: 1.15; margin-bottom: 16px; }
        .disc-earn-h em { font-style: normal; color: var(--green); }
        .disc-earn-d { font-size: 15px; color: var(--muted); line-height: 1.75; }
        .disc-earn-stats { display: flex; flex-direction: column; gap: 16px; }
        .disc-stat { background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 16px; padding: 22px 24px; display: flex; align-items: center; gap: 18px; }
        .disc-stat-val { font-size: 32px; font-weight: 900; color: var(--green); line-height: 1; flex-shrink: 0; }
        .disc-stat-label { font-size: 13px; color: var(--muted); line-height: 1.55; }
        .disc-stat-label strong { color: var(--text); display: block; font-size: 15px; margin-bottom: 3px; }
        @media (max-width: 860px) { .disc-steps { grid-template-columns: 1fr 1fr; } .disc-earn { grid-template-columns: 1fr; } }
        @media (max-width: 480px) { .disc-steps { grid-template-columns: 1fr; } .disc-earn { padding: 28px 22px; } }

        /* ─ MENTOR ─ */
        .mentor { background: var(--surface); padding: 100px 24px; }
        .mentor-inner { max-width: 1160px; margin: 0 auto; }
        .mentor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; margin-top: 64px; }
        .mentor-cards { display: flex; flex-direction: column; gap: 16px; }
        .mentor-flow { display: flex; flex-direction: column; gap: 24px; }
        .mf-item { display: flex; gap: 20px; align-items: flex-start; }
        .mf-num { width: 40px; height: 40px; border-radius: 12px; background: var(--green-dim); border: 1px solid rgba(0,217,126,0.2); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900; color: var(--green); flex-shrink: 0; }
        .mf-title { font-size: 15px; font-weight: 800; color: var(--text); margin-bottom: 5px; }
        .mf-desc { font-size: 13px; color: var(--muted); line-height: 1.65; }
        @media (max-width: 860px) { .mentor-grid { grid-template-columns: 1fr; gap: 48px; } }

        /* ─ COMING SOON ─ */
        .roadmap { background: var(--bg); padding: 100px 24px; }
        .roadmap-inner { max-width: 1160px; margin: 0 auto; }
        .roadmap-g { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 56px; }
        .rm-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 28px; position: relative; overflow: hidden; }
        .rm-card.active { border-color: rgba(0,217,126,0.3); }
        .rm-card.soon { opacity: 0.7; }
        .rm-badge { display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 4px 10px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 16px; }
        .rm-badge.live { background: rgba(0,217,126,0.12); color: var(--green); }
        .rm-badge.building { background: rgba(255,167,38,0.12); color: #ffa726; }
        .rm-badge.planned { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); }
        .rm-ico { font-size: 30px; display: block; margin-bottom: 14px; }
        .rm-title { font-size: 17px; font-weight: 900; color: var(--text); margin-bottom: 8px; }
        .rm-desc { font-size: 13px; color: var(--muted); line-height: 1.65; }
        .rm-glow { position: absolute; top: -40px; right: -40px; width: 120px; height: 120px; border-radius: 50%; background: rgba(0,217,126,0.06); pointer-events: none; }
        @media (max-width: 860px) { .roadmap-g { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .roadmap-g { grid-template-columns: 1fr; } }

        /* ─ FOOTER ─ */
        .foot { background: var(--surface); border-top: 1px solid var(--border); padding: 40px 24px; }
        .foot-i { max-width: 1160px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
        .foot-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .foot-logo-mark { width: 28px; height: 28px; border-radius: 7px; background: var(--green); display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .foot-logo-name { font-size: 15px; font-weight: 900; color: var(--text); }
        .foot-links { display: flex; gap: 24px; flex-wrap: wrap; }
        .fl { font-size: 13px; color: var(--muted); text-decoration: none; transition: color 0.15s; }
        .fl:hover { color: var(--text); }
        .foot-copy { font-size: 12px; color: rgba(255,255,255,0.2); }
      `}</style>

      {/* ── NAV ── */}
      <header className="nav">
        <div className="nav-i">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-mark">📈</div>
            <span className="nav-logo-name">GrowthNotes</span>
          </Link>
          <Link href="#how" className="nl">
            How it works
          </Link>
          <Link href="#features" className="nl">
            Features
          </Link>
          <Link href="#discipline" className="nl">
            Challenge
          </Link>
          <Link href="#mentors" className="nl">
            Mentors
          </Link>
          <Link href="#pricing" className="nl">
            Pricing
          </Link>
          <Link href="/guide" className="nl">
            User Guide
          </Link>
          {isLoggedIn ? (
            <Link href="/dashboard" className="nc">
              Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/login" className="nl">
                Log In
              </Link>
              <Link href="/login" className="nc">
                Start Free →
              </Link>
            </>
          )}
          <button
            className="nav-burger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
        <nav className={`nav-drawer${menuOpen ? " open" : ""}`}>
          <a href="#how" onClick={() => setMenuOpen(false)}>
            How it works
          </a>
          <a href="#features" onClick={() => setMenuOpen(false)}>
            Features
          </a>
          <a href="#discipline" onClick={() => setMenuOpen(false)}>
            Challenge
          </a>
          <a href="#mentors" onClick={() => setMenuOpen(false)}>
            Mentors
          </a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>
            Pricing
          </a>
          <Link href="/guide" onClick={() => setMenuOpen(false)}>
            User Guide
          </Link>
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="nc"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                Log In
              </Link>
              <Link
                href="/login"
                className="nc"
                onClick={() => setMenuOpen(false)}
              >
                Start Free →
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-glow-l" />
        <div className="hero-glow-r" />
        <div className="hero-inner">
          <div>
            <div className="hero-eyebrow">
              ✦ Trading Journal & Discipline System
            </div>
            <h1 className="hero-h1">
              Stop trading
              <br />
              on gut.
              <br />
              <span className="line-accent">
                Start trading
                <br />
                on system.
              </span>
            </h1>
            <p className="hero-sub">
              Plan before the open. Log every entry. Reflect every evening.
              GrowthNotes gives traders a repeatable structure to stop losing to
              themselves — wherever they trade in the world.
            </p>
            <div className="hero-btns">
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard" className="btn-primary">
                    Go to Dashboard →
                  </Link>
                  <Link href="/journal" className="btn-ghost">
                    Today's Journal
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-primary">
                    Start Free →
                  </Link>
                  <Link href="/tools/loss-recovery" className="btn-ghost">
                    Try Calculators
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right: Journal card */}
          <div className="hero-card">
            <div className="hc-bar">
              <div className="hc-dot" style={{ background: "#ef5350" }} />
              <div className="hc-dot" style={{ background: "#ffa726" }} />
              <div className="hc-dot" style={{ background: "#66bb6a" }} />
              <span className="hc-title">GrowthNotes — Today's Journal</span>
            </div>
            <div className="hc-body">
              <div className="hc-date">Friday · 27 June 2025</div>
              <div className="hc-kpi">
                <div className="hc-k">
                  <div className="hc-k-l">Net P&L</div>
                  <div className="hc-k-v" style={{ color: "var(--green)" }}>
                    +$1,840
                  </div>
                </div>
                <div className="hc-k">
                  <div className="hc-k-l">Win Rate</div>
                  <div className="hc-k-v" style={{ color: "var(--text)" }}>
                    75%
                  </div>
                </div>
                <div className="hc-k">
                  <div className="hc-k-l">Plan Followed</div>
                  <div className="hc-k-v" style={{ color: "var(--green)" }}>
                    Yes ✓
                  </div>
                </div>
                <div className="hc-k">
                  <div className="hc-k-l">Trades</div>
                  <div className="hc-k-v" style={{ color: "var(--text)" }}>
                    4
                  </div>
                </div>
              </div>
              <div className="hc-trades">
                {[
                  {
                    tag: "b",
                    inst: "ES · S&P 500 Futures",
                    pnl: "+$920",
                    pos: true,
                  },
                  { tag: "b", inst: "AAPL · Calls", pnl: "+$640", pos: true },
                  { tag: "s", inst: "TSLA · Puts", pnl: "-$280", pos: false },
                  {
                    tag: "b",
                    inst: "NQ · Nasdaq Futures",
                    pnl: "+$560",
                    pos: true,
                  },
                ].map((t) => (
                  <div key={t.inst} className="hc-trade">
                    <span className={`hc-tag ${t.tag}`}>
                      {t.tag === "b" ? "LONG" : "SHORT"}
                    </span>
                    <span className="hc-inst">{t.inst}</span>
                    <span className={`hc-pnl ${t.pos ? "pos" : "neg"}`}>
                      {t.pnl}
                    </span>
                  </div>
                ))}
              </div>
              <div className="hc-bar-bottom">
                <span
                  className="hc-pill"
                  style={{
                    background: "var(--green-dim)",
                    color: "var(--green)",
                  }}
                >
                  Bias correct ✓
                </span>
                <span
                  className="hc-pill"
                  style={{ background: "var(--purple-dim)", color: "#a78bfa" }}
                >
                  All rules followed
                </span>
                <span
                  className="hc-pill"
                  style={{ background: "var(--card)", color: "var(--muted)" }}
                >
                  Day 62
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i}>
              <span>PLAN</span>
              <span className="dot"> · </span>
              <span>TRADE</span>
              <span className="dot"> · </span>
              <span>REFLECT</span>
              <span className="dot"> · </span>
              <span>REVIEW</span>
              <span className="dot"> · </span>
              <span>REPEAT</span>
              <span className="dot"> · </span>
              <span>GROW</span>
              <span className="dot"> · </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── PROBLEM ── */}
      <section className="problem">
        <div className="w">
          <div className="section-tag">The hard truth</div>
          <h2 className="section-h2">
            90% of retail traders lose.
            <br />
            <em>The reason is always the same.</em>
          </h2>
          <p className="section-sub">
            It's not the market. It's not bad luck. It's the absence of a system
            — no plan, no log, no review.
          </p>
          <div className="prob-g">
            <div className="prob-c">
              <div className="prob-pct" style={{ color: "#ef5350" }}>
                72%
              </div>
              <div className="prob-ttl">Trade without a written plan</div>
              <p className="prob-desc">
                They decide entry and exit in the moment — which means emotion,
                not edge, drives every trade.
              </p>
            </div>
            <div className="prob-c">
              <div className="prob-pct" style={{ color: "#ffa726" }}>
                85%
              </div>
              <div className="prob-ttl">Never journal their trades</div>
              <p className="prob-desc">
                No journal means no pattern recognition. Every mistake is a
                first mistake. The loop never breaks.
              </p>
            </div>
            <div className="prob-c">
              <div className="prob-pct" style={{ color: "var(--green)" }}>
                3×
              </div>
              <div className="prob-ttl">Better results with weekly review</div>
              <p className="prob-desc">
                Traders who review their week — win rate, plan adherence,
                psychology — compound their edge faster than anyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how" id="how">
        <div className="w">
          <div className="section-tag">The daily routine</div>
          <h2 className="section-h2">
            Four habits.
            <br />
            <em>One compound edge.</em>
          </h2>
          <div className="how-g">
            {[
              {
                n: "01",
                ic: "🌅",
                t: "Pre-Market Plan",
                d: "Set your bias, key levels, max loss for the day, and IF/THEN scenarios before the market opens. Every morning.",
              },
              {
                n: "02",
                ic: "⚡",
                t: "Trade Log",
                d: "Log every trade with instrument, entry, exit, P&L, emotion and plan adherence. 30 seconds per entry.",
              },
              {
                n: "03",
                ic: "📝",
                t: "Post-Market Reflection",
                d: "What went well? Biggest mistake? Tomorrow's focus. 5 minutes that compound over months.",
              },
              {
                n: "04",
                ic: "📅",
                t: "Weekly Review",
                d: "Rate your week, record your capital, spot patterns, set next week's intention. Sunday. Done.",
              },
            ].map((h) => (
              <div key={h.n} className="how-step">
                <div className="how-n">{h.n}</div>
                <span className="how-ic">{h.ic}</span>
                <div className="how-t">{h.t}</div>
                <p className="how-d">{h.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features" id="features">
        <div className="w">
          <div className="section-tag">Everything included</div>
          <h2 className="section-h2">
            All the tools a<br />
            <em>disciplined trader needs.</em>
          </h2>
          <div className="feat-g">
            {[
              {
                ic: "🌅",
                t: "Daily Journal",
                d: "Pre-market plan + trade log + reflection — the full trading day captured in one place.",
              },
              {
                ic: "📋",
                t: "Trade Log",
                d: "Log every trade: instrument, entry, exit, SL, target, emotion, net P&L.",
              },
              {
                ic: "🏆",
                t: "Growth Meter",
                d: "Set your capital goal. Track daily progress with milestone markers and streak counter.",
              },
              {
                ic: "📅",
                t: "Weekly Review",
                d: "Rate your week, record capital, spot your patterns, set next week's focus.",
              },
              {
                ic: "📌",
                t: "Trading Rules",
                d: "Your system — entry, risk, psychology, exit — always visible and always editable.",
              },
              {
                ic: "🗂️",
                t: "Pre-Market Planner",
                d: "Build IF/THEN scenarios before the open. Never decide in the heat of the moment.",
              },
              {
                ic: "🧮",
                t: "Calculators",
                d: "Position size, R:R, compounding, leverage — the math that keeps accounts alive.",
              },
              {
                ic: "📊",
                t: "Analytics",
                d: "P&L charts, win rate by instrument, day-of-week heatmap, psychology correlation.",
              },
            ].map((f) => (
              <div key={f.t} className="feat-c">
                <span className="feat-ico">{f.ic}</span>
                <div className="feat-t">{f.t}</div>
                <p className="feat-d">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANALYTICS PREVIEW ── */}
      <section className="preview">
        <div className="preview-inner w">
          <div className="preview-copy">
            <div className="section-tag">Analytics</div>
            <h2 className="section-h2">
              Your edge
              <br />
              <em>in the data.</em>
            </h2>
            <p className="section-sub">
              Every trade you log becomes a data point. GrowthNotes surfaces
              patterns you'd never see manually.
            </p>
            <div className="preview-list">
              {[
                {
                  t: "P&L calendar heatmap",
                  d: "See exactly which days and weeks you perform best.",
                },
                {
                  t: "Win rate by instrument",
                  d: "Know where your actual edge lives — stop guessing.",
                },
                {
                  t: "Psychology correlation",
                  d: "Does emotion hurt your returns? The data will tell you.",
                },
                {
                  t: "Plan discipline tracking",
                  d: "The single most predictive metric for long-term profitability.",
                },
              ].map((i) => (
                <div key={i.t} className="preview-item">
                  <div className="preview-item-dot" />
                  <div className="preview-item-text">
                    <strong>{i.t}</strong> — {i.d}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fake analytics screen */}
          <div className="preview-screen">
            <div className="ps-bar">
              <div className="ps-dot" style={{ background: "#ef5350" }} />
              <div className="ps-dot" style={{ background: "#ffa726" }} />
              <div className="ps-dot" style={{ background: "#66bb6a" }} />
              <span
                style={{
                  marginLeft: "8px",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.25)",
                  fontWeight: 600,
                }}
              >
                Analytics — June 2025
              </span>
            </div>
            <div className="ps-body">
              <div className="ps-head">Daily P&L — Last 30 Days</div>
              <div className="ps-chart">
                {[
                  40, 65, 30, 80, 55, 70, 45, 90, 35, 75, 60, 85, 50, 95, 40,
                  70, 55, 80, 65, 45, 90, 60, 75, 85, 50, 70, 100, 55, 80, 65,
                ].map((h, i) => (
                  <div
                    key={i}
                    className="ps-bar-el"
                    style={{
                      height: `${h}%`,
                      background:
                        h > 50 ? "rgba(0,217,126,0.7)" : "rgba(239,83,80,0.6)",
                    }}
                  />
                ))}
              </div>
              <div className="ps-stats">
                <div className="ps-stat">
                  <div className="ps-stat-v" style={{ color: "var(--green)" }}>
                    +$12,480
                  </div>
                  <div className="ps-stat-l">Net P&L</div>
                </div>
                <div className="ps-stat">
                  <div className="ps-stat-v">73%</div>
                  <div className="ps-stat-l">Win Rate</div>
                </div>
                <div className="ps-stat">
                  <div className="ps-stat-v">88%</div>
                  <div className="ps-stat-l">Plan Adherence</div>
                </div>
              </div>

              <div style={{ marginTop: "16px" }}>
                <div className="ps-head" style={{ marginBottom: "10px" }}>
                  Win Rate by Instrument
                </div>
                {[
                  { inst: "ES Futures", pct: 82 },
                  { inst: "AAPL Options", pct: 71 },
                  { inst: "NQ Futures", pct: 68 },
                  { inst: "TSLA Stocks", pct: 54 },
                ].map((r) => (
                  <div key={r.inst} style={{ marginBottom: "10px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--muted)",
                          fontWeight: 600,
                        }}
                      >
                        {r.inst}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--green)",
                          fontWeight: 800,
                        }}
                      >
                        {r.pct}%
                      </span>
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: "4px",
                        height: "5px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${r.pct}%`,
                          height: "100%",
                          background: "var(--green)",
                          borderRadius: "4px",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="pricing" id="pricing">
        <div className="w">
          <div style={{ textAlign: "center" }}>
            <div className="section-tag">Pricing</div>
            <h2 className="section-h2">
              15 days free.
              <br />
              <em>No card needed.</em>
            </h2>
            <p
              className="section-sub"
              style={{ margin: "16px auto 0", textAlign: "center" }}
            >
              Every account gets a full 15-day free trial. No questions asked.
              Upgrade when you're ready.
            </p>
            <div
              className="price-ppp"
              style={{ margin: "20px auto 0", width: "fit-content" }}
            >
              🌍 Prices shown for {region.label} · Purchasing power adjusted
            </div>
          </div>

          <div className="price-g">
            {/* ── 15-Day Free Trial ── */}
            <div className="price-c">
              <div className="price-ico" style={{ background: "#f0fdf4" }}>
                🎁
              </div>
              <div className="price-name" style={{ color: "#0d0d1a" }}>
                Free Trial
              </div>
              <div className="price-amt">
                <span className="price-rs" style={{ color: "#0d0d1a" }}>
                  Free
                </span>
              </div>
              <div className="price-orig" style={{ color: "#6b7280" }}>
                15 days · no card required
              </div>
              <ul className="price-list">
                {[
                  "Full Pro access for 15 days",
                  "Daily Trade Journal",
                  "Pre-market Planning",
                  "Analytics & Insights",
                  "Growth Meter Dashboard",
                  "Weekly Reviews",
                ].map((f) => (
                  <li
                    key={f}
                    className="price-item"
                    style={{ color: "#374151" }}
                  >
                    <span className="price-chk" style={{ color: "#10b981" }}>
                      ✓
                    </span>{" "}
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="price-btn-el"
                style={{ background: "#f3f4f6", color: "#374151" }}
              >
                Start Free Trial →
              </Link>
            </div>

            {/* ── Founding Member ── */}
            <div className="price-c founder">
              <div className="price-tag limited">Limited</div>
              <div
                className="price-ico"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                🌟
              </div>
              <div className="price-name" style={{ color: "#fff" }}>
                Founding Member
              </div>
              <div className="price-amt">
                <span className="price-rs" style={{ color: "#fff" }}>
                  {region.founding}
                </span>
              </div>
              <div className="price-orig">
                <span
                  style={{
                    textDecoration: "line-through",
                    color: "rgba(255,255,255,0.35)",
                    marginRight: "6px",
                  }}
                >
                  {region.yearly}
                </span>
                <span
                  style={{
                    color: "#6ee7b7",
                    fontWeight: 700,
                    fontSize: "13px",
                  }}
                >
                  Pay before trial ends · save big
                </span>
              </div>
              <ul className="price-list">
                {[
                  "Everything in Pro — 1 full year",
                  "Founding member badge",
                  "Priority feature requests",
                  "Lock in lowest price ever",
                  "Direct access to founder",
                  "Shape the product roadmap",
                ].map((f) => (
                  <li
                    key={f}
                    className="price-item"
                    style={{ color: "rgba(255,255,255,0.85)" }}
                  >
                    <span className="price-chk" style={{ color: "#6ee7b7" }}>
                      ✓
                    </span>{" "}
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setUpgradeModal("founding")}
                className="price-btn-el"
                style={{ background: "#fff", color: "#065f46" }}
              >
                Claim Founding Spot →
              </button>
            </div>

            {/* ── Pro Plans ── */}
            <div className="price-c hl">
              <div
                className="price-ico"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                🏆
              </div>
              <div className="price-name" style={{ color: "#fff" }}>
                Pro
              </div>
              <div
                className="price-toggle-wrap"
                style={{ justifyContent: "flex-start", margin: "0 0 16px" }}
              >
                <div className="price-toggle">
                  <button
                    className={`pt-btn${billing === "quarterly" ? " active" : ""}`}
                    onClick={() => setBilling("quarterly")}
                  >
                    Quarterly
                  </button>
                  <button
                    className={`pt-btn${billing === "annual" ? " active" : ""}`}
                    onClick={() => setBilling("annual")}
                  >
                    Yearly
                  </button>
                </div>
              </div>
              {billing === "quarterly" ? (
                <>
                  <div className="price-amt">
                    <span className="price-rs" style={{ color: "#fff" }}>
                      {region.quarterly}
                    </span>
                    <span
                      className="price-per"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      /quarter
                    </span>
                  </div>
                  <div
                    className="price-orig"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    Billed every 3 months
                  </div>
                </>
              ) : (
                <>
                  <div className="price-amt">
                    <span className="price-rs" style={{ color: "#fff" }}>
                      {region.yearly}
                    </span>
                    <span
                      className="price-per"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      /year
                    </span>
                  </div>
                  <div
                    className="price-orig"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    Best value · billed annually
                  </div>
                </>
              )}
              <ul className="price-list">
                {[
                  "Daily Trade Journal",
                  "Pre-market Planning",
                  "Analytics & Insights",
                  "Growth Meter Dashboard",
                  "Weekly Reviews",
                  "Trading Rules System",
                ].map((f) => (
                  <li
                    key={f}
                    className="price-item"
                    style={{ color: "rgba(255,255,255,0.85)" }}
                  >
                    <span className="price-chk" style={{ color: "#a5b4fc" }}>
                      ✓
                    </span>{" "}
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setUpgradeModal("pro")}
                className="price-btn-el"
                style={{ background: "#fff", color: "#1a237e" }}
              >
                Get Pro →
              </button>
            </div>
          </div>

          <p
            style={{
              textAlign: "center",
              marginTop: "28px",
              fontSize: "13px",
              color: "#9ca3af",
            }}
          >
            💬 Payment via bank transfer · We'll reach out within 24 hours to
            confirm
          </p>
        </div>
      </section>

      {/* ── DISCIPLINE CHALLENGE ── */}
      <section className="disc" id="discipline">
        <div className="disc-glow" />
        <div className="disc-inner">
          <div className="disc-hero">
            <div className="disc-badge">⚡ Coming Soon · World's First</div>
            <h2 className="disc-h2">
              The only platform that
              <br />
              <em>pays you to be disciplined.</em>
            </h2>
            <p className="disc-sub">
              Pick a challenge. Put in a small stake. Follow your rules every
              single day. Miss nothing — get your money back plus a reward. It's
              not a gimmick. It's skin in the game.
            </p>
          </div>

          <div className="disc-steps">
            {[
              {
                n: "01",
                ico: "🎯",
                t: "Choose a Challenge",
                d: "Pick a discipline challenge — pre-market journaling every day, no revenge trades for 30 days, log every single trade for 60 days. You decide the stakes.",
              },
              {
                n: "02",
                ico: "💰",
                t: "Pay a Small Fee",
                d: "Commit a small amount — ₹99 to ₹999. It's not a subscription. It's a commitment device. Real skin in the game makes habits stick.",
              },
              {
                n: "03",
                ico: "✅",
                t: "Show Up Every Day",
                d: "GrowthNotes automatically tracks your compliance. Pre-market done? Logged. Trade journaled? Logged. The system knows. There's no gaming it.",
              },
              {
                n: "04",
                ico: "🏆",
                t: "Complete It, Earn It Back",
                d: "Finish the challenge without missing a single day and you get your fee back plus a reward from the pool. Discipline literally pays.",
              },
            ].map((s) => (
              <div key={s.n} className="disc-step">
                <div className="disc-step-n">{s.n}</div>
                <span className="disc-step-ico">{s.ico}</span>
                <div className="disc-step-t">{s.t}</div>
                <div className="disc-step-d">{s.d}</div>
              </div>
            ))}
          </div>

          <div className="disc-earn">
            <div>
              <h3 className="disc-earn-h">
                Why this works when
                <br />
                <em>nothing else does.</em>
              </h3>
              <p className="disc-earn-d" style={{ marginBottom: 16 }}>
                Discipline advice is free. Everyone gives it. Nobody follows it
                — because following it costs nothing.
              </p>
              <p className="disc-earn-d" style={{ marginBottom: 16 }}>
                When real money is tied to your consistency, your brain treats
                the challenge differently. You show up. You log. You stop
                breaking rules. And at the end — you get paid for it.
              </p>
              <p className="disc-earn-d">
                The best traders in the world didn't get there by being smarter.
                They got there by being more consistent. This is the system that
                builds that.
              </p>
            </div>
            <div className="disc-earn-stats">
              {[
                {
                  val: "100%",
                  t: "Fee refunded on completion",
                  d: "Every rupee comes back to you if you complete the challenge without missing a day.",
                },
                {
                  val: "+Bonus",
                  t: "Reward from the pool",
                  d: "Those who drop out fund a reward pool. Completers share it. Discipline literally pays a premium.",
                },
                {
                  val: "21 Days",
                  t: "Minimum to form a habit",
                  d: "Our shortest challenge is built around science — 21 days of consistent action to wire a new behaviour.",
                },
              ].map((s) => (
                <div key={s.t} className="disc-stat">
                  <div className="disc-stat-val">{s.val}</div>
                  <div className="disc-stat-label">
                    <strong>{s.t}</strong>
                    {s.d}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MENTOR ── */}
      <section className="mentor" id="mentors">
        <div className="mentor-inner">
          <div className="section-tag">Coming Soon · Mentor Marketplace</div>
          <h2 className="section-h2">
            Learn from traders
            <br />
            who've <em>already done it.</em>
          </h2>
          <p className="section-sub">
            GrowthNotes is building a marketplace where experienced traders
            become mentors — and earn by helping others build the discipline
            they mastered.
          </p>

          <div className="mentor-grid">
            {/* Honest early-access panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,217,126,0.08), rgba(124,77,255,0.06))",
                  border: "1px solid rgba(0,217,126,0.2)",
                  borderRadius: 20,
                  padding: "36px 32px",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "var(--green)",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    marginBottom: 14,
                  }}
                >
                  Be Among the First Mentors
                </div>
                <p
                  style={{
                    fontSize: 15,
                    color: "var(--muted)",
                    lineHeight: 1.75,
                    marginBottom: 24,
                  }}
                >
                  The Mentor Marketplace isn't live yet — and that's
                  intentional. We're not going to populate it with profiles
                  until real, verified traders are ready to teach.
                </p>
                <p
                  style={{
                    fontSize: 15,
                    color: "var(--muted)",
                    lineHeight: 1.75,
                  }}
                >
                  If you've been trading consistently for 2+ years and have a
                  discipline system that works — watch this space. Mentor
                  applications will open once the marketplace is ready.
                </p>
              </div>

              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 20,
                  padding: "28px 32px",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.35)",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    marginBottom: 14,
                  }}
                >
                  What we'll verify
                </div>
                {[
                  [
                    "📊",
                    "Discipline score",
                    "Your GrowthNotes journal consistency — not just P&L screenshots.",
                  ],
                  [
                    "📅",
                    "Trading history",
                    "Minimum 2 years active, verified through your connected broker.",
                  ],
                  [
                    "✅",
                    "System, not luck",
                    "A repeatable approach you can teach, not a lucky streak.",
                  ],
                ].map(([ico, t, d]) => (
                  <div
                    key={t}
                    style={{
                      display: "flex",
                      gap: 14,
                      marginBottom: 18,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>
                      {ico}
                    </span>
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--text)",
                          marginBottom: 3,
                        }}
                      >
                        {t}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "var(--muted)",
                          lineHeight: 1.6,
                        }}
                      >
                        {d}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div>
              <div style={{ marginBottom: 36 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.35)",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    marginBottom: 12,
                  }}
                >
                  For Mentors
                </div>
                <div className="mentor-flow">
                  {[
                    {
                      n: "1",
                      t: "Apply when we launch",
                      d: "Mentor profiles are verified. We check your GrowthNotes discipline score, trading history, and consistency — not just P&L.",
                    },
                    {
                      n: "2",
                      t: "Set your own rates",
                      d: "Charge per session, per month, or per challenge cohort. You keep the majority. GrowthNotes takes a small platform fee.",
                    },
                    {
                      n: "3",
                      t: "Earn while you trade",
                      d: "Your track record in GrowthNotes is your credential. The more consistent you are, the more students find you.",
                    },
                  ].map((s) => (
                    <div key={s.n} className="mf-item">
                      <div className="mf-num">{s.n}</div>
                      <div>
                        <div className="mf-title">{s.t}</div>
                        <div className="mf-desc">{s.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.35)",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    marginBottom: 12,
                  }}
                >
                  For Students
                </div>
                <div className="mentor-flow">
                  {[
                    {
                      n: "🔍",
                      t: "Search by style & market",
                      d: "Filter mentors by their market (equity, options, futures), trading style, and verified discipline score — not ads.",
                    },
                    {
                      n: "📊",
                      t: "See their real track record",
                      d: "Every mentor's GrowthNotes journal stats are visible — win rate, discipline score, streak. No hiding behind screenshots.",
                    },
                    {
                      n: "🤝",
                      t: "Learn from proof, not promises",
                      d: "Book sessions, join cohorts, or follow a mentor's challenge. Real accountability, real results.",
                    },
                  ].map((s) => (
                    <div key={s.t} className="mf-item">
                      <div
                        className="mf-num"
                        style={{
                          fontSize: 20,
                          background: "rgba(255,255,255,0.05)",
                          borderColor: "var(--border)",
                          color: "var(--text)",
                        }}
                      >
                        {s.n}
                      </div>
                      <div>
                        <div className="mf-title">{s.t}</div>
                        <div className="mf-desc">{s.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROADMAP ── */}
      <section className="roadmap" id="roadmap">
        <div className="roadmap-inner">
          <div className="section-tag">What's Next</div>
          <h2 className="section-h2">
            We're just <em>getting started.</em>
          </h2>
          <p className="section-sub">
            Everything live today is the foundation. Here's what's coming next —
            built on real user feedback.
          </p>

          <div className="roadmap-g">
            {[
              {
                status: "live",
                label: "✦ Live Now",
                ico: "📓",
                t: "Journal & Analytics",
                d: "Pre-market plan, trade log, EOD review, weekly reflection. Full analytics — win rate, P&L, streaks, psychology scores.",
              },
              {
                status: "live",
                label: "✦ Live Now",
                ico: "📊",
                t: "Dashboard & Rules",
                d: "Real-time capital tracker, rules engine, scenario planner, and assessment tools to understand if you're ready to trade.",
              },
              {
                status: "live",
                label: "✦ Live Now",
                ico: "🔗",
                t: "Broker Integration",
                d: "Connect your Upstox account and automatically sync your trades. No more manual entry for live traders.",
              },
              {
                status: "building",
                label: "🔨 Building",
                ico: "🎯",
                t: "Discipline Challenge",
                d: "Stake a small amount, commit to a challenge, complete it without missing a day, earn it back plus a bonus. Coming soon.",
              },
              {
                status: "building",
                label: "🔨 Building",
                ico: "👨‍🏫",
                t: "Mentor Marketplace",
                d: "Search verified mentors by market, style, and discipline score. Book sessions. No fake screenshots — only proven track records.",
              },
              {
                status: "planned",
                label: "📍 Planned",
                ico: "📱",
                t: "WhatsApp Alerts",
                d: "Pre-market reminders, rule-breach alerts, and daily discipline nudges delivered straight to WhatsApp.",
              },
              {
                status: "planned",
                label: "📍 Planned",
                ico: "🏆",
                t: "Leaderboards",
                d: "Anonymous discipline leaderboards. Compete on consistency, not P&L. The best traders are the most consistent.",
              },
              {
                status: "planned",
                label: "📍 Planned",
                ico: "🌍",
                t: "Multi-broker & Global",
                d: "Zerodha, Fyers, Angel One, Interactive Brokers. GrowthNotes works wherever you trade in the world.",
              },
              {
                status: "planned",
                label: "📍 Planned",
                ico: "🤖",
                t: "AI Trade Coach",
                d: 'Pattern detection across your journal. "You always overtrade on Mondays." "Your FOMO trades lose 3× more." Honest AI feedback.',
              },
            ].map((r) => (
              <div
                key={r.t}
                className={`rm-card ${r.status === "live" ? "active" : r.status === "planned" ? "soon" : ""}`}
              >
                {r.status === "live" && <div className="rm-glow" />}
                <div
                  className={`rm-badge ${r.status === "live" ? "live" : r.status === "building" ? "building" : "planned"}`}
                >
                  {r.label}
                </div>
                <span className="rm-ico">{r.ico}</span>
                <div className="rm-title">{r.t}</div>
                <div className="rm-desc">{r.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="final-cta">
        <div className="final-cta-glow" />
        <h2 className="cta-h2">
          Day 1 starts
          <br />
          <em>today.</em>
        </h2>
        <p className="cta-sub">
          Free to start. Takes 2 minutes. Your future self will thank you for
          building the habit now.
        </p>
        <div className="cta-btns">
          {isLoggedIn ? (
            <>
              <Link href="/journal" className="btn-primary">
                Open Today's Journal →
              </Link>
              <Link href="/dashboard" className="btn-ghost">
                View Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-primary">
                Create Free Account →
              </Link>
              <Link href="/tools/loss-recovery" className="btn-ghost">
                Explore Tools
              </Link>
            </>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="foot">
        <div className="foot-i">
          <Link href="/" className="foot-logo">
            <div className="foot-logo-mark">📈</div>
            <span className="foot-logo-name">GrowthNotes</span>
          </Link>
          <div className="foot-links">
            {[
              ["/guide", "User Guide"],
              ["/journal", "Journal"],
              ["/weekly", "Weekly"],
              ["/rules", "Rules"],
              ["/plan", "Plan"],
              ["/tools/loss-recovery", "Tools"],
              ["/assess/profitability", "Assess"],
              ["/analytics", "Analytics"],
              ["/login", "Login"],
            ].map(([h, l]) => (
              <Link key={h} href={h} className="fl">
                {l}
              </Link>
            ))}
          </div>
          <div className="foot-copy">
            © {new Date().getFullYear()} GrowthNotes
          </div>
        </div>
      </footer>
    </>
  );
}
