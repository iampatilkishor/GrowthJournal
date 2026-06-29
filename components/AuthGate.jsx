"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { setSessionToken, authFetch } from "@/lib/authFetch.js";
import Sidebar from "@/components/Sidebar.jsx";
import PremarketReminder from "@/components/PremarketReminder.jsx";
import PublicHeader from "@/components/PublicHeader.jsx";
import AnnouncementBanner from "@/components/AnnouncementBanner.jsx";
import TestModeBanner from "@/components/TestModeBanner.jsx";

/* ─── Broker gate overlay ─────────────────────────────────────────────────── */
function BrokerGate({ email, onBack }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "40px 36px",
          border: "1.5px solid var(--border)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "#fff3e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            margin: "0 auto 20px",
          }}
        >
          🔗
        </div>

        <h2
          style={{
            fontSize: "20px",
            fontWeight: 800,
            color: "var(--text)",
            margin: "0 0 10px",
          }}
        >
          Broker Connection Required
        </h2>

        <p
          style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            lineHeight: 1.6,
            margin: "0 0 16px",
          }}
        >
          This page requires a connected broker account.
        </p>

        <div
          style={{
            background: "#e3f2fd",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "24px",
            border: "1px solid #90caf9",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "#1565c0",
              fontWeight: 700,
              marginBottom: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Logged in as
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#1565c0",
              wordBreak: "break-all",
            }}
          >
            {email}
          </div>
          <div style={{ fontSize: "12px", color: "#1976d2", marginTop: "4px" }}>
            Connect your broker using this same email ID
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Link
            href="/broker"
            style={{
              display: "block",
              padding: "13px",
              borderRadius: "10px",
              textDecoration: "none",
              background: "var(--primary)",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            🔗 Connect Broker
          </Link>
          <button
            onClick={onBack}
            style={{
              padding: "12px",
              borderRadius: "10px",
              border: "1.5px solid var(--border)",
              background: "#fff",
              color: "var(--text-muted)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Tier definitions ───────────────────────────────────────────────────── *
 *  guest     → /tools, /assess  (no account needed)
 *  user      → + /journal, /plan, /profile, /broker
 *  connected → + /order, /watchlist  (broker linked)
 * ─────────────────────────────────────────────────────────────────────────── */

export const ROUTE_TIER = {
  "/": "public",
  "/tools": "public",
  "/assess": "public",
  "/login": "public",
  "/dashboard": "user",
  "/journal": "user",
  "/plan": "user",
  "/profile": "user",
  "/broker": "user",
  "/order": "connected",
  "/watchlist": "connected",
};

export function getRouteTier(pathname) {
  if (pathname === "/") return "public";
  if (pathname.startsWith("/tools")) return "public";
  if (pathname.startsWith("/assess")) return "public";
  if (pathname === "/login") return "public";
  if (pathname.startsWith("/dashboard")) return "user";
  if (pathname.startsWith("/journal")) return "user";
  if (pathname.startsWith("/plan")) return "user";
  if (pathname.startsWith("/profile")) return "user";
  if (pathname.startsWith("/analytics")) return "user";
  if (pathname.startsWith("/upgrade")) return "user";
  if (pathname.startsWith("/broker")) return "user";
  if (pathname.startsWith("/order")) return "connected";
  if (pathname.startsWith("/watchlist")) return "connected";
  return "public";
}

/* ─── Pages that render without the app shell (own layout) ──────────────── */
const SHELL_LESS = ["/", "/login"];

/* ─── Context ────────────────────────────────────────────────────────────── */

const AuthContext = createContext({
  user: null,
  session: null,
  tier: "guest",
  loading: true,
  logout: () => {},
  refreshTier: async () => {},
});

export const useAuth = () => useContext(AuthContext);

/* ─── Provider ───────────────────────────────────────────────────────────── */

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [tier, setTier] = useState("guest");
  const [loading, setLoading] = useState(true);
  const [showBrokerGate, setShowBrokerGate] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  async function resolveTier(session) {
    if (!session) return "guest";
    try {
      const [{ data: profile }, { data: settings }] = await Promise.all([
        supabase
          .from("profiles")
          .select("broker_token")
          .eq("id", session.user.id)
          .single(),
        supabase
          .from("user_settings")
          .select("tier")
          .eq("user_id", session.user.id)
          .single(),
      ]);
      // Paid tiers always get full access
      const paidTiers = ["pro", "founding"];
      if (paidTiers.includes(settings?.tier)) {
        return profile?.broker_token ? "connected" : "user";
      }
      // Expired trial
      if (settings?.tier === "expired") return "expired";
      // Active free trial (or no settings yet)
      return profile?.broker_token ? "connected" : "user";
    } catch {
      return "user";
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSessionToken(session?.access_token ?? null);
      setSession(session);
      setUser(session?.user ?? null);
      setTier(await resolveTier(session));
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSessionToken(session?.access_token ?? null);
      setSession(session);
      setUser(session?.user ?? null);
      setTier(await resolveTier(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  async function refreshTier() {
    try {
      const res = await authFetch("/api/auth/status");
      const data = await res.json();
      setTier(data.loggedIn ? "connected" : session ? "user" : "guest");
    } catch {
      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      setTier(await resolveTier(s));
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setTier("guest");
    router.push("/login");
  }

  /* ── Route protection ────────────────────────────────────────────────── */
  useEffect(() => {
    if (loading) return;
    const routeTier = getRouteTier(pathname);

    setShowBrokerGate(false);

    if (pathname === "/login" && tier !== "guest") {
      router.replace("/dashboard");
      return;
    }
    if (routeTier === "user" && tier === "guest") {
      router.replace("/login");
      return;
    }
    if (routeTier === "connected" && tier === "guest") {
      router.replace("/login");
      return;
    }
    if (routeTier === "connected" && tier === "user") {
      setShowBrokerGate(true);
      return;
    }
    // Expired trial — allow /upgrade and /profile, block everything else
    if (tier === "expired" && routeTier === "user") {
      const allowed = ["/upgrade", "/profile"];
      if (!allowed.some((p) => pathname.startsWith(p))) {
        router.replace("/upgrade");
        return;
      }
    }
  }, [loading, pathname, tier]);

  /* ── Loading screen ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>📈</div>
          <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            Loading GrowthNotes…
          </div>
        </div>
      </div>
    );
  }

  const isShellLess = pathname === "/" || pathname.startsWith("/login");

  /* ── Shell-less pages ───────────────────────────────────────────────── */
  if (isShellLess) {
    const isLanding = pathname === "/";
    return (
      <AuthContext.Provider
        value={{ user, session, tier, loading, logout, refreshTier }}
      >
        {isLanding ? (
          children
        ) : (
          <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
            <PublicHeader />
            <div>{children}</div>
          </div>
        )}
      </AuthContext.Provider>
    );
  }

  /* ── App shell ───────────────────────────────────────────────────────── */
  return (
    <AuthContext.Provider
      value={{ user, session, tier, loading, logout, refreshTier }}
    >
      <div className="app-shell">
        <Sidebar />
        <PremarketReminder />
        <main className="main-content">
          <AnnouncementBanner />
          <TestModeBanner />
          {children}
          {showBrokerGate && (
            <BrokerGate email={user?.email} onBack={() => router.back()} />
          )}
        </main>
      </div>
    </AuthContext.Provider>
  );
}
