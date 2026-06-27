-- ============================================================
-- GrowthNotes — Supabase Schema
-- Run this entire file in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → paste → Run
-- ============================================================

-- ── profiles (extend the existing table) ────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS broker_token           TEXT,
  ADD COLUMN IF NOT EXISTS broker_token_expires_at BIGINT,
  ADD COLUMN IF NOT EXISTS broker                  TEXT;

-- ── plans ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date              DATE NOT NULL,
  title             TEXT NOT NULL,
  nifty_range_low   REAL,
  nifty_range_high  REAL,
  bias              TEXT CHECK(bias IN ('bullish','bearish','neutral')) DEFAULT 'neutral',
  instruments       JSONB DEFAULT '[]',
  max_trades_per_day INTEGER DEFAULT 5,
  max_loss_per_day  REAL DEFAULT 5000,
  notes             TEXT DEFAULT '',
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── scenarios ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scenarios (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id               UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  condition_type        TEXT CHECK(condition_type IN ('range','above','below')) NOT NULL,
  condition_value_low   REAL,
  condition_value_high  REAL,
  action                TEXT CHECK(action IN ('buy_ce','buy_pe','sell_ce','sell_pe')) NOT NULL,
  instrument            TEXT NOT NULL,
  max_quantity          INTEGER NOT NULL DEFAULT 1,
  entry_reason          TEXT DEFAULT '',
  target_price          REAL,
  stop_loss             REAL,
  exit_reason           TEXT DEFAULT '',
  product               TEXT DEFAULT 'I',
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── risk_rules ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.risk_rules (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id                   UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  max_quantity_per_script   INTEGER DEFAULT 50,
  allow_duplicate_scripts   BOOLEAN DEFAULT FALSE,
  no_trade_before_minutes   INTEGER DEFAULT 15,
  max_trades_per_day        INTEGER DEFAULT 5,
  max_loss_rupees           REAL DEFAULT 5000,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ── orders ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upstox_order_id     TEXT UNIQUE,
  plan_id             UUID REFERENCES public.plans(id),
  scenario_id         UUID REFERENCES public.scenarios(id),
  trading_symbol      TEXT NOT NULL,
  instrument_token    TEXT DEFAULT '',
  transaction_type    TEXT NOT NULL,
  quantity            INTEGER NOT NULL,
  order_type          TEXT NOT NULL,
  price               REAL DEFAULT 0,
  trigger_price       REAL DEFAULT 0,
  status              TEXT DEFAULT 'pending',
  average_price       REAL DEFAULT 0,
  filled_quantity     INTEGER DEFAULT 0,
  product             TEXT DEFAULT 'I',
  validity            TEXT DEFAULT 'DAY',
  rule_check_passed   BOOLEAN DEFAULT TRUE,
  rule_check_reason   TEXT DEFAULT '',
  placed_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── journal ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.journal (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  plan_id         UUID REFERENCES public.plans(id),
  followed_plan   BOOLEAN,
  entry_reason    TEXT DEFAULT '',
  exit_reason     TEXT DEFAULT '',
  emotion         TEXT DEFAULT '',
  outcome_notes   TEXT DEFAULT '',
  pnl             REAL,
  tags            JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── daily_summary ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_summary (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                  DATE NOT NULL,
  total_trades          INTEGER DEFAULT 0,
  plan_followed_count   INTEGER DEFAULT 0,
  plan_violated_count   INTEGER DEFAULT 0,
  gross_pnl             REAL DEFAULT 0,
  plan_adherence_score  REAL DEFAULT 0,
  notes                 TEXT DEFAULT '',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ── postback_events ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.postback_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upstox_order_id   TEXT NOT NULL,
  raw_payload       JSONB NOT NULL DEFAULT '{}',
  processed         BOOLEAN DEFAULT FALSE,
  received_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── watchlist ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.watchlist (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol            TEXT NOT NULL,
  instrument_token  TEXT NOT NULL,
  exchange          TEXT NOT NULL DEFAULT 'NSE',
  max_quantity      INTEGER NOT NULL DEFAULT 25,
  notes             TEXT DEFAULT '',
  plan_id           UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_rules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summary  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postback_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist      ENABLE ROW LEVEL SECURITY;

-- Plans
CREATE POLICY "own_plans" ON public.plans
  FOR ALL USING (auth.uid() = user_id);

-- Scenarios (via plan ownership)
CREATE POLICY "own_scenarios" ON public.scenarios
  FOR ALL USING (
    plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid())
  );

-- Risk rules (via plan ownership)
CREATE POLICY "own_risk_rules" ON public.risk_rules
  FOR ALL USING (
    plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid())
  );

-- Orders
CREATE POLICY "own_orders" ON public.orders
  FOR ALL USING (auth.uid() = user_id);

-- Journal
CREATE POLICY "own_journal" ON public.journal
  FOR ALL USING (auth.uid() = user_id);

-- Daily summary
CREATE POLICY "own_daily_summary" ON public.daily_summary
  FOR ALL USING (auth.uid() = user_id);

-- Postback events (no user filtering — webhook receiver)
CREATE POLICY "service_only_postback" ON public.postback_events
  FOR ALL USING (TRUE);

-- Watchlist
CREATE POLICY "own_watchlist" ON public.watchlist
  FOR ALL USING (auth.uid() = user_id);
