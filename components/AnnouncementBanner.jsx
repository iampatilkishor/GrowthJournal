"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const STYLES = {
  info: { bg: "#eff6ff", border: "#bfdbfe", color: "#1e40af", icon: "💬" },
  warning: { bg: "#fefce8", border: "#fde047", color: "#92400e", icon: "⚠️" },
  success: { bg: "#f0fdf4", border: "#bbf7d0", color: "#065f46", icon: "✅" },
};

const NOTIF_ICONS = {
  info: "💬",
  warning: "⚠️",
  success: "✅",
};

const POLL_MS = 30_000;

/* ── Send notification via Service Worker (Chrome requires this) ── */
async function sendBrowserNotification(ann) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const prefix = NOTIF_ICONS[ann.type] || "📢";
  const title = `${prefix} GrowthNotes`;
  const opts = {
    body: ann.message,
    icon: "/icons/icon-192.png",
    tag: `ann_${ann.id}`, // OS deduplicates same tag
    requireInteraction: ann.type === "warning",
  };

  try {
    // Chrome & modern browsers: must go through Service Worker
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration("/");
      if (reg) {
        await reg.showNotification(title, opts);
        return;
      }
      // SW registered but page not yet controlled — use postMessage
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "SHOW_NOTIFICATION",
          title,
          body: ann.message,
          tag: `ann_${ann.id}`,
          icon: "/icons/icon-192.png",
          url: "/dashboard",
        });
        return;
      }
    }
    // Fallback: direct Notification (Firefox, Safari)
    new Notification(title, opts);
  } catch {
    try {
      new Notification(title, opts);
    } catch {}
  }
}

async function requestPermission() {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export default function AnnouncementBanner() {
  const [ann, setAnn] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [permAsked, setPermAsked] = useState(false);
  const pathname = usePathname();
  const timerRef = useRef(null);
  const lastNotifId = useRef(null); // only notify once per unique announcement id

  async function fetchAnn() {
    try {
      const res = await fetch("/api/admin/announcements");
      const data = await res.json();
      const next = data.announcement ?? null;

      if (!next) {
        setAnn(null);
        return;
      }

      setAnn((prev) => {
        // Reset dismissed state when a new announcement arrives
        if (prev?.id !== next.id) setDismissed(false);
        return next;
      });

      // Fire notification only once per unique id (per session)
      if (next.id !== lastNotifId.current) {
        lastNotifId.current = next.id;
        await sendBrowserNotification(next);
      }
    } catch {}
  }

  useEffect(() => {
    fetchAnn();
    timerRef.current = setInterval(fetchAnn, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [pathname]);

  function dismiss() {
    if (ann) sessionStorage.setItem(`ann_dismissed_${ann.id}`, "1");
    setDismissed(true);
  }

  async function handleEnableNotifications() {
    const granted = await requestPermission();
    setPermAsked(true);
    if (granted && ann) await sendBrowserNotification(ann);
  }

  const isDismissedThisSession = ann
    ? !!sessionStorage.getItem(`ann_dismissed_${ann.id}`)
    : false;
  const showBanner = ann && !dismissed && !isDismissedThisSession;

  // Show the "Get notified" prompt only if permission hasn't been asked yet
  const notifSupported =
    typeof window !== "undefined" && "Notification" in window;
  const showPermPrompt =
    showBanner &&
    notifSupported &&
    Notification.permission === "default" &&
    !permAsked;

  if (!showBanner) return null;

  const s = STYLES[ann.type] || STYLES.info;

  return (
    <div style={{ background: s.bg, borderBottom: `1px solid ${s.border}` }}>
      <div
        style={{
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 16, flexShrink: 0 }}>{s.icon}</span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: s.color,
            flex: 1,
            lineHeight: 1.5,
          }}
        >
          {ann.message}
        </span>

        {showPermPrompt && (
          <button
            onClick={handleEnableNotifications}
            style={{
              background: s.color,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "5px 12px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            🔔 Get notified
          </button>
        )}

        <button
          onClick={dismiss}
          style={{
            background: "none",
            border: "none",
            color: s.color,
            fontSize: 16,
            cursor: "pointer",
            opacity: 0.6,
            flexShrink: 0,
            padding: "0 4px",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
