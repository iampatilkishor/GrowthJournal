"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthGate.jsx";
import { authFetch } from "@/lib/authFetch.js";

/* ─── Broker definitions ─────────────────────────────────────────────────── */
const BROKERS = [
  {
    id: "upstox",
    name: "Upstox",
    tagline: "Fast execution, modern API",
    icon: "🟣",
    color: "#6c3fdf",
    bg: "#f3efff",
    live: true,
  },
  {
    id: "zerodha",
    name: "Zerodha",
    tagline: "India's largest stock broker",
    icon: "🔵",
    color: "#387ed1",
    bg: "#eff5ff",
    live: false,
  },
  {
    id: "dhan",
    name: "Dhan",
    tagline: "Commission-free, feature-rich",
    icon: "🟢",
    color: "#00b386",
    bg: "#eafaf6",
    live: false,
  },
];

/* ─── Broker selector ────────────────────────────────────────────────────── */
function BrokerSelector({ email, userId, onConnected }) {
  const [expanded, setExpanded] = useState(null);
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function toggleBroker(broker) {
    if (!broker.live) return;
    setExpanded((prev) => (prev === broker.id ? null : broker.id));
    setError("");
    setSuccess("");
    setTokenInput("");
  }

  async function handleOAuthLogin() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login-url");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || "Failed to get login URL.");
      setLoading(false);
    }
  }

  async function handleTokenSave() {
    if (!tokenInput.trim()) {
      setError("Paste your access token first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/set-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: tokenInput.trim(),
          supabase_user_id: userId,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccess("Token saved! Loading profile…");
      await onConnected();
    } catch (err) {
      setError(err.message || "Failed to save token.");
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "600px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 800,
            margin: "0 0 6px",
            color: "var(--text)",
          }}
        >
          Connect Your Broker
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Link your broker account to enable live watchlist, order execution,
          and margin data.
        </p>
      </div>

      <div
        style={{
          background: "#e3f2fd",
          border: "1px solid #90caf9",
          borderRadius: "12px",
          padding: "12px 16px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span style={{ fontSize: "18px" }}>✉️</span>
        <div>
          <div
            style={{
              fontSize: "11px",
              color: "#1565c0",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Connecting as
          </div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#1565c0" }}>
            {email}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {BROKERS.map((broker) => {
          const isOpen = expanded === broker.id;
          return (
            <div
              key={broker.id}
              style={{
                background: "#fff",
                border: `1.5px solid ${isOpen ? broker.color : broker.live ? broker.color + "44" : "var(--border)"}`,
                borderRadius: "14px",
                overflow: "hidden",
                opacity: broker.live ? 1 : 0.6,
                transition: "border-color 0.2s",
              }}
            >
              <div
                onClick={() => toggleBroker(broker)}
                style={{
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  cursor: broker.live ? "pointer" : "default",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: broker.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    flexShrink: 0,
                  }}
                >
                  {broker.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "15px",
                      color: "var(--text)",
                    }}
                  >
                    {broker.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginTop: "1px",
                    }}
                  >
                    {broker.tagline}
                  </div>
                </div>
                {broker.live ? (
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: isOpen ? broker.color : "var(--text-muted)",
                      flexShrink: 0,
                    }}
                  >
                    {isOpen ? "▲ Close" : "Connect →"}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#9e9e9e",
                      background: "#f5f5f5",
                      padding: "5px 12px",
                      borderRadius: "8px",
                      flexShrink: 0,
                    }}
                  >
                    Coming Soon
                  </span>
                )}
              </div>

              {isOpen && (
                <div
                  style={{
                    borderTop: `1px solid ${broker.color}33`,
                    padding: "18px 18px 20px",
                    background: broker.bg + "66",
                  }}
                >
                  {error && (
                    <div
                      style={{
                        background: "#fce4ec",
                        border: "1px solid #ef9a9a",
                        borderRadius: "8px",
                        padding: "9px 12px",
                        marginBottom: "14px",
                        fontSize: "13px",
                        color: "#b71c1c",
                      }}
                    >
                      {error}
                    </div>
                  )}
                  {success && (
                    <div
                      style={{
                        background: "#e8f5e9",
                        border: "1px solid #a5d6a7",
                        borderRadius: "8px",
                        padding: "9px 12px",
                        marginBottom: "14px",
                        fontSize: "13px",
                        color: "#2e7d32",
                      }}
                    >
                      {success}
                    </div>
                  )}

                  <div style={{ marginBottom: "14px" }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--text)",
                        marginBottom: "8px",
                      }}
                    >
                      Option 1 — Paste Access Token
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        marginBottom: "10px",
                        lineHeight: 1.5,
                      }}
                    >
                      Already have an access token from {broker.name}? Paste it
                      directly.
                    </div>
                    <div style={{ position: "relative", marginBottom: "8px" }}>
                      <input
                        type={showToken ? "text" : "password"}
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        onPaste={(e) => {
                          setTokenInput(e.clipboardData.getData("text").trim());
                          e.preventDefault();
                        }}
                        placeholder="Paste your access token here…"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        style={{
                          width: "100%",
                          padding: "10px 40px 10px 12px",
                          border: "1.5px solid var(--border)",
                          borderRadius: "9px",
                          fontSize: "13px",
                          outline: "none",
                          boxSizing: "border-box",
                          background: "#fff",
                          color: "var(--text)",
                          fontFamily: "monospace",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken((v) => !v)}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "16px",
                          color: "var(--text-muted)",
                          padding: 0,
                        }}
                      >
                        {showToken ? "👁️" : "🙈"}
                      </button>
                    </div>
                    <button
                      onClick={handleTokenSave}
                      disabled={loading || !tokenInput.trim()}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "9px",
                        border: "none",
                        background: broker.color,
                        color: "#fff",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor:
                          loading || !tokenInput.trim()
                            ? "not-allowed"
                            : "pointer",
                        opacity: loading || !tokenInput.trim() ? 0.6 : 1,
                      }}
                    >
                      {loading ? "Saving…" : "💾 Save Token"}
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      margin: "16px 0",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        background: broker.color + "44",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        fontWeight: 600,
                      }}
                    >
                      OR
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        background: broker.color + "44",
                      }}
                    />
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--text)",
                        marginBottom: "6px",
                      }}
                    >
                      Option 2 — Login with {broker.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        marginBottom: "10px",
                        lineHeight: 1.5,
                      }}
                    >
                      Redirects you to {broker.name} to authorize GrowthNotes.
                    </div>
                    <button
                      onClick={handleOAuthLogin}
                      disabled={loading}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "9px",
                        border: `1.5px solid ${broker.color}`,
                        background: "#fff",
                        color: broker.color,
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      {loading
                        ? "Redirecting…"
                        : `🔐 Login with ${broker.name}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p
        style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          marginTop: "16px",
          lineHeight: 1.6,
        }}
      >
        🔒 GrowthNotes never stores your broker password.
      </p>
    </div>
  );
}

/* ─── Connected broker profile ───────────────────────────────────────────── */
function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "13px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>
        {label}
      </span>
      <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text)" }}>
        {value}
      </span>
    </div>
  );
}

function ConnectedProfile({ isMobile, onDisconnected }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  useEffect(() => {
    authFetch("/api/user/profile")
      .then(async (r) => {
        const d = await r.json();
        if (r.status === 401 || d.error === "TOKEN_EXPIRED") {
          await onDisconnected();
          return;
        }
        if (d.error) throw new Error(d.error);
        setProfile(d.profile);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await authFetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supabase_user_id: user?.id }),
      });
      await onDisconnected();
    } catch {
      setDisconnecting(false);
    }
  }

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "40vh",
          color: "var(--text-muted)",
        }}
      >
        Loading broker profile…
      </div>
    );

  if (error || !profile)
    return (
      <div
        className="card"
        style={{
          maxWidth: "420px",
          textAlign: "center",
          borderLeft: "4px solid var(--sell)",
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
        <div
          style={{ fontWeight: 700, color: "var(--sell)", marginBottom: "8px" }}
        >
          Failed to load broker profile
        </div>
        <div
          style={{
            color: "var(--text-muted)",
            fontSize: "14px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
        <button
          onClick={onDisconnected}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: "var(--primary)",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reconnect Broker
        </button>
      </div>
    );

  const initials = (profile.user_name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const brokerColor = profile.broker === "ZERODHA" ? "#387ed1" : "#6c3fdf";

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "320px 1fr",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* Left: identity card */}
        <div
          className="card"
          style={{ textAlign: "center", padding: "28px 20px" }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${brokerColor}, var(--primary))`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              fontSize: "24px",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {initials}
          </div>
          <div
            style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}
          >
            {profile.user_name || "—"}
          </div>
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: "13px",
              marginBottom: "14px",
            }}
          >
            {profile.email || "—"}
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 14px",
              borderRadius: "20px",
              background: brokerColor + "18",
              color: brokerColor,
              fontWeight: 700,
              fontSize: "12px",
              marginBottom: "16px",
            }}
          >
            🏦 {profile.broker}
          </div>

          <div style={{ marginBottom: "14px" }}>
            {!confirmDisconnect ? (
              <button
                onClick={() => setConfirmDisconnect(true)}
                style={{
                  padding: "6px 16px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "1.5px solid #ef9a9a",
                  background: "#fff",
                  color: "#c62828",
                  cursor: "pointer",
                }}
              >
                🔌 Disconnect Broker
              </button>
            ) : (
              <div
                style={{
                  background: "#fce4ec",
                  border: "1px solid #ef9a9a",
                  borderRadius: "10px",
                  padding: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#b71c1c",
                    marginBottom: "10px",
                  }}
                >
                  Remove broker access?
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "center",
                  }}
                >
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      border: "none",
                      background: "#c62828",
                      color: "#fff",
                      cursor: disconnecting ? "not-allowed" : "pointer",
                      opacity: disconnecting ? 0.7 : 1,
                    }}
                  >
                    {disconnecting ? "Disconnecting…" : "Yes, Disconnect"}
                  </button>
                  <button
                    onClick={() => setConfirmDisconnect(false)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      border: "1px solid var(--border)",
                      background: "#fff",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 600,
                background: profile.is_active ? "#e8f5e9" : "#fce4ec",
                color: profile.is_active ? "var(--buy)" : "var(--sell)",
              }}
            >
              {profile.is_active ? "● Active" : "● Inactive"}
            </span>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 600,
                background: "#f5f5f5",
                color: "#555",
                textTransform: "capitalize",
              }}
            >
              {profile.user_type || "individual"}
            </span>
          </div>
          <div
            style={{
              borderTop: "1px solid var(--border)",
              marginTop: "20px",
              paddingTop: "16px",
            }}
          >
            <InfoRow label="User ID" value={profile.user_id || "—"} />
            <div
              style={{
                padding: "13px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                  POA
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "12px",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    background: profile.poa ? "#e8f5e9" : "#f5f5f5",
                    color: profile.poa ? "var(--buy)" : "#757575",
                  }}
                >
                  {profile.poa ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
            <div style={{ padding: "13px 0" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                  DDPI
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "12px",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    background: profile.ddpi ? "#e8f5e9" : "#f5f5f5",
                    color: profile.ddpi ? "var(--buy)" : "#757575",
                  }}
                >
                  {profile.ddpi ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: capabilities */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "14px",
              }}
            >
              <span style={{ fontSize: "20px" }}>🏛️</span>
              <div>
                <div className="card-title" style={{ marginBottom: 0 }}>
                  Enabled Exchanges
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                  }}
                >
                  {(profile.exchanges || []).length} exchange
                  {(profile.exchanges || []).length !== 1 ? "s" : ""} enabled
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {(profile.exchanges || []).map((ex) => (
                <span
                  key={ex}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "14px",
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    border: "1px solid #c5cae9",
                  }}
                >
                  {ex}
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "14px",
              }}
            >
              <span style={{ fontSize: "20px" }}>📦</span>
              <div>
                <div className="card-title" style={{ marginBottom: 0 }}>
                  Enabled Products
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                  }}
                >
                  Order product types on your account
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {(profile.products || []).map((p) => {
                const labels = {
                  D: { name: "Delivery (CNC)", color: "#1976d2" },
                  I: { name: "Intraday (MIS)", color: "#2e7d32" },
                  CO: { name: "Cover Order", color: "#6a1b9a" },
                  MIS: { name: "Intraday (MIS)", color: "#2e7d32" },
                  CNC: { name: "Delivery (CNC)", color: "#1976d2" },
                  NRML: { name: "Normal (NRML)", color: "#e65100" },
                };
                const info = labels[p] || { name: p, color: "#546e7a" };
                return (
                  <div
                    key={p}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      background: info.color + "12",
                      border: `1px solid ${info.color}44`,
                      textAlign: "center",
                      minWidth: "90px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "15px",
                        color: info.color,
                      }}
                    >
                      {p}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#666",
                        marginTop: "3px",
                      }}
                    >
                      {info.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "14px",
              }}
            >
              <span style={{ fontSize: "20px" }}>⚡</span>
              <div>
                <div className="card-title" style={{ marginBottom: 0 }}>
                  Supported Order Types
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                  }}
                >
                  Order types available on this account
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {(profile.order_types || []).map((ot) => {
                const colors = {
                  MARKET: "#2e7d32",
                  LIMIT: "#1565c0",
                  SL: "#e65100",
                  "SL-M": "#6a1b9a",
                };
                const c = colors[ot] || "#546e7a";
                return (
                  <span
                    key={ot}
                    style={{
                      padding: "8px 18px",
                      borderRadius: "8px",
                      fontWeight: 700,
                      fontSize: "14px",
                      background: c + "12",
                      color: c,
                      border: `1px solid ${c}44`,
                    }}
                  >
                    {ot}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function BrokerPage() {
  const { user, tier, refreshTier } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isConnected = tier === "connected";

  return (
    <div style={{ paddingBottom: isMobile ? "80px" : "0" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 4px" }}>
          🔗 Broker Connection
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>
          {isConnected
            ? "Your broker account is connected."
            : "Connect your broker to enable live trading features."}
        </p>
      </div>

      {isConnected ? (
        <ConnectedProfile isMobile={isMobile} onDisconnected={refreshTier} />
      ) : (
        <BrokerSelector
          email={user?.email}
          userId={user?.id}
          onConnected={refreshTier}
        />
      )}
    </div>
  );
}
