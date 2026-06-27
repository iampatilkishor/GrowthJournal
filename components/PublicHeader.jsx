"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PublicHeader() {
  const router = useRouter();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        height: "54px",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: "12px",
      }}
    >
      {/* Back button */}
      <button
        onClick={() => router.back()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text-muted)",
          padding: "6px 10px",
          borderRadius: "8px",
          transition: "background 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg)";
          e.currentTarget.style.color = "var(--text)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
          e.currentTarget.style.color = "var(--text-muted)";
        }}
      >
        ← Back
      </button>

      <div
        style={{ width: "1px", height: "20px", background: "var(--border)" }}
      />

      {/* Logo / home */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          textDecoration: "none",
          flex: 1,
        }}
      >
        <span style={{ fontSize: "18px" }}>📈</span>
        <span
          style={{ fontSize: "15px", fontWeight: 800, color: "var(--primary)" }}
        >
          GrowthNotes
        </span>
      </Link>

      {/* Home link */}
      <Link
        href="/"
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text-muted)",
          textDecoration: "none",
          padding: "6px 10px",
          borderRadius: "8px",
          whiteSpace: "nowrap",
        }}
      >
        🏠 Home
      </Link>
    </header>
  );
}
