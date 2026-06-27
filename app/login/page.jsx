"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Account created! You are now logged in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // AuthGate detects session change and redirects automatically
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .login-root {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          padding: 16px;
        }
        .login-card {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 4px 32px rgba(0,0,0,0.10);
          padding: 36px 32px;
          width: 100%;
          max-width: 420px;
        }
        @media (max-width: 480px) {
          .login-card {
            padding: 28px 20px;
            border-radius: 16px;
          }
        }
        .login-input {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          font-size: 15px;
          outline: none;
          transition: border-color 0.15s;
          background: #fff;
          color: var(--text);
          box-sizing: border-box;
        }
        .login-input:focus {
          border-color: var(--primary);
        }
        .login-btn {
          width: 100%;
          padding: 13px;
          border-radius: 10px;
          border: none;
          background: var(--primary);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .login-btn:hover:not(:disabled) {
          opacity: 0.92;
        }
        .tab-btn {
          flex: 1;
          padding: 9px;
          border-radius: 9px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.15s;
          background: transparent;
          color: var(--text-muted);
        }
        .tab-btn.active {
          background: #fff;
          color: var(--primary);
          font-weight: 700;
          box-shadow: 0 1px 4px rgba(0,0,0,0.10);
        }
      `}</style>

      <div className="login-root">
        <div className="login-card">
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div
              style={{ fontSize: "44px", marginBottom: "8px", lineHeight: 1 }}
            >
              📈
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: 800,
                color: "var(--primary)",
              }}
            >
              GrowthNotes
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "13px",
                color: "var(--text-muted)",
              }}
            >
              Plan your trades. Follow your rules.
            </p>
          </div>

          {/* Mode tabs */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              background: "var(--bg)",
              borderRadius: "12px",
              padding: "4px",
              marginBottom: "24px",
              border: "1px solid var(--border)",
            }}
          >
            <button
              className={`tab-btn${mode === "login" ? " active" : ""}`}
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
            >
              Log In
            </button>
            <button
              className={`tab-btn${mode === "register" ? " active" : ""}`}
              onClick={() => {
                setMode("register");
                setError("");
                setSuccess("");
              }}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: "14px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: "6px",
                }}
              >
                Email
              </label>
              <input
                className="login-input"
                type="email"
                value={email}
                required
                autoComplete="email"
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: "6px",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="login-input"
                  type={showPw ? "text" : "password"}
                  value={password}
                  required
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  placeholder={
                    mode === "register" ? "Min 6 characters" : "••••••••"
                  }
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "18px",
                    lineHeight: 1,
                    color: "var(--text-muted)",
                    padding: "2px",
                  }}
                  title={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: "#fce4ec",
                  border: "1px solid #ef9a9a",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "14px",
                  fontSize: "13px",
                  color: "#b71c1c",
                  lineHeight: 1.5,
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
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "14px",
                  fontSize: "13px",
                  color: "#2e7d32",
                  lineHeight: 1.5,
                }}
              >
                {success}
              </div>
            )}

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "…" : mode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "20px 0",
            }}
          >
            <div
              style={{ flex: 1, height: "1px", background: "var(--border)" }}
            />
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              or
            </span>
            <div
              style={{ flex: 1, height: "1px", background: "var(--border)" }}
            />
          </div>

          {/* Guest hint */}
          <div
            style={{
              background: "var(--bg)",
              borderRadius: "12px",
              padding: "14px 16px",
              border: "1px solid var(--border)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: "0 0 10px",
                fontSize: "13px",
                color: "var(--text-muted)",
              }}
            >
              Just exploring? No account needed.
            </p>
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/tools/loss-recovery"
                style={{
                  padding: "7px 14px",
                  borderRadius: "20px",
                  textDecoration: "none",
                  background: "var(--primary-light)",
                  color: "var(--primary)",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                🧮 Trading Tools
              </Link>
              <Link
                href="/assess/profitability"
                style={{
                  padding: "7px 14px",
                  borderRadius: "20px",
                  textDecoration: "none",
                  background: "var(--primary-light)",
                  color: "var(--primary)",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                🎯 Assess
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
