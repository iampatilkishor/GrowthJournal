"use client";

import { useEffect, useRef } from "react";
import { authFetch } from "@/lib/authFetch.js";

async function registerSW() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    await navigator.serviceWorker.register("/sw.js");
    const reg = await navigator.serviceWorker.ready;
    console.log("[SW] registered, active:", !!reg.active, "scope:", reg.scope);
    return reg;
  } catch (e) {
    console.error("[SW] registration failed:", e);
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   showNotification(title, body, url, tag)
   Uses ServiceWorkerRegistration.showNotification() — what Chrome requires
   on HTTPS. Falls back to plain Notification constructor on localhost.
───────────────────────────────────────────────────────────────────────── */
export async function showNotification(
  title,
  body,
  url = "/dashboard",
  tag = "GrowthNotes",
) {
  console.log("[Notification] attempting —", title);

  if (!("Notification" in window)) {
    console.warn("[Notification] API not supported");
    return false;
  }

  const perm = Notification.permission;
  console.log("[Notification] permission:", perm);
  if (perm !== "granted") return false;

  // Method 1: SW showNotification (required on HTTPS / mobile Chrome)
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      console.log("[Notification] SW ready, active:", !!reg.active);
      await reg.showNotification(title, {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag,
        renotify: true,
        data: { url },
      });
      console.log("[Notification] SW showNotification called ✓");
      return true;
    } catch (e) {
      console.error("[Notification] SW showNotification failed:", e);
    }
  }

  // Method 2: plain constructor fallback (desktop, non-SW environments)
  try {
    new Notification(title, { body, icon: "/icon-192.png" });
    console.log("[Notification] plain Notification ✓");
    return true;
  } catch (e) {
    console.error("[Notification] plain Notification failed:", e);
  }

  return false;
}

export default function PremarketReminder() {
  const firedRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    registerSW();

    window.testReminder = async () => {
      const ok = await showNotification(
        "GrowthNotes 🌅 Test",
        "Tap to open your journal",
        "/journal",
        "GrowthNotes-test",
      );
      console.log("[PremarketReminder] test result:", ok);
      return ok;
    };

    async function loadSettings() {
      try {
        const res = await authFetch("/api/user-settings");
        if (!res.ok) return;
        const json = await res.json();
        settingsRef.current = json.settings;
        console.log(
          "[PremarketReminder] reminder_time:",
          json.settings?.reminder_time,
        );
      } catch (e) {
        console.warn("[PremarketReminder] loadSettings failed:", e);
      }
    }

    async function check() {
      if (!settingsRef.current) await loadSettings();
      const rt = settingsRef.current?.reminder_time;
      if (!rt) return;

      const now = new Date();
      const todayKey = now.toISOString().slice(0, 10);
      if (firedRef.current === todayKey) return;

      const [hh, mm] = rt.split(":").map(Number);
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const tgtMin = hh * 60 + mm;

      if (Math.abs(nowMin - tgtMin) <= 1) {
        const ok = await showNotification(
          "GrowthNotes — Pre-Market Reminder 🌅",
          "Market opens soon. Fill your pre-market plan and journal!",
          "/journal",
        );
        if (ok) firedRef.current = todayKey;
      }
    }

    loadSettings();
    const t1 = setInterval(loadSettings, 5 * 60_000);
    const t2 = setInterval(check, 30_000);
    check();

    return () => {
      clearInterval(t1);
      clearInterval(t2);
      delete window.testReminder;
    };
  }, []);

  return null;
}
