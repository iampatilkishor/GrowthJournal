"use client";

import { useState } from "react";

export default function UpgradeModal({ plan = "founding", onClose }) {
  const [copied, setCopied] = useState("");

  function copy(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    });
  }

  const isFounder = plan === "founding";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: "32px 28px",
          width: "100%",
          maxWidth: 460,
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "#f3f4f6",
            border: "none",
            borderRadius: 50,
            width: 32,
            height: 32,
            cursor: "pointer",
            fontSize: 16,
            color: "#6b7280",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>
            {isFounder ? "🌟" : "🏆"}
          </div>
          <div
            style={{
              fontSize: 19,
              fontWeight: 900,
              color: "#0d0d1a",
              marginBottom: 4,
            }}
          >
            {isFounder ? "Claim Your Founding Spot" : "Upgrade to Pro"}
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
            Reach out via email or Instagram — we'll share payment details and
            activate your account within 24 hours.
          </div>
        </div>

        {/* Honest note */}
        <div
          style={{
            background: "#fafafa",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 5,
            }}
          >
            Why no "Pay Now" button?
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.65 }}>
            We haven't integrated a payment gateway yet — intentionally.
            Automated billing adds infrastructure costs that would force us to
            charge more. By handling it manually, we keep costs near zero and
            pass those savings to you. Founding members lock in this rate
            forever.
          </div>
        </div>

        {/* Contact options */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 20,
          }}
        >
          {/* Email */}
          <div
            style={{
              background: "#f0f9ff",
              border: "1px solid #bae6fd",
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#0369a1",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 6,
              }}
            >
              📧 Email
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0c4a6e" }}>
                crorepatiin365days@gmail.com
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => copy("crorepatiin365days@gmail.com", "email")}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 7,
                    border: "1px solid #bae6fd",
                    background: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    color: "#0369a1",
                  }}
                >
                  {copied === "email" ? "✓" : "Copy"}
                </button>
                <a
                  href="mailto:crorepatiin365days@gmail.com?subject=GrowthNotes%20Upgrade&body=Hi%2C%20I%27d%20like%20to%20upgrade%20my%20GrowthNotes%20account."
                  style={{
                    padding: "5px 10px",
                    borderRadius: 7,
                    background: "#0369a1",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fff",
                    textDecoration: "none",
                  }}
                >
                  Mail →
                </a>
              </div>
            </div>
          </div>

          {/* Instagram */}
          <div
            style={{
              background: "linear-gradient(135deg,#fdf2f8,#fef3c7)",
              border: "1px solid #f9a8d4",
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#9d174d",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 6,
              }}
            >
              📸 Instagram
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#831843" }}>
                @crorepat_in_365_days
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => copy("@crorepat_in_365_days", "ig")}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 7,
                    border: "1px solid #f9a8d4",
                    background: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    color: "#9d174d",
                  }}
                >
                  {copied === "ig" ? "✓" : "Copy"}
                </button>
                <a
                  href="https://instagram.com/crorepat_in_365_days"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "5px 10px",
                    borderRadius: 7,
                    background: "linear-gradient(135deg,#e1306c,#f77737)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fff",
                    textDecoration: "none",
                  }}
                >
                  DM →
                </a>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 12, color: "#9ca3af" }}>
          We respond within 24 hours · No spam, ever
        </div>
      </div>
    </div>
  );
}
