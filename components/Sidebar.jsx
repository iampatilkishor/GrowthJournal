"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTodayPlan } from "@/hooks/useTodayPlan.js";
import { useAuth } from "@/components/AuthGate.jsx";

/* ─── Tier access ──────────────────────────────────────────────────────── */
const TIER_REQUIRED = {
  "/dashboard": "user",
  "/plan": "user",
  "/watchlist": "connected",
  "/order": "connected",
  "/journal": "user",
  "/weekly": "user",
  "/rules": "user",
  "/assess": "public",
  "/tools": "public",
  "/profile": "user",
  "/broker": "user",
};

function canAccess(href, tier) {
  const req = TIER_REQUIRED[href] || "public";
  if (req === "public") return true;
  // Expired users can access upgrade and profile only
  if (tier === "expired") return href === "/upgrade" || href === "/profile";
  if (req === "user") return tier === "user" || tier === "connected";
  if (req === "connected") return tier === "connected";
  return false;
}

function scoreColor(score) {
  if (score == null) return "#78909c";
  if (score >= 70) return "#2e7d32";
  if (score >= 40) return "#f57c00";
  return "#c62828";
}

function TierBadge({ tier, email }) {
  const map = {
    connected: { label: "Broker Connected", color: "#2e7d32", bg: "#e8f5e9" },
    user: { label: "Free Account", color: "#1565c0", bg: "#e3f2fd" },
    expired: { label: "Trial Expired", color: "#9f1239", bg: "#fff1f2" },
    guest: { label: "Guest", color: "#757575", bg: "#f5f5f5" },
  };
  const t = map[tier] || map.guest;
  return (
    <div
      style={{
        padding: "10px 14px",
        background: t.bg,
        borderRadius: "10px",
        marginBottom: "4px",
      }}
    >
      <div style={{ fontSize: "12px", fontWeight: 700, color: t.color }}>
        {t.label}
      </div>
      {email && (
        <div style={{ fontSize: "11px", color: "#9e9e9e", marginTop: "2px" }}>
          {email}
        </div>
      )}
    </div>
  );
}

/* ─── Mobile nav config ────────────────────────────────────────────────── */
// PRIMARY = bottom bar tabs (max 4 + More button = 5 total)
// MORE = sheet items (everything NOT in primary bar)
// No item appears in both lists.

function getMobileNav(tier) {
  if (tier === "connected") {
    return {
      primary: [
        { href: "/dashboard", label: "Dashboard", icon: "📊" },
        { href: "/journal", label: "Journal", icon: "📓" },
        { href: "/watchlist", label: "Watchlist", icon: "👁️" },
        { href: "/order", label: "Orders", icon: "⚡" },
      ],
      more: [
        { href: "/plan", label: "Plan", icon: "📋" },
        { href: "/weekly", label: "Weekly", icon: "📅" },
        { href: "/analytics", label: "Analytics", icon: "📈" },
        { href: "/rules", label: "Rules", icon: "📌" },
        { href: "/assess", label: "Assess", icon: "🎯" },
        { href: "/tools", label: "Tools", icon: "🧮" },
        { href: "/profile", label: "Profile", icon: "👤" },
      ],
    };
  }
  if (tier === "user") {
    return {
      primary: [
        { href: "/dashboard", label: "Dashboard", icon: "📊" },
        { href: "/journal", label: "Journal", icon: "📓" },
        { href: "/plan", label: "Plan", icon: "📋" },
        { href: "/weekly", label: "Weekly", icon: "📅" },
      ],
      more: [
        { href: "/analytics", label: "Analytics", icon: "📈" },
        { href: "/rules", label: "Rules", icon: "📌" },
        { href: "/assess", label: "Assess", icon: "🎯" },
        { href: "/tools", label: "Tools", icon: "🧮" },
        { href: "/profile", label: "Profile", icon: "👤" },
      ],
    };
  }
  // guest
  return {
    primary: [
      { href: "/", label: "Home", icon: "🏠" },
      { href: "/tools", label: "Tools", icon: "🧮" },
      { href: "/assess", label: "Assess", icon: "🎯" },
    ],
    more: [],
  };
}

/* ─── Desktop sidebar nav links ─────────────────────────────────────────── */
function getDesktopNav(tier) {
  return [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/plan", label: "Plan", icon: "📋" },
    ...(tier === "connected"
      ? [
          { href: "/watchlist", label: "Watchlist", icon: "👁️" },
          { href: "/order", label: "Orders", icon: "⚡" },
        ]
      : []),
    { href: "/journal", label: "Journal", icon: "📓" },
    { href: "/weekly", label: "Weekly", icon: "📅" },
    { href: "/analytics", label: "Analytics", icon: "📈" },
    { href: "/rules", label: "Rules", icon: "📌" },
    { href: "/assess", label: "Assess", icon: "🎯" },
    { href: "/tools", label: "Tools", icon: "🧮" },
    { href: "/profile", label: "Profile", icon: "👤" },
  ];
}

/* ─── Sidebar ──────────────────────────────────────────────────────────── */
export default function Sidebar() {
  const pathname = usePathname();
  const { plan } = useTodayPlan();
  const { logout, tier, user } = useAuth();
  const score = plan?.adherenceScore ?? null;

  const [isMobile, setIsMobile] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Close more sheet when navigating
  useEffect(() => {
    setShowMore(false);
  }, [pathname]);

  if (pathname === "/login") return null;

  const { primary, more } = getMobileNav(tier);
  const desktopNav = getDesktopNav(tier);

  /* ── MOBILE ── */
  if (isMobile) {
    return (
      <>
        {/* More sheet overlay */}
        {showMore && (
          <>
            <div
              onClick={() => setShowMore(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 299,
                background: "rgba(0,0,0,0.4)",
              }}
            />
            <div
              style={{
                position: "fixed",
                bottom: "60px",
                left: 0,
                right: 0,
                zIndex: 300,
                background: "#fff",
                borderRadius: "20px 20px 0 0",
                boxShadow: "0 -4px 32px rgba(0,0,0,0.15)",
                padding: "16px 0 8px",
                maxHeight: "70vh",
                overflowY: "auto",
              }}
            >
              {/* Drag handle */}
              <div
                style={{
                  width: "40px",
                  height: "4px",
                  background: "#e0e0e0",
                  borderRadius: "2px",
                  margin: "0 auto 18px",
                }}
              />

              {/* Account info */}
              <div style={{ padding: "0 16px 12px" }}>
                <TierBadge tier={tier} email={user?.email} />
              </div>

              {/* More nav items */}
              {more.map(({ href, label, icon }) => {
                const active = pathname === href;
                const accessible = canAccess(href, tier);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setShowMore(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "13px 20px",
                      textDecoration: "none",
                      color: active
                        ? "var(--primary)"
                        : accessible
                          ? "var(--text)"
                          : "#ccc",
                      fontWeight: active ? 800 : 500,
                      fontSize: "15px",
                      background: active
                        ? "var(--primary-light)"
                        : "transparent",
                      borderLeft: active
                        ? "3px solid var(--primary)"
                        : "3px solid transparent",
                      transition: "all 0.15s",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "22px",
                        width: "28px",
                        textAlign: "center",
                      }}
                    >
                      {accessible ? icon : "🔒"}
                    </span>
                    <span style={{ flex: 1 }}>{label}</span>
                    {!accessible && (
                      <span style={{ fontSize: "11px", color: "#bbb" }}>
                        Login required
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Upgrade CTA for logged-in users */}
              {(tier === "user" ||
                tier === "connected" ||
                tier === "expired") && (
                <div style={{ padding: "8px 16px" }}>
                  <Link
                    href="/upgrade"
                    onClick={() => setShowMore(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "13px 16px",
                      borderRadius: 14,
                      textDecoration: "none",
                      background: "linear-gradient(135deg,#0d4f2e,#065f46)",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: 15,
                    }}
                  >
                    <span
                      style={{ fontSize: 22, width: 28, textAlign: "center" }}
                    >
                      ⬆️
                    </span>
                    <span style={{ flex: 1 }}>Upgrade to Pro</span>
                    <span style={{ fontSize: 12, opacity: 0.8 }}>→</span>
                  </Link>
                </div>
              )}

              {/* Divider */}
              <div
                style={{
                  height: "1px",
                  background: "var(--border)",
                  margin: "8px 0",
                }}
              />

              {/* Auth action */}
              {tier === "guest" ? (
                <Link
                  href="/login"
                  onClick={() => setShowMore(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "13px 20px",
                    textDecoration: "none",
                    color: "var(--primary)",
                    fontWeight: 700,
                    fontSize: "15px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "22px",
                      width: "28px",
                      textAlign: "center",
                    }}
                  >
                    🔐
                  </span>
                  <span>Log In / Register</span>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setShowMore(false);
                    logout();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "13px 20px",
                    width: "100%",
                    background: "none",
                    border: "none",
                    color: "var(--sell)",
                    fontWeight: 600,
                    fontSize: "15px",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      fontSize: "22px",
                      width: "28px",
                      textAlign: "center",
                    }}
                  >
                    🚪
                  </span>
                  <span>Logout</span>
                </button>
              )}
              {/* Safe area padding for iPhone */}
              <div style={{ height: "8px" }} />
            </div>
          </>
        )}

        {/* Bottom tab bar */}
        <nav
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 200,
            background: "#fff",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "stretch",
            boxShadow: "0 -2px 16px rgba(0,0,0,0.08)",
            height: "60px",
          }}
        >
          {primary.map(({ href, label, icon }) => {
            const active = pathname === href;
            const accessible = canAccess(href, tier);
            return (
              <Link
                key={href}
                href={accessible ? href : "/login"}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "3px",
                  textDecoration: "none",
                  color: active ? "var(--primary)" : "#9e9e9e",
                  fontSize: "10px",
                  fontWeight: active ? 800 : 500,
                  borderTop: active
                    ? "2px solid var(--primary)"
                    : "2px solid transparent",
                  background: active ? "var(--primary-light)" : "transparent",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: "20px", lineHeight: 1 }}>
                  {accessible ? icon : "🔒"}
                </span>
                <span style={{ letterSpacing: "0.1px" }}>{label}</span>
              </Link>
            );
          })}

          {/* More button — always last */}
          <button
            onClick={() => setShowMore((v) => !v)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              background: showMore ? "var(--primary-light)" : "transparent",
              border: "none",
              cursor: "pointer",
              color: showMore ? "var(--primary)" : "#9e9e9e",
              fontSize: "10px",
              fontWeight: showMore ? 800 : 500,
              borderTop: showMore
                ? "2px solid var(--primary)"
                : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: "20px", lineHeight: 1 }}>
              {showMore ? "✕" : "···"}
            </span>
            <span>More</span>
          </button>
        </nav>
      </>
    );
  }

  /* ── DESKTOP sidebar ── */
  return (
    <aside
      style={{
        width: "220px",
        flexShrink: 0,
        background: "#fff",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 20px 12px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "20px" }}>📈</span>
          <span
            style={{
              fontSize: "17px",
              fontWeight: 900,
              color: "var(--primary)",
              letterSpacing: "-0.3px",
            }}
          >
            GrowthNotes
          </span>
        </Link>
      </div>

      {/* Score strip */}
      {tier !== "guest" && score != null && (
        <div
          style={{
            padding: "8px 16px",
            background: "var(--primary-light)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              fontWeight: 600,
            }}
          >
            Today's score{" "}
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 800,
              color: scoreColor(score),
            }}
          >
            {score}%
          </span>
        </div>
      )}

      {/* Nav links */}
      <nav style={{ padding: "10px 10px", flex: 1 }}>
        {desktopNav.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const accessible = canAccess(href, tier);
          return (
            <Link
              key={href}
              href={accessible ? href : "/login"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "10px",
                marginBottom: "2px",
                textDecoration: "none",
                fontSize: "14px",
                color: active
                  ? "var(--primary)"
                  : accessible
                    ? "var(--text)"
                    : "#bdbdbd",
                fontWeight: active ? 800 : 500,
                background: active ? "var(--primary-light)" : "transparent",
                transition: "all 0.15s",
              }}
            >
              <span
                style={{ fontSize: "17px", width: "22px", textAlign: "center" }}
              >
                {accessible ? icon : "🔒"}
              </span>
              <span style={{ flex: 1 }}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Upgrade CTA — shown for free/trial users */}
      {(tier === "user" || tier === "connected" || tier === "expired") && (
        <div style={{ padding: "0 10px 10px" }}>
          <Link
            href="/upgrade"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 12px",
              borderRadius: 12,
              textDecoration: "none",
              background: "linear-gradient(135deg,#0d4f2e,#065f46)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 13,
              boxShadow: "0 2px 10px rgba(6,95,70,0.3)",
            }}
          >
            <span style={{ fontSize: 16 }}>⬆️</span>
            <span style={{ flex: 1 }}>Upgrade to Pro</span>
            <span style={{ fontSize: 11, opacity: 0.8 }}>→</span>
          </Link>
        </div>
      )}

      {/* Footer */}
      <div
        style={{ padding: "12px 10px", borderTop: "1px solid var(--border)" }}
      >
        <div style={{ padding: "8px 12px", marginBottom: "4px" }}>
          <div
            style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)" }}
          >
            {user?.email || "Guest"}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              marginTop: "1px",
              textTransform: "capitalize",
            }}
          >
            {tier}
          </div>
        </div>
        {tier === "guest" ? (
          <Link
            href="/login"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 12px",
              borderRadius: "10px",
              textDecoration: "none",
              color: "var(--primary)",
              fontWeight: 700,
              fontSize: "14px",
              background: "var(--primary-light)",
            }}
          >
            <span>🔐</span>
            <span>Log In</span>
          </Link>
        ) : (
          <button
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 12px",
              width: "100%",
              borderRadius: "10px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--sell)",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        )}
      </div>
    </aside>
  );
}
