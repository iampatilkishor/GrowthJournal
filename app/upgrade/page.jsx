"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/authFetch.js";

/* ── PPP regions ── */
const REGIONS = {
  IN: {
    sym: "₹",
    founding: "₹999",
    quarterly: "₹499",
    yearly: "₹1,499",
    label: "India",
  },
  US: {
    sym: "$",
    founding: "$19",
    quarterly: "$9",
    yearly: "$29",
    label: "United States",
  },
  GB: {
    sym: "£",
    founding: "£16",
    quarterly: "£7",
    yearly: "£24",
    label: "United Kingdom",
  },
  EU: {
    sym: "€",
    founding: "€17",
    quarterly: "€8",
    yearly: "€25",
    label: "Europe",
  },
  AU: {
    sym: "A$",
    founding: "A$29",
    quarterly: "A$13",
    yearly: "A$39",
    label: "Australia",
  },
  SG: {
    sym: "S$",
    founding: "S$25",
    quarterly: "S$11",
    yearly: "S$34",
    label: "Singapore",
  },
  DEFAULT: {
    sym: "$",
    founding: "$15",
    quarterly: "$7",
    yearly: "$20",
    label: "Global",
  },
};
const EU_COUNTRIES = [
  "AT",
  "BE",
  "BG",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "HU",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
];

function getRegion(countryCode) {
  if (!countryCode) return REGIONS.DEFAULT;
  if (countryCode === "IN") return REGIONS.IN;
  if (countryCode === "US") return REGIONS.US;
  if (countryCode === "GB") return REGIONS.GB;
  if (countryCode === "AU") return REGIONS.AU;
  if (countryCode === "SG") return REGIONS.SG;
  if (EU_COUNTRIES.includes(countryCode)) return REGIONS.EU;
  return REGIONS.DEFAULT;
}

/* ── Plan templates (prices filled in dynamically) ── */
const PLAN_META = [
  {
    key: "founding",
    emoji: "🌟",
    name: "Founding Member",
    desc: "Yearly access · lock in the lowest price ever",
    origKey: "yearly",
    color: "#065f46",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    tag: "Most Popular",
  },
  {
    key: "yearly",
    emoji: "🏆",
    name: "Pro — Yearly",
    desc: "Best value · billed annually",
    origKey: null,
    color: "#1a237e",
    bg: "#f0f4ff",
    border: "#c7d2fe",
    tag: null,
  },
  {
    key: "quarterly",
    emoji: "📅",
    name: "Pro — Quarterly",
    desc: "Flexible · billed every 3 months",
    origKey: null,
    color: "#374151",
    bg: "#f9fafb",
    border: "#e5e7eb",
    tag: null,
  },
];

const DEFAULT_PAYMENT = {
  upi: "",
  bank: { accountName: "", bank: "", accountNo: "", ifsc: "" },
};

function copy(text, setCopied, key) {
  navigator.clipboard.writeText(text).then(() => {
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  });
}

export default function UpgradePage() {
  const [step, setStep] = useState("plan"); // plan | pay | submit | done | status
  const [plan, setPlan] = useState("founding");
  const [method, setMethod] = useState("UPI");
  const [utr, setUtr] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [existing, setExisting] = useState(null);
  const [payment, setPayment] = useState(DEFAULT_PAYMENT);
  const [region, setRegion] = useState(REGIONS.IN);

  // Build plans with live prices from detected region
  const PLANS = PLAN_META.map((p) => ({
    ...p,
    price: region[p.key],
    orig: p.origKey ? region[p.origKey] : null,
  }));

  const selected = PLANS.find((p) => p.key === plan) || PLANS[0];

  const loadStatus = useCallback(async () => {
    try {
      const res = await authFetch("/api/payment-requests");
      const json = await res.json();
      const latest = json.requests?.[0];
      if (latest) {
        setExisting(latest);
        setStep("status");
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadStatus();
    fetch("/api/payment-settings")
      .then((r) => r.json())
      .then((j) => {
        if (j.payment) setPayment(j.payment);
      })
      .catch(() => {});
    // Geo-detect for PPP pricing
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((d) => setRegion(getRegion(d.country_code)))
      .catch(() => {});
  }, [loadStatus]);

  async function submit() {
    if (!utr.trim()) {
      setError("Please enter your transaction reference / UTR number.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await authFetch("/api/payment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          paymentMethod: method,
          transactionRef: utr.trim(),
          notes,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setExisting(json.request);
      setStep("done");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const STATUS_UI = {
    pending: {
      icon: "⏳",
      color: "#92400e",
      bg: "#fefce8",
      border: "#fde047",
      label: "Under review",
      desc: "We've received your request and will verify the payment within 24 hours.",
    },
    approved: {
      icon: "✅",
      color: "#065f46",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      label: "Approved — you're Pro!",
      desc: "Your account has been upgraded. Enjoy full access to GrowthNotes Pro.",
    },
    rejected: {
      icon: "❌",
      color: "#9f1239",
      bg: "#fff1f2",
      border: "#fecdd3",
      label: "Not approved",
      desc:
        existing?.rejection_reason ||
        "Please reach out via email or Instagram so we can sort this out.",
    },
  };

  return (
    <>
      <style>{`
        .up-wrap { max-width: 600px; padding-bottom: 40px; }
        .up-plan  { border-radius: 16px; padding: 18px 20px; cursor: pointer; border-width: 2px; border-style: solid; display: flex; gap: 14px; align-items: flex-start; margin-bottom: 10px; transition: box-shadow 0.15s; }
        .up-plan:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .up-method { flex: 1; padding: 10px 0; border-radius: 10px; border-width: 2px; border-style: solid; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.15s; }
        .up-input { width: 100%; padding: 12px 14px; border-radius: 10px; border: 1.5px solid #e5e7eb; font-size: 14px; outline: none; box-sizing: border-box; font-family: inherit; }
        .up-input:focus { border-color: #6366f1; }
        .up-btn-primary { width: 100%; padding: 14px; border-radius: 12px; border: none; font-weight: 800; font-size: 15px; cursor: pointer; transition: opacity 0.15s; }
        .up-btn-primary:hover { opacity: 0.9; }
        .up-copy-btn { padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
        @media (max-width: 480px) {
          .up-wrap { padding: 0 0 40px; }
        }
      `}</style>

      <div className="up-wrap">
        {/* ── PLAN STEP ── */}
        {step === "plan" && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#111",
                  margin: "0 0 4px",
                  letterSpacing: "-0.3px",
                }}
              >
                Upgrade GrowthNotes
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>
                Choose a plan, make the payment, submit your reference — we
                activate within 24h.
              </p>
              {region.label !== "India" && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 10,
                    background: "#f0f9ff",
                    border: "1px solid #bae6fd",
                    borderRadius: 20,
                    padding: "4px 12px",
                  }}
                >
                  <span style={{ fontSize: 12 }}>🌍</span>
                  <span
                    style={{ fontSize: 12, color: "#0369a1", fontWeight: 700 }}
                  >
                    Pricing for {region.label}
                  </span>
                </div>
              )}
            </div>

            {PLANS.map((p) => (
              <div
                key={p.key}
                className="up-plan"
                onClick={() => setPlan(p.key)}
                style={{
                  background: plan === p.key ? p.bg : "#fff",
                  borderColor: plan === p.key ? p.color : "#e5e7eb",
                }}
              >
                <span style={{ fontSize: 26, flexShrink: 0, marginTop: 2 }}>
                  {p.emoji}
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 3,
                    }}
                  >
                    <span
                      style={{ fontSize: 15, fontWeight: 800, color: "#111" }}
                    >
                      {p.name}
                    </span>
                    {p.tag && (
                      <span
                        style={{
                          background: p.color,
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: 20,
                        }}
                      >
                        {p.tag}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{p.desc}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    style={{ fontSize: 18, fontWeight: 900, color: p.color }}
                  >
                    {p.price}
                  </div>
                  {p.orig && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#9ca3af",
                        textDecoration: "line-through",
                      }}
                    >
                      {p.orig}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Honest note */}
            <div
              style={{
                background: "#fafafa",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "12px 16px",
                margin: "20px 0 24px",
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
                Why manual payment?
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.65 }}>
                We haven't integrated a payment gateway yet — intentionally.
                Automated billing adds infrastructure costs that would force us
                to charge more. By staying manual, we keep costs near zero and
                pass those savings directly to you. Founding members lock in
                this rate forever.
              </div>
            </div>

            <button
              className="up-btn-primary"
              onClick={() => setStep("pay")}
              style={{ background: selected.color, color: "#fff" }}
            >
              Continue with {selected.name} · {selected.price} →
            </button>
          </>
        )}

        {/* ── PAY STEP ── */}
        {step === "pay" && (
          <>
            <button
              onClick={() => setStep("plan")}
              style={{
                background: "none",
                border: "none",
                color: "#6b7280",
                fontSize: 13,
                cursor: "pointer",
                marginBottom: 20,
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              ← Back to plans
            </button>

            <div
              style={{
                background: selected.bg,
                border: `1.5px solid ${selected.border}`,
                borderRadius: 16,
                padding: "16px 20px",
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 22 }}>{selected.emoji}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>
                  {selected.name}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: selected.color,
                    fontWeight: 700,
                  }}
                >
                  {selected.price}
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "#111",
                marginBottom: 6,
              }}
            >
              Make your payment
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 18 }}>
              Pay using UPI or bank transfer, then come back to enter your
              reference number.
            </div>

            {/* Method toggle */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {["UPI", "Bank Transfer"].map((m) => (
                <button
                  key={m}
                  className="up-method"
                  onClick={() => setMethod(m)}
                  style={{
                    borderColor: method === m ? selected.color : "#e5e7eb",
                    background: method === m ? selected.bg : "#fff",
                    color: method === m ? selected.color : "#6b7280",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Payment details */}
            {method === "UPI" ? (
              <div
                style={{
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  borderRadius: 14,
                  padding: "16px 18px",
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#0369a1",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: 10,
                  }}
                >
                  UPI ID — scan or copy
                </div>
                {payment.upi ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "#0c4a6e",
                      }}
                    >
                      {payment.upi}
                    </span>
                    <button
                      className="up-copy-btn"
                      onClick={() => copy(payment.upi, setCopied, "upi")}
                      style={{
                        border: "1px solid #bae6fd",
                        background: "#fff",
                        color: copied === "upi" ? "#059669" : "#0369a1",
                      }}
                    >
                      {copied === "upi" ? "✓ Copied!" : "Copy"}
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "#9ca3af" }}>
                    UPI details not configured yet. Please contact us via email
                    or Instagram.
                  </div>
                )}
                <div
                  style={{
                    fontSize: 12,
                    color: "#0369a1",
                    marginTop: 10,
                    opacity: 0.7,
                  }}
                >
                  Amount: <strong>{selected.price}</strong> — add your
                  name/email in payment notes
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: "#f8faff",
                  border: "1px solid #c7d2fe",
                  borderRadius: 14,
                  padding: "16px 18px",
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#3730a3",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: 12,
                  }}
                >
                  Bank Transfer Details
                </div>
                {Object.entries({
                  "Account Name": payment.bank?.accountName,
                  Bank: payment.bank?.bank,
                  "Account No": payment.bank?.accountNo,
                  IFSC: payment.bank?.ifsc,
                }).filter(([, v]) => v).length > 0 ? (
                  Object.entries({
                    "Account Name": payment.bank?.accountName,
                    Bank: payment.bank?.bank,
                    "Account No": payment.bank?.accountNo,
                    IFSC: payment.bank?.ifsc,
                  })
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "7px 0",
                          borderBottom: "1px solid #e0e7ff",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            fontWeight: 600,
                          }}
                        >
                          {k}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#0d0d1a",
                            }}
                          >
                            {v}
                          </span>
                          <button
                            className="up-copy-btn"
                            onClick={() => copy(v, setCopied, k)}
                            style={{
                              border: "1px solid #c7d2fe",
                              background: "#fff",
                              color: copied === k ? "#059669" : "#3730a3",
                            }}
                          >
                            {copied === k ? "✓" : "Copy"}
                          </button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div style={{ fontSize: 13, color: "#9ca3af" }}>
                    Bank details not configured yet. Please contact us via email
                    or Instagram.
                  </div>
                )}
                <div
                  style={{
                    fontSize: 12,
                    color: "#3730a3",
                    marginTop: 10,
                    opacity: 0.7,
                  }}
                >
                  Transfer amount: <strong>{selected.price}</strong>
                </div>
              </div>
            )}

            {/* UTR */}
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#374151",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Transaction Reference / UTR Number{" "}
                <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                className="up-input"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="Enter UTR or transaction ID after payment"
              />
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 5 }}>
                You'll find this in your UPI app or bank SMS after payment
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#374151",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Notes{" "}
                <span
                  style={{ fontSize: 12, color: "#9ca3af", fontWeight: 400 }}
                >
                  (optional)
                </span>
              </label>
              <textarea
                className="up-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything you'd like us to know"
                rows={2}
                style={{ resize: "vertical" }}
              />
            </div>

            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#dc2626",
                  marginBottom: 14,
                }}
              >
                {error}
              </div>
            )}

            <button
              className="up-btn-primary"
              onClick={submit}
              disabled={loading}
              style={{
                background: loading ? "#9ca3af" : selected.color,
                color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Submitting…" : "Submit Payment Request →"}
            </button>
            <div
              style={{
                textAlign: "center",
                fontSize: 12,
                color: "#9ca3af",
                marginTop: 10,
              }}
            >
              We verify and activate your account within 24 hours
            </div>
          </>
        )}

        {/* ── DONE ── */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: "#065f46",
                marginBottom: 8,
              }}
            >
              Request Submitted!
            </div>
            <div
              style={{
                fontSize: 14,
                color: "#6b7280",
                lineHeight: 1.7,
                maxWidth: 380,
                margin: "0 auto 28px",
              }}
            >
              We've received your payment details. We'll verify and activate
              your account within <strong>24 hours</strong>.
            </div>
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 14,
                padding: "16px 20px",
                display: "inline-block",
                textAlign: "left",
                marginBottom: 28,
              }}
            >
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                Plan requested
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#065f46" }}>
                {PLANS.find((p) => p.key === existing?.plan)?.name ||
                  existing?.plan}
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                UTR: {existing?.transaction_ref}
              </div>
            </div>
            <div>
              <button
                onClick={() => setStep("status")}
                style={{
                  background: "#f3f4f6",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 22px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  color: "#374151",
                }}
              >
                View Request Status
              </button>
            </div>
          </div>
        )}

        {/* ── STATUS ── */}
        {step === "status" &&
          existing &&
          (() => {
            const s = STATUS_UI[existing.status] || STATUS_UI.pending;
            const planInfo = PLANS.find((p) => p.key === existing.plan);
            return (
              <>
                <div style={{ marginBottom: 24 }}>
                  <h1
                    style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: "#111",
                      margin: "0 0 4px",
                    }}
                  >
                    Upgrade Status
                  </h1>
                  <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>
                    Your most recent payment request
                  </p>
                </div>

                <div
                  style={{
                    background: s.bg,
                    border: `1.5px solid ${s.border}`,
                    borderRadius: 16,
                    padding: "20px 22px",
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{s.icon}</span>
                    <div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 800,
                          color: s.color,
                        }}
                      >
                        {s.label}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: s.color,
                          opacity: 0.8,
                          marginTop: 2,
                        }}
                      >
                        {s.desc}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    overflow: "hidden",
                    marginBottom: 24,
                  }}
                >
                  {[
                    [
                      "Plan",
                      planInfo
                        ? `${planInfo.emoji} ${planInfo.name}`
                        : existing.plan,
                    ],
                    ["Method", existing.payment_method],
                    ["UTR / Reference", existing.transaction_ref],
                    [
                      "Submitted",
                      new Date(existing.created_at).toLocaleString(),
                    ],
                    existing.notes && ["Notes", existing.notes],
                  ]
                    .filter(Boolean)
                    .map(([k, v], i, arr) => (
                      <div
                        key={k}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "12px 18px",
                          borderBottom:
                            i < arr.length - 1 ? "1px solid #f3f4f6" : "none",
                          gap: 12,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: "#9ca3af",
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {k}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#111",
                            textAlign: "right",
                            wordBreak: "break-all",
                          }}
                        >
                          {v}
                        </span>
                      </div>
                    ))}
                </div>

                {existing.status === "rejected" && (
                  <button
                    className="up-btn-primary"
                    onClick={() => {
                      setExisting(null);
                      setStep("plan");
                      setUtr("");
                      setNotes("");
                    }}
                    style={{
                      background: "#0d0d1a",
                      color: "#fff",
                      cursor: "pointer",
                      marginBottom: 12,
                    }}
                  >
                    Submit a New Request →
                  </button>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent: "center",
                    marginTop: 8,
                  }}
                >
                  <a
                    href="mailto:crorepatiin365days@gmail.com?subject=GrowthNotes%20Payment%20Query"
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    📧 Email us
                  </a>
                  <span style={{ color: "#e5e7eb" }}>·</span>
                  <a
                    href="https://instagram.com/crorepat_in_365_days"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    📸 Instagram
                  </a>
                </div>
              </>
            );
          })()}
      </div>
    </>
  );
}
