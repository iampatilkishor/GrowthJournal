"use client";

import Link from "next/link";
import { useState } from "react";

const SECTIONS = [
  { id: "start",     icon: "🚀", label: "Getting Started" },
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "journal",   icon: "📝", label: "Journal" },
  { id: "planner",   icon: "🗂️", label: "Pre-Market Planner" },
  { id: "rules",     icon: "📌", label: "Trading Rules" },
  { id: "weekly",    icon: "📅", label: "Weekly Review" },
  { id: "analytics", icon: "📈", label: "Analytics" },
  { id: "tools",     icon: "🧮", label: "Calculators" },
  { id: "broker",    icon: "🔗", label: "Broker Integration" },
  { id: "watchlist", icon: "👀", label: "Watchlist" },
  { id: "profile",   icon: "👤", label: "Profile & Settings" },
];

function Step({ n, title, children }) {
  return (
    <div style={{ display: "flex", gap: 20, marginBottom: 28 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,217,126,0.12)", border: "1px solid rgba(0,217,126,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#00d97e", flexShrink: 0, marginTop: 2 }}>{n}</div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 15, color: "#e8eaf2", marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 14, color: "rgba(232,234,242,0.55)", lineHeight: 1.75 }}>{children}</div>
      </div>
    </div>
  );
}

function Tip({ children }) {
  return (
    <div style={{ background: "rgba(0,217,126,0.06)", border: "1px solid rgba(0,217,126,0.2)", borderRadius: 12, padding: "14px 18px", marginTop: 20, marginBottom: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
      <span style={{ fontSize: 13, color: "rgba(232,234,242,0.7)", lineHeight: 1.7 }}>{children}</span>
    </div>
  );
}

function Warning({ children }) {
  return (
    <div style={{ background: "rgba(255,167,38,0.06)", border: "1px solid rgba(255,167,38,0.2)", borderRadius: 12, padding: "14px 18px", marginTop: 20, marginBottom: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
      <span style={{ fontSize: 13, color: "rgba(232,234,242,0.7)", lineHeight: 1.7 }}>{children}</span>
    </div>
  );
}

function SectionHeader({ id, icon, title, subtitle }) {
  return (
    <div id={id} style={{ marginBottom: 32, paddingTop: 8 }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <h2 style={{ fontSize: 26, fontWeight: 900, color: "#e8eaf2", letterSpacing: -0.8, margin: "0 0 10px" }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 15, color: "rgba(232,234,242,0.5)", lineHeight: 1.7, margin: 0 }}>{subtitle}</p>}
    </div>
  );
}

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState("start");

  function scrollTo(id) {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #060911;
          --surface: #0d1220;
          --border: rgba(255,255,255,0.07);
          --green: #00d97e;
          --text: #e8eaf2;
          --muted: rgba(232,234,242,0.45);
        }
        body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        hr.divider { border: none; border-top: 1px solid var(--border); margin: 48px 0; }
        @media (max-width: 860px) {
          .guide-layout { grid-template-columns: 1fr !important; }
          .guide-sidebar { display: none !important; }
        }
      `}</style>

      {/* Nav */}
      <header style={{ position: "sticky", top: 0, zIndex: 200, background: "rgba(6,9,17,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", height: 62, display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginRight: "auto" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#00d97e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📈</div>
            <span style={{ fontSize: 17, fontWeight: 900, color: "#e8eaf2" }}>GrowthNotes</span>
          </Link>
          <Link href="/dashboard" style={{ fontSize: 14, fontWeight: 700, color: "#000", background: "#00d97e", padding: "8px 20px", borderRadius: 20, textDecoration: "none" }}>
            Open App →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "64px 24px 56px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid rgba(0,217,126,0.3)", background: "rgba(0,217,126,0.06)", color: "#00d97e", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", padding: "6px 16px", borderRadius: 20, marginBottom: 24 }}>
            ✦ Complete User Guide
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 54px)", fontWeight: 900, color: "#e8eaf2", letterSpacing: -2, lineHeight: 1.05, marginBottom: 20 }}>
            How to use<br /><span style={{ color: "#00d97e" }}>GrowthNotes</span>
          </h1>
          <p style={{ fontSize: 17, color: "rgba(232,234,242,0.55)", lineHeight: 1.75, maxWidth: 560, margin: "0 auto" }}>
            Everything you need to know — from signing up to building a daily trading habit that compounds over time.
          </p>
        </div>
      </div>

      {/* Layout */}
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "48px 24px 100px", display: "grid", gridTemplateColumns: "240px 1fr", gap: 56 }} className="guide-layout">

        {/* Sidebar */}
        <aside className="guide-sidebar" style={{ position: "sticky", top: 82, alignSelf: "start", maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>On this page</div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => scrollTo(s.id)} style={{
                textAlign: "left", background: activeSection === s.id ? "rgba(0,217,126,0.1)" : "none",
                border: activeSection === s.id ? "1px solid rgba(0,217,126,0.2)" : "1px solid transparent",
                borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600,
                color: activeSection === s.id ? "#00d97e" : "rgba(232,234,242,0.5)",
                display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s",
              }}>
                <span>{s.icon}</span> {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main style={{ minWidth: 0 }}>

          {/* ─ GETTING STARTED ─ */}
          <SectionHeader id="start" icon="🚀" title="Getting Started"
            subtitle="GrowthNotes is a trading journal and discipline system. It takes about 2 minutes to set up and 5 minutes a day to use consistently." />

          <Step n="1" title="Create your account">
            Click <strong style={{ color: "#e8eaf2" }}>Start Free →</strong> on the home page. Enter your email and password. No credit card needed — you get a full 15-day free trial with access to every feature.
          </Step>
          <Step n="2" title="Set up your profile">
            After signing in, go to <strong style={{ color: "#e8eaf2" }}>Profile</strong> (top right corner). Enter your starting capital — this is the amount you're trading with right now. Set a capital goal and a target date. GrowthNotes uses this to build your Growth Meter.
          </Step>
          <Step n="3" title="Write your trading rules">
            Go to <strong style={{ color: "#e8eaf2" }}>Rules</strong> in the sidebar. Add your personal trading rules — entry criteria, risk per trade, instruments you trade, emotions to watch. These stay visible throughout the app as a constant reminder.
          </Step>
          <Step n="4" title="Start your first daily journal">
            Go to <strong style={{ color: "#e8eaf2" }}>Journal → Today</strong>. Fill in the Pre-Market section before the market opens. Log your trades during the session. Complete the Post-Market reflection before end of day.
          </Step>

          <Tip>The #1 habit that separates consistent traders from struggling ones is completing a pre-market entry before the market opens. Even 5 minutes changes how you trade.</Tip>

          <hr className="divider" />

          {/* ─ DASHBOARD ─ */}
          <SectionHeader id="dashboard" icon="📊" title="Dashboard"
            subtitle="Your command centre — shows where you are right now and how you're tracking toward your goal." />

          <Step n="1" title="Growth Meter">
            The large progress bar at the top shows your current capital vs your goal. As your capital grows through profitable trading, the bar fills up. Milestones at 25%, 50%, 75%, and 100% are marked — each one is worth celebrating.
          </Step>
          <Step n="2" title="Today's P&L and streaks">
            The dashboard shows your net P&L for the day, your current journaling streak (consecutive days you've completed the daily journal), and your plan adherence percentage. These three numbers are the most predictive metrics for long-term profitability.
          </Step>
          <Step n="3" title="Recent trades">
            Below the stats, you'll see your most recent logged trades at a glance. Click any trade to see the full detail — entry, exit, emotion, notes.
          </Step>
          <Step n="4" title="Pre-market reminder">
            If you haven't filled in today's Pre-Market section yet, the dashboard will show a reminder banner. Click it to go straight to the Journal.
          </Step>

          <Tip>Enable browser notifications when prompted. GrowthNotes will send a push notification before the market opens reminding you to complete your pre-market plan.</Tip>

          <hr className="divider" />

          {/* ─ JOURNAL ─ */}
          <SectionHeader id="journal" icon="📝" title="Journal"
            subtitle="The heart of GrowthNotes. Two tabs — Today for writing, History for reviewing." />

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px", marginBottom: 32 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ fontWeight: 800, color: "#00d97e", fontSize: 14, marginBottom: 8 }}>📋 Today Tab</div>
                <div style={{ fontSize: 13, color: "rgba(232,234,242,0.55)", lineHeight: 1.7 }}>Write your pre-market plan, log trades, and complete your end-of-day reflection. Always locked to today's date — no backdating.</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, color: "#7c4dff", fontSize: 14, marginBottom: 8 }}>📅 History Tab</div>
                <div style={{ fontSize: 13, color: "rgba(232,234,242,0.55)", lineHeight: 1.7 }}>Calendar view of all past days. Days with entries are highlighted — green for profit, red for loss. Click any date to see that day's full journal read-only.</div>
              </div>
            </div>
          </div>

          <div style={{ fontWeight: 800, fontSize: 15, color: "#e8eaf2", marginBottom: 20 }}>🌅 Pre-Market Section (fill this before the market opens)</div>
          <Step n="1" title="Mental State">
            Pick how you're feeling right now — Calm, Anxious, FOMO, or Focused. Honest self-assessment is the point. If you're anxious before the open, you need to know that before you place a trade.
          </Step>
          <Step n="2" title="Market Bias">
            Are you Bullish, Bearish, or Sideways for today? This forces you to have a directional view before the open rather than reacting to price action once trading begins.
          </Step>
          <Step n="3" title="Key Levels">
            Enter your Support 1, Support 2, Resistance 1, Resistance 2 levels for the day. These are price points where you expect the market to react — and they anchor your trade decisions.
          </Step>
          <Step n="4" title="Risk limits">
            Enter your Daily Loss Limit (the maximum you'll lose before stopping for the day) and your Profit Target. GrowthNotes shows you the Target:Risk ratio. Aim for at least 1.5:1.
          </Step>
          <Step n="5" title="Save Pre-Market">
            Hit <strong style={{ color: "#e8eaf2" }}>Save Pre-Market</strong>. This is timestamped — your future self and any future mentor can see you planned before trading, not after.
          </Step>

          <div style={{ fontWeight: 800, fontSize: 15, color: "#e8eaf2", margin: "32px 0 20px" }}>📊 Trade Log</div>
          <Step n="1" title="Log a trade manually">
            Click <strong style={{ color: "#e8eaf2" }}>+ Log a Trade</strong>. Fill in the instrument, direction (BUY/SELL), entry price, exit price, quantity, stop loss, and target. Add your emotion and whether you followed your plan. Hit Save.
          </Step>
          <Step n="2" title="Connected broker trades (Upstox users)">
            If you've connected Upstox (see Broker Integration below), trades appear automatically under the <strong style={{ color: "#e8eaf2" }}>Pending</strong> section. Click <strong style={{ color: "#e8eaf2" }}>Log →</strong> next to each one to add your notes — emotion, plan adherence, entry reason.
          </Step>
          <Step n="3" title="What to log for every trade">
            The most valuable fields are: <strong style={{ color: "#e8eaf2" }}>Emotion</strong> (calm/fomo/revenge/anxious), <strong style={{ color: "#e8eaf2" }}>Followed Plan</strong> (yes/no), and <strong style={{ color: "#e8eaf2" }}>Entry Reason</strong>. These are what will reveal your patterns in Analytics.
          </Step>

          <div style={{ fontWeight: 800, fontSize: 15, color: "#e8eaf2", margin: "32px 0 20px" }}>🌆 Post-Market Reflection (do this after the market closes)</div>
          <Step n="1" title="What I Did Well">
            Write one honest thing you did right today. It doesn't have to be a winning trade — it can be "stuck to my loss limit" or "waited for the setup instead of chasing."
          </Step>
          <Step n="2" title="Biggest Mistake">
            One honest mistake. Revenge traded? Widened your stop loss? This is the most valuable field in the entire app — these patterns repeat until you write them down.
          </Step>
          <Step n="3" title="Tomorrow's Focus">
            One specific intention for tomorrow. "No trades in the first 15 minutes." "Only NIFTY, no stocks." Writing tomorrow's focus tonight makes it 3× more likely you'll follow it.
          </Step>

          <Warning>The History tab is read-only. GrowthNotes doesn't allow editing past entries — your journal is a real-time record. If you made a mistake logging a trade, you can add a new entry as a correction.</Warning>

          <hr className="divider" />

          {/* ─ PLANNER ─ */}
          <SectionHeader id="planner" icon="🗂️" title="Pre-Market Planner"
            subtitle="Build detailed IF/THEN scenarios before the market opens. Never make a major decision in real-time." />

          <Step n="1" title="Create a plan for today">
            Go to <strong style={{ color: "#e8eaf2" }}>Plan</strong> in the sidebar. Click <strong style={{ color: "#e8eaf2" }}>+ New Plan</strong>. Give it a title (e.g. "NIFTY Long Setup 27 June").
          </Step>
          <Step n="2" title="Write your IF/THEN scenarios">
            A scenario looks like: <em style={{ color: "rgba(232,234,242,0.7)" }}>"IF NIFTY breaks above 24,500 with volume, THEN go long with 50 units targeting 24,700, SL at 24,420."</em> You can add multiple scenarios — one for a bullish case, one for bearish, one for range-bound.
          </Step>
          <Step n="3" title="Activate the plan">
            Mark the plan as Active before the open. When you log a trade from the broker section, you can link it to an existing plan — this is how GrowthNotes tracks whether you followed your pre-defined scenario.
          </Step>
          <Step n="4" title="Review after close">
            After the market closes, check which scenarios played out. Did you execute? Did you miss the setup? Was the setup wrong? This review loop is where edge compounds.
          </Step>

          <Tip>The best use of the Planner is to reduce hesitation during live markets. If you've already decided "IF price does X, I'll do Y," then execution becomes mechanical — not emotional.</Tip>

          <hr className="divider" />

          {/* ─ RULES ─ */}
          <SectionHeader id="rules" icon="📌" title="Trading Rules"
            subtitle="Your personal trading constitution — always visible, always editable, never negotiable during market hours." />

          <Step n="1" title="Add your rules">
            Go to <strong style={{ color: "#e8eaf2" }}>Rules</strong>. Add your trading rules one by one. Categorise them: Entry rules, Risk rules, Psychology rules, Exit rules.
          </Step>
          <Step n="2" title="Be specific, not vague">
            Bad rule: <em style={{ color: "rgba(232,234,242,0.5)" }}>"Don't overtrade."</em> Good rule: <em style={{ color: "rgba(232,234,242,0.7)" }}>"Maximum 3 trades per day. If I hit my daily loss limit of ₹3,000, I close my platform and don't return."</em> Specificity is what makes rules followable.
          </Step>
          <Step n="3" title="Review your rules weekly">
            Rules evolve as you improve. During your Weekly Review (see below), spend 2 minutes reading your rules. Update any that are no longer relevant. Add any pattern you've noticed yourself breaking.
          </Step>

          <Warning>Don't add too many rules. 5–8 well-written rules you actually follow beats 25 rules you ignore. Start small and add as you identify real patterns in your behaviour.</Warning>

          <hr className="divider" />

          {/* ─ WEEKLY REVIEW ─ */}
          <SectionHeader id="weekly" icon="📅" title="Weekly Review"
            subtitle="Do this every Sunday. Takes 10 minutes. It's the single most compound habit in the app." />

          <Step n="1" title="Rate your week">
            Open <strong style={{ color: "#e8eaf2" }}>Weekly Review</strong> from the sidebar. Rate the week on discipline (1–10) and overall performance (1–10). Be honest — not based on P&L, but based on how well you followed your process.
          </Step>
          <Step n="2" title="Record your capital">
            Enter your current capital. GrowthNotes plots this week over week — over months you'll see your actual growth curve. This is more honest than any P&L screenshot.
          </Step>
          <Step n="3" title="Identify patterns">
            The weekly review has fields for: What worked this week, What didn't, Which rules you broke most often, and Your intention for next week. These four questions are all you need.
          </Step>
          <Step n="4" title="Set next week's focus">
            One specific thing to improve next week. Not "trade better." Try "I will not add to a losing position" or "I will honour my 1:1.5 R:R minimum before entering."
          </Step>

          <Tip>After 8 weekly reviews, you'll have a genuine picture of your trading psychology. Most traders have never done this. It's the most underrated edge available — and it's free.</Tip>

          <hr className="divider" />

          {/* ─ ANALYTICS ─ */}
          <SectionHeader id="analytics" icon="📈" title="Analytics"
            subtitle="Your trading data turned into insight. Every trade you log becomes a data point here." />

          <Step n="1" title="P&L chart">
            The main chart shows your daily P&L over the last 30–90 days (toggle the period). Green bars = profit days, red bars = loss days. Look for patterns: do you have more loss days on Mondays? After big winning days?
          </Step>
          <Step n="2" title="Win rate by instrument">
            This table shows your win rate broken down by the instruments you trade. You might discover you win 75% of the time on NIFTY but only 40% on stocks. That's actionable — it tells you where your actual edge is.
          </Step>
          <Step n="3" title="Psychology correlation">
            GrowthNotes cross-references your emotion field with your P&L. If your FOMO trades consistently lose more than your Calm trades, that pattern will show up here. This is the data that changes behaviour.
          </Step>
          <Step n="4" title="Plan discipline tracking">
            The plan adherence percentage (trades where you marked "Followed Plan: Yes") is the most predictive long-term metric in the app. Track it week over week. Traders above 70% plan adherence consistently outperform those below.
          </Step>

          <hr className="divider" />

          {/* ─ TOOLS ─ */}
          <SectionHeader id="tools" icon="🧮" title="Calculators & Tools"
            subtitle="Quick-access tools for the maths that keeps trading accounts alive." />

          <Step n="1" title="Position Size Calculator">
            Enter your account size, risk per trade (%), stop loss distance, and instrument price. The calculator tells you exactly how many units to buy so you risk precisely what you've decided — no more, no less.
          </Step>
          <Step n="2" title="Risk:Reward Calculator">
            Enter entry, stop loss, and target price. GrowthNotes calculates your R:R ratio, expected value, and win rate needed to be profitable at that R:R. Use this before every trade.
          </Step>
          <Step n="3" title="Loss Recovery Calculator">
            Enter how much you've lost as a percentage. The calculator shows you what gain is required to recover. Losing 50% requires a 100% gain to break even — this calculator makes that visible and encourages smaller losses.
          </Step>
          <Step n="4" title="Compounding Calculator">
            Enter your starting capital, monthly return %, and time horizon. See what disciplined compounding looks like — this is motivating context for why the daily habits matter.
          </Step>

          <Tip>Bookmark the Tools page. Use the Position Size calculator before every single trade — even after years of trading, doing the math removes the temptation to "eyeball it."</Tip>

          <hr className="divider" />

          {/* ─ BROKER ─ */}
          <SectionHeader id="broker" icon="🔗" title="Broker Integration"
            subtitle="Connect your Upstox account to automatically import your trades. No more manual data entry for live traders." />

          <Step n="1" title="Go to Broker Settings">
            Click <strong style={{ color: "#e8eaf2" }}>Broker</strong> in the sidebar. You'll see the Upstox connection screen.
          </Step>
          <Step n="2" title="Connect Upstox">
            Click <strong style={{ color: "#e8eaf2" }}>Connect Upstox</strong>. You'll be redirected to Upstox to authorise GrowthNotes. This is a read-only OAuth connection — GrowthNotes can see your orders but cannot place or modify any trades.
          </Step>
          <Step n="3" title="Sync your trades">
            Once connected, GrowthNotes will pull your completed orders from Upstox. These appear as <strong style={{ color: "#e8eaf2" }}>Pending</strong> in your Journal's Trade Log section (marked with ⏳).
          </Step>
          <Step n="4" title="Add your journal notes">
            For each imported trade, click <strong style={{ color: "#e8eaf2" }}>Log →</strong> to add your emotion, plan adherence, and entry reason. The raw trade data (price, quantity, P&L) is filled in automatically — you just add the psychology layer.
          </Step>

          <Warning>The broker integration is currently available for Upstox only. Support for Zerodha, Fyers, and Angel One is coming soon. Manual trade logging works for all brokers in the meantime.</Warning>

          <hr className="divider" />

          {/* ─ WATCHLIST ─ */}
          <SectionHeader id="watchlist" icon="👀" title="Watchlist"
            subtitle="Track the instruments you monitor regularly — prices update in real time during market hours." />

          <Step n="1" title="Add instruments">
            Go to <strong style={{ color: "#e8eaf2" }}>Watchlist</strong>. Use the search bar to find instruments — type the ticker or name. Add NIFTY, BANKNIFTY, individual stocks, or futures contracts.
          </Step>
          <Step n="2" title="Live prices">
            During market hours, prices update automatically. You'll see the current price, day change (₹ and %), and a mini spark line showing the intraday trend.
          </Step>
          <Step n="3" title="Pre-market use">
            Keep your watchlist focused on your planned trades for the day. Before the open, review your watchlist alongside your Pre-Market Plan — check how gapping up or down affects your key levels.
          </Step>

          <hr className="divider" />

          {/* ─ PROFILE ─ */}
          <SectionHeader id="profile" icon="👤" title="Profile & Settings"
            subtitle="Personalise GrowthNotes to match your trading setup." />

          <Step n="1" title="Starting capital and currency">
            Set your trading capital and currency in Profile. GrowthNotes supports ₹, $, £, €, A$, and more. All P&L figures and charts will display in your chosen currency.
          </Step>
          <Step n="2" title="Capital goal">
            Set a capital goal and a date. Example: "I want to grow from ₹2,00,000 to ₹3,00,000 by 31 December 2025." The Growth Meter on your dashboard tracks this.
          </Step>
          <Step n="3" title="Notifications">
            Enable browser notifications in your Profile settings (or when prompted). You'll receive a pre-market reminder each morning and an evening nudge to complete your reflection.
          </Step>
          <Step n="4" title="Subscription and billing">
            View your current plan, trial days remaining, and upgrade options in Profile. Payments are processed via bank transfer — submit a payment request and the team will confirm within 24 hours.
          </Step>

          <hr className="divider" />

          {/* Final CTA */}
          <div style={{ background: "linear-gradient(135deg, rgba(0,217,126,0.08), rgba(124,77,255,0.06))", border: "1px solid rgba(0,217,126,0.15)", borderRadius: 20, padding: "40px 36px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🎯</div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: "#e8eaf2", marginBottom: 12, letterSpacing: -0.5 }}>
              The daily routine that builds edge
            </h3>
            <p style={{ fontSize: 15, color: "rgba(232,234,242,0.55)", lineHeight: 1.75, maxWidth: 480, margin: "0 auto 28px" }}>
              Pre-market plan before the open. Log every trade during the session. Post-market reflection before close. Weekly review on Sunday. That's it. Five minutes a day, every day.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/journal" style={{ padding: "13px 28px", background: "#00d97e", color: "#000", borderRadius: 10, textDecoration: "none", fontWeight: 800, fontSize: 14 }}>
                Open Today's Journal →
              </Link>
              <Link href="/dashboard" style={{ padding: "13px 28px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8eaf2", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                Go to Dashboard
              </Link>
            </div>
          </div>

        </main>
      </div>

      {/* Footer */}
      <footer style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "32px 24px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "#00d97e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📈</div>
            <span style={{ fontSize: 15, fontWeight: 900, color: "#e8eaf2" }}>GrowthNotes</span>
          </Link>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[["/#how", "How it works"], ["/#features", "Features"], ["/#pricing", "Pricing"], ["/guide", "User Guide"]].map(([h, l]) => (
              <Link key={h} href={h} style={{ fontSize: 13, color: "rgba(232,234,242,0.45)", textDecoration: "none" }}>{l}</Link>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>© {new Date().getFullYear()} GrowthNotes</div>
        </div>
      </footer>
    </>
  );
}
