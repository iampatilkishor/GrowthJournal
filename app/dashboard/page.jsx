"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/authFetch.js";
import OnboardingWizard from "@/components/OnboardingWizard.jsx";
import { showNotification } from "@/components/PremarketReminder.jsx";
import UpgradeModal from "@/components/UpgradeModal.jsx";

/* ── Helpers ── */
function fmt(n, d = 0) {
  if (n == null) return "—";
  return Math.abs(n).toLocaleString(undefined, {
    maximumFractionDigits: d,
    minimumFractionDigits: d,
  });
}
function fmtPnl(n, sym = "") {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : "-"}${sym}${fmt(Math.abs(n))}`;
}
function pc(n) {
  if (n == null || n === 0) return "#374151";
  return n > 0 ? "#059669" : "#dc2626";
}
function greet() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/* ── Mini P&L Chart ── */
function PnlChart({ series = [], sym = "" }) {
  const days = series.slice(-14);
  if (!days.length) {
    return (
      <div
        style={{
          height: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 13, color: "#9ca3af" }}>
          No data yet — log your first trade
        </span>
      </div>
    );
  }
  const vals = days.map((d) => d.pnl ?? 0);
  const max = Math.max(...vals.map(Math.abs), 1);
  const net = vals.reduce((s, v) => s + v, 0);
  return (
    <div>
      <div
        style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80 }}
      >
        {days.map((d, i) => {
          const v = d.pnl ?? 0;
          const pos = v >= 0;
          const h = Math.max((Math.abs(v) / max) * 100, 6);
          return (
            <div
              key={i}
              title={`${d.date}: ${v >= 0 ? "+" : ""}${sym}${fmt(Math.abs(v))}`}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                height: "100%",
                alignItems: "center",
                justifyContent: pos ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  width: "100%",
                  borderRadius: 3,
                  height: `${h}%`,
                  background: pos ? "#dcfce7" : "#fee2e2",
                  border: `1.5px solid ${pos ? "#10b981" : "#ef4444"}`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 10,
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
          {days[0]?.date?.slice(5) || ""}
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color: pc(net) }}>
          {fmtPnl(net, sym)} over {days.length} days
        </span>
        <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
          {days[days.length - 1]?.date?.slice(5) || ""}
        </span>
      </div>
    </div>
  );
}

/* ── Win Rate Arc ── */
function WinArc({ pct = 0, size = 72 }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const fill = (pct / 100) * circ;
  const clr = pct >= 60 ? "#059669" : pct >= 45 ? "#d97706" : "#dc2626";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      style={{ flexShrink: 0 }}
    >
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="#f3f4f6"
        strokeWidth="6"
      />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={clr}
        strokeWidth="6"
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
        strokeDashoffset={circ / 4}
      />
      <text
        x="32"
        y="37"
        textAnchor="middle"
        fill={clr}
        fontSize="12"
        fontWeight="800"
      >
        {pct}%
      </text>
    </svg>
  );
}

/* ── Settings Modal ── */
function SettingsModal({ journey, onSave, onClose }) {
  const sym = journey.currencySymbol || "$";
  const [capital, setCapital] = useState(journey.startingCapital ?? 10000);
  const [goal, setGoal] = useState(journey.goalCapital ?? 100000);
  const [days, setDays] = useState(journey.totalGoalDays ?? 365);
  const [goalDate, setGoalDate] = useState(journey.goalDate ?? "");
  const [startDate, setStartDate] = useState(
    journey.journeyStartDate ?? new Date().toISOString().slice(0, 10),
  );
  const [mode, setMode] = useState(journey.goalDate ? "date" : "days");
  const [reminder, setReminder] = useState(journey.reminderTime || "");
  const [saving, setSaving] = useState(false);

  const inp = {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    fontSize: 15,
    fontFamily: "inherit",
    outline: "none",
    fontWeight: 600,
    color: "#111",
    background: "#fff",
    boxSizing: "border-box",
  };
  const lbl = {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: 6,
  };

  async function save() {
    setSaving(true);
    await onSave({
      startingCapital: parseFloat(capital),
      goalCapital: parseFloat(goal),
      goalDays: mode === "days" ? parseInt(days) : null,
      goalDate: mode === "date" ? goalDate : null,
      journeyStartDate: startDate,
      reminderTime: reminder || null,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 440,
          padding: 32,
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 18, color: "#111" }}>
            Journey Settings
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#f3f4f6",
              border: "none",
              width: 32,
              height: 32,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
        {[
          [`Starting Capital (${sym})`, capital, setCapital, "number"],
          [`Goal Capital (${sym})`, goal, setGoal, "number"],
          ["Journey Start Date", startDate, setStartDate, "date"],
        ].map(([label, val, set, type]) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <label style={lbl}>{label}</label>
            <input
              type={type}
              value={val}
              onChange={(e) => set(e.target.value)}
              style={inp}
            />
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Timeline</label>
          <div
            style={{
              display: "flex",
              background: "#f3f4f6",
              borderRadius: 10,
              padding: 3,
              marginBottom: 10,
            }}
          >
            {[
              ["days", "# Days"],
              ["date", "Target Date"],
            ].map(([m, l]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  background: mode === m ? "#fff" : "transparent",
                  color: mode === m ? "#1a237e" : "#6b7280",
                  boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {l}
              </button>
            ))}
          </div>
          {mode === "days" ? (
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="365"
              style={inp}
            />
          ) : (
            <input
              type="date"
              value={goalDate}
              onChange={(e) => setGoalDate(e.target.value)}
              style={inp}
            />
          )}
        </div>
        <div style={{ marginBottom: 28 }}>
          <label style={lbl}>Pre-Market Reminder</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="time"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              style={{ ...inp, flex: 1 }}
            />
            {reminder && (
              <button
                onClick={async () => {
                  const p = await Notification.requestPermission();
                  if (p === "granted")
                    await showNotification(
                      "GrowthNotes ✅",
                      `Reminder set for ${reminder} daily.`,
                    );
                  else alert("Allow notifications in browser settings.");
                }}
                style={{
                  padding: "10px 14px",
                  background: "#ede9fe",
                  color: "#5b21b6",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Test 🔔
              </button>
            )}
          </div>
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <button
            onClick={onClose}
            style={{
              padding: 13,
              borderRadius: 12,
              border: "1.5px solid #e5e7eb",
              background: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 14,
              color: "#374151",
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: 13,
              borderRadius: 12,
              border: "none",
              background: "#1a237e",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 14,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard ── */
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboard, setShowOnboard] = useState(false);

  const [trial, setTrial] = useState(null); // { trialDaysLeft, trialExpired, tier }
  const [upgradeModal, setUpgradeModal] = useState(null); // null | 'founding' | 'pro'

  const load = useCallback(async () => {
    try {
      const [dr, ar, sr] = await Promise.all([
        authFetch("/api/dashboard-stats"),
        authFetch("/api/analytics"),
        authFetch("/api/user-settings"),
      ]);
      const dash = await dr.json();
      const ana = await ar.json().catch(() => null);
      const stg = await sr.json().catch(() => null);
      setData(dash);
      setAnalytics(ana);
      if (stg?.settings)
        setTrial({
          trialDaysLeft: stg.settings.trialDaysLeft,
          trialExpired: stg.settings.trialExpired,
          tier: stg.settings.tier,
        });
      if (dash.journey?.isSetup === false) setShowOnboard(true);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveSettings(u) {
    await authFetch("/api/user-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(u),
    });
    await load();
  }

  if (loading)
    return (
      <div style={{ padding: 28 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: i === 1 ? 40 : i === 2 ? 120 : 80,
              borderRadius: 16,
              background: "#f3f4f6",
              marginBottom: 16,
            }}
          />
        ))}
      </div>
    );

  const { allTime, today, week, preMarket, journey } = data || {};
  const sym = journey?.currencySymbol || "$";
  const pct = Math.min(100, Math.max(0, journey?.progress ?? 0));
  const bClr = pct >= 75 ? "#059669" : pct >= 40 ? "#d97706" : "#7c3aed";
  const date = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const days = analytics?.dailySeries || [];
  const insts = (analytics?.byInstrument || []).slice(0, 5);
  const streak = analytics?.summary?.streak ?? 0;
  const milestones = [25, 50, 75, 100];

  /* reusable card */
  const card = {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  };

  return (
    <>
      <style>{`
        .db { padding: 28px; max-width: 960px; }
        .db-row { display: grid; gap: 16px; margin-bottom: 16px; }
        .db-r4 { grid-template-columns: repeat(4, 1fr); }
        .db-r2 { grid-template-columns: 1fr 1fr; }
        .db-lbl { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
        .db-val { font-size: 26px; font-weight: 900; line-height: 1; }
        .db-sub { font-size: 12px; color: #9ca3af; margin-top: 5px; font-weight: 500; }
        .db-tile { display:flex; flex-direction:column; gap:6px; text-decoration:none; color:inherit; padding:18px; border-radius:14px; border:1px solid #e5e7eb; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.05); transition:border-color 0.15s,box-shadow 0.15s,transform 0.15s; }
        .db-tile:hover { border-color:#6366f1; box-shadow:0 4px 16px rgba(99,102,241,0.12); transform:translateY(-2px); }
        .db-tile-ic { font-size: 22px; }
        .db-tile-nm { font-size: 13px; font-weight: 800; color: #111; }
        .db-tile-ds { font-size: 11px; color: #9ca3af; line-height: 1.4; }
        .db-inst { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid #f3f4f6; }
        .db-inst:last-child { border-bottom:none; padding-bottom:0; }
        .db-inst-nm { font-size:13px; font-weight:700; color:#374151; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .db-inst-trk { flex:2; background:#f3f4f6; border-radius:4px; height:5px; overflow:hidden; }
        .db-inst-fill { height:100%; border-radius:4px; background:#059669; }
        .db-inst-pct { font-size:13px; font-weight:800; color:#059669; width:36px; text-align:right; }
        .db-inst-n { font-size:11px; color:#9ca3af; width:28px; text-align:right; }
        .db-tiles { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
        .db-wk { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
        .db-trial { display:flex; align-items:center; gap:12px; border-radius:12px; padding:12px 18px; margin-bottom:16px; flex-wrap:wrap; }
        .db-trial.warning { background:#fefce8; border:1px solid #fde047; }
        .db-trial.danger  { background:#fff1f2; border:1px solid #fecdd3; }
        .db-trial.expired { background:#0f172a; border:1px solid #1e293b; }
        .db-trial-a { margin-left:auto; font-size:12px; font-weight:800; text-decoration:none; padding:6px 14px; border-radius:20px; white-space:nowrap; }
        .db-hd { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:10px; }
        .db-meter { background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%); border-radius:18px; padding:26px 28px; margin-bottom:16px; position:relative; overflow:hidden; }
        .db-meter-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; flex-wrap:wrap; gap:10px; }
        @media (max-width:768px) {
          .db-meter { padding: 18px; border-radius:14px; }
          .db-hd { margin-bottom: 14px; }
        }
        @media (max-width:768px) {
          .db { padding: 0 0 24px; }
          .db-r4 { grid-template-columns: 1fr 1fr; gap: 10px; }
          .db-r2 { grid-template-columns: 1fr; gap: 10px; }
          .db-tiles { grid-template-columns: 1fr 1fr; gap: 10px; }
          .db-wk { grid-template-columns: 1fr 1fr; gap: 12px; }
          .db-row { gap: 10px; margin-bottom: 10px; }
          .db-val { font-size: 20px; }
        }
      `}</style>

      <div className="db">
        {showOnboard && (
          <OnboardingWizard
            onComplete={() => {
              setShowOnboard(false);
              load();
            }}
          />
        )}
        {showSettings && journey && (
          <SettingsModal
            journey={journey}
            onSave={saveSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
        {upgradeModal && (
          <UpgradeModal
            plan={upgradeModal}
            onClose={() => setUpgradeModal(null)}
          />
        )}

        {/* ── Header ── */}
        <div className="db-hd">
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: "#111",
                letterSpacing: "-0.5px",
              }}
            >
              {greet()}
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>
              {date}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {streak > 0 && (
              <span
                style={{
                  background: "#fef3c7",
                  border: "1px solid #fcd34d",
                  color: "#92400e",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "5px 12px",
                  borderRadius: 20,
                }}
              >
                🔥 {streak}-day streak
              </span>
            )}
            <button
              onClick={() => setShowSettings(true)}
              style={{
                padding: "8px 18px",
                borderRadius: 22,
                border: "1.5px solid #e5e7eb",
                background: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                color: "#374151",
              }}
            >
              ⚙ Settings
            </button>
          </div>
        </div>

        {/* ── Pre-market banner ── */}
        {preMarket?.filled ? (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 12,
              padding: "11px 18px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>
              ✅ Pre-market plan complete
            </span>
            {preMarket.marketBias && (
              <span style={{ fontSize: 12, color: "#166534", opacity: 0.8 }}>
                · Bias: {preMarket.marketBias}
              </span>
            )}
            {preMarket.profitTarget && (
              <span style={{ fontSize: 12, color: "#166534", opacity: 0.8 }}>
                · Target: {sym}
                {fmt(preMarket.profitTarget)}
              </span>
            )}
            <Link
              href="/journal"
              style={{
                marginLeft: "auto",
                fontSize: 12,
                color: "#166534",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Open Journal →
            </Link>
          </div>
        ) : (
          <Link
            href="/journal"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#fffbeb",
              border: "1px solid #fcd34d",
              borderRadius: 12,
              padding: "11px 18px",
              marginBottom: 16,
              textDecoration: "none",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>
              ⚡ Pre-market plan not filled — tap to start
            </span>
            <span style={{ fontSize: 12, color: "#92400e", fontWeight: 700 }}>
              Fill now →
            </span>
          </Link>
        )}

        {/* ── Trial banner ── */}
        {trial &&
          trial.tier === "free" &&
          (() => {
            const d = trial.trialDaysLeft;
            const expired = trial.trialExpired;
            const contactHref =
              "mailto:saikishor.patil@gmail.com?subject=GrowthNotes Founding Member&body=Hi, I%27d like to become a Founding Member of GrowthNotes.";
            if (expired)
              return (
                <div className="db-trial expired">
                  <span style={{ fontSize: 18 }}>🔒</span>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#f1f5f9",
                      }}
                    >
                      Your trial has ended
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}
                    >
                      Upgrade to keep your streak, journal, and analytics.
                    </div>
                  </div>
                  <Link
                    href="/upgrade"
                    className="db-trial-a"
                    style={{
                      background: "#00d97e",
                      color: "#000",
                      textDecoration: "none",
                    }}
                  >
                    Upgrade Now →
                  </Link>
                </div>
              );
            if (d <= 5)
              return (
                <div className={`db-trial ${d <= 2 ? "danger" : "warning"}`}>
                  <span style={{ fontSize: 18 }}>{d <= 2 ? "🚨" : "⏳"}</span>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: d <= 2 ? "#9f1239" : "#713f12",
                      }}
                    >
                      {d === 0
                        ? "Trial ends today!"
                        : `${d} day${d > 1 ? "s" : ""} left in your trial`}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: d <= 2 ? "#be123c" : "#92400e",
                        marginTop: 2,
                      }}
                    >
                      🌟 Founding Member offer — lock in the lowest price before
                      it's gone
                    </div>
                  </div>
                  <Link
                    href="/upgrade"
                    className="db-trial-a"
                    style={{
                      background: d <= 2 ? "#9f1239" : "#065f46",
                      color: "#fff",
                      textDecoration: "none",
                    }}
                  >
                    Claim Founding Deal →
                  </Link>
                </div>
              );
            return (
              <div
                className="db-trial warning"
                style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
              >
                <span style={{ fontSize: 16 }}>🎁</span>
                <span
                  style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}
                >
                  Free trial — <strong>{d} days remaining</strong>. Upgrade
                  anytime to keep full access.
                </span>
                <Link
                  href="/upgrade"
                  className="db-trial-a"
                  style={{
                    background: "#065f46",
                    color: "#fff",
                    textDecoration: "none",
                  }}
                >
                  View Plans →
                </Link>
              </div>
            );
          })()}

        {/* ── Today's KPIs ── */}
        <div className="db-row db-r4" style={{ marginBottom: 16 }}>
          {[
            {
              l: "Today's P&L",
              v: today?.netPnl != null ? fmtPnl(today.netPnl, sym) : "—",
              c: pc(today?.netPnl),
              s: `${today?.total ?? 0} trade${today?.total !== 1 ? "s" : ""}`,
            },
            {
              l: "Today Win %",
              v: today?.winRate != null ? `${today.winRate}%` : "—",
              c:
                (today?.winRate ?? 0) >= 50
                  ? "#059669"
                  : today?.winRate != null
                    ? "#dc2626"
                    : "#9ca3af",
              s:
                today?.total > 0
                  ? `${today.wins ?? 0}W · ${today.losses ?? 0}L`
                  : "no trades today",
            },
            {
              l: "Week P&L",
              v: week?.netPnl != null ? fmtPnl(week.netPnl, sym) : "—",
              c: pc(week?.netPnl),
              s: `${week?.total ?? 0} trades this week`,
            },
            {
              l: "Plan Discipline",
              v: week?.planPct != null ? `${week.planPct}%` : "—",
              c: (week?.planPct ?? 0) >= 70 ? "#059669" : "#d97706",
              s: "this week",
            },
          ].map((k) => (
            <div key={k.l} style={{ ...card, padding: "18px 20px" }}>
              <div className="db-lbl">{k.l}</div>
              <div className="db-val" style={{ color: k.c }}>
                {k.v}
              </div>
              <div className="db-sub">{k.s}</div>
            </div>
          ))}
        </div>

        {/* ── Growth Meter ── */}
        {journey && (
          <div className="db-meter">
            <div
              style={{
                position: "absolute",
                top: "-30%",
                right: "-5%",
                width: "40%",
                height: "160%",
                background:
                  "radial-gradient(ellipse, rgba(124,58,237,0.3) 0%, transparent 65%)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div className="db-meter-top">
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.4)",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    Growth Meter · Day {journey.journeyDay} of{" "}
                    {journey.totalGoalDays}
                  </div>
                  <div
                    style={{
                      fontSize: 38,
                      fontWeight: 900,
                      color: "#fff",
                      lineHeight: 1,
                      letterSpacing: "-1.5px",
                    }}
                  >
                    {sym}
                    {fmt(journey.currentCapital)}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.4)",
                      marginTop: 7,
                    }}
                  >
                    Started {sym}
                    {fmt(journey.startingCapital)} &nbsp;·&nbsp; Goal {sym}
                    {fmt(journey.goalCapital)}
                    {journey.daysRemaining != null && (
                      <>&nbsp;·&nbsp; {journey.daysRemaining}d remaining</>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 38,
                      fontWeight: 900,
                      color: "#fff",
                      lineHeight: 1,
                      letterSpacing: "-1.5px",
                    }}
                  >
                    {pct.toFixed(1)}%
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.4)",
                      marginTop: 6,
                    }}
                  >
                    {sym}
                    {fmt(journey.goalCapital - journey.currentCapital)} to goal
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 99,
                  height: 8,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 99,
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${bClr}, #a7f3d0)`,
                    boxShadow: `0 0 12px ${bClr}88`,
                    transition: "width 1.2s ease",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 8,
                }}
              >
                {milestones.map((m) => (
                  <span
                    key={m}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: pct >= m ? "#a7f3d0" : "rgba(255,255,255,0.2)",
                    }}
                  >
                    {m}%{m === 100 ? " 🏆" : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── All-time stats ── */}
        <div className="db-row db-r4" style={{ marginBottom: 16 }}>
          {[
            {
              l: "Total Trades",
              v: allTime?.total ?? 0,
              c: "#111",
              s: `${allTime?.wins ?? 0}W · ${allTime?.losses ?? 0}L`,
            },
            {
              l: "All-Time Win %",
              v: allTime?.winRate != null ? `${allTime.winRate}%` : "—",
              c: (allTime?.winRate ?? 0) >= 50 ? "#059669" : "#dc2626",
              s: "",
            },
            {
              l: "All-Time P&L",
              v: allTime?.netPnl != null ? fmtPnl(allTime.netPnl, sym) : "—",
              c: pc(allTime?.netPnl),
              s: "",
            },
            {
              l: "Days Journaled",
              v: allTime?.daysJournaled ?? 0,
              c: "#111",
              s: `of ${journey?.journeyDay ?? "—"} days`,
            },
          ].map((s) => (
            <div key={s.l} style={{ ...card, padding: "16px 18px" }}>
              <div className="db-lbl">{s.l}</div>
              <div className="db-val" style={{ fontSize: 22, color: s.c }}>
                {s.v}
              </div>
              {s.s && <div className="db-sub">{s.s}</div>}
            </div>
          ))}
        </div>

        {/* ── P&L Chart + Instruments ── */}
        <div className="db-row db-r2" style={{ marginBottom: 16 }}>
          {/* Chart */}
          <div style={{ ...card, padding: "20px 22px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>
                14-Day P&L
              </div>
              <Link
                href="/analytics"
                style={{
                  fontSize: 12,
                  color: "#6366f1",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Full Analytics →
              </Link>
            </div>
            <PnlChart series={days} sym={sym} />
          </div>

          {/* Instruments */}
          <div style={{ ...card, padding: "20px 22px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>
                Win Rate by Instrument
              </div>
              {allTime?.winRate != null && <WinArc pct={allTime.winRate} />}
            </div>
            {insts.length === 0 ? (
              <div
                style={{
                  fontSize: 13,
                  color: "#9ca3af",
                  padding: "20px 0",
                  textAlign: "center",
                }}
              >
                Log trades to see breakdown
              </div>
            ) : (
              insts.map((inst) => (
                <div key={inst.instrument} className="db-inst">
                  <div className="db-inst-nm">
                    {inst.instrument || "Unknown"}
                  </div>
                  <div className="db-inst-trk">
                    <div
                      className="db-inst-fill"
                      style={{ width: `${inst.winRate}%` }}
                    />
                  </div>
                  <div className="db-inst-pct">{inst.winRate}%</div>
                  <div className="db-inst-n">{inst.total}t</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── This Week ── */}
        <div style={{ ...card, padding: "20px 24px", marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>
              This Week
            </div>
            <Link
              href="/weekly"
              style={{
                fontSize: 12,
                color: "#6366f1",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Weekly Review →
            </Link>
          </div>
          <div className="db-wk">
            {[
              {
                l: "Net P&L",
                v: week?.netPnl != null ? fmtPnl(week.netPnl, sym) : "—",
                c: pc(week?.netPnl),
                s: "",
              },
              {
                l: "Win Rate",
                v: week?.winRate != null ? `${week.winRate}%` : "—",
                c: (week?.winRate ?? 0) >= 50 ? "#059669" : "#dc2626",
                s: week?.total ? `${week.wins}W · ${week.losses}L` : "",
              },
              {
                l: "Plan %",
                v: week?.planPct != null ? `${week.planPct}%` : "—",
                c: (week?.planPct ?? 0) >= 70 ? "#059669" : "#d97706",
                s: "discipline",
              },
              { l: "Trades", v: week?.total ?? 0, c: "#111", s: "this week" },
            ].map((s) => (
              <div key={s.l}>
                <div className="db-lbl">{s.l}</div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: s.c,
                    lineHeight: 1,
                  }}
                >
                  {s.v}
                </div>
                {s.s && <div className="db-sub">{s.s}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ── Nav tiles ── */}
        <div className="db-tiles">
          {[
            {
              href: "/journal",
              ic: "📓",
              nm: "Today's Journal",
              ds: "Pre-market · trades · reflection",
            },
            {
              href: "/plan",
              ic: "🗂️",
              nm: "Pre-Market Plan",
              ds: "IF/THEN scenarios before open",
            },
            {
              href: "/analytics",
              ic: "📊",
              nm: "Full Analytics",
              ds: "Charts · heatmap · psychology",
            },
            {
              href: "/weekly",
              ic: "📅",
              nm: "Weekly Review",
              ds: "Rate the week · set next focus",
            },
          ].map((t) => (
            <Link key={t.href} href={t.href} className="db-tile">
              <span className="db-tile-ic">{t.ic}</span>
              <span className="db-tile-nm">{t.nm}</span>
              <span className="db-tile-ds">{t.ds}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
