-- ═══════════════════════════════════════════════════════════════
--  GrowthNotes — Complete Supabase Schema
--  Run once in: Supabase Dashboard → SQL Editor → New Query → Run
--  All statements use IF NOT EXISTS — safe to re-run.
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── profiles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_token TEXT,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── user_settings ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role               TEXT DEFAULT 'user',
  tier               TEXT DEFAULT 'free',
  plan               TEXT DEFAULT 'trial',
  starting_capital   NUMERIC DEFAULT 15000,
  journey_start_date DATE,
  currency           TEXT DEFAULT 'INR',
  currency_symbol    TEXT DEFAULT '₹',
  goal_capital       NUMERIC DEFAULT 10000000,
  goal_days          INTEGER DEFAULT 365,
  goal_date          DATE,
  reminder_time      TEXT,
  trial_started_at   TIMESTAMPTZ,
  subscription_start DATE,
  subscription_end   DATE,
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── journal ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.journal (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id      TEXT,
  plan_id       UUID,
  followed_plan BOOLEAN,
  entry_reason  TEXT DEFAULT '',
  exit_reason   TEXT DEFAULT '',
  emotion       TEXT DEFAULT '',
  outcome_notes TEXT DEFAULT '',
  pnl           NUMERIC,
  tags          TEXT[] DEFAULT '{}',
  instrument    TEXT,
  direction     TEXT,
  entry_price   NUMERIC,
  stop_loss     NUMERIC,
  target_price  NUMERIC,
  exit_price    NUMERIC,
  qty           NUMERIC,
  gross_pnl     NUMERIC,
  brokerage     NUMERIC,
  trade_date    DATE DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── trades ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trades (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id    TEXT,
  instrument  TEXT,
  direction   TEXT,
  qty         NUMERIC,
  entry_price NUMERIC,
  exit_price  NUMERIC,
  pnl         NUMERIC,
  status      TEXT DEFAULT 'open',
  trade_date  DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── plans ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plans (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          DATE DEFAULT CURRENT_DATE,
  instrument    TEXT,
  direction     TEXT,
  entry_price   NUMERIC,
  stop_loss     NUMERIC,
  target_price  NUMERIC,
  qty           NUMERIC,
  notes         TEXT,
  status        TEXT DEFAULT 'active',
  matched_order TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── scenarios ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scenarios (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE DEFAULT CURRENT_DATE,
  instrument   TEXT,
  direction    TEXT,
  entry_price  NUMERIC,
  stop_loss    NUMERIC,
  target_price NUMERIC,
  qty          NUMERIC,
  notes        TEXT,
  status       TEXT DEFAULT 'active',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── orders ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id   TEXT UNIQUE,
  instrument TEXT,
  direction  TEXT,
  qty        NUMERIC,
  price      NUMERIC,
  status     TEXT,
  pnl        NUMERIC,
  order_date DATE DEFAULT CURRENT_DATE,
  raw        JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── watchlist ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.watchlist (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol         TEXT NOT NULL,
  name           TEXT,
  exchange       TEXT,
  instrument_key TEXT,
  added_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── daily_journal ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_journal (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                 DATE DEFAULT CURRENT_DATE,
  pre_market_notes     TEXT,
  market_bias          TEXT,
  focus_for_day        TEXT,
  instruments_watching TEXT,
  eod_notes            TEXT,
  lessons_learned      TEXT,
  rule_score           INTEGER,
  followed_rules       BOOLEAN,
  challenge_day        INTEGER,
  completed_today      BOOLEAN DEFAULT false,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- ── daily_summary ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_summary (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE DEFAULT CURRENT_DATE,
  total_pnl   NUMERIC DEFAULT 0,
  trade_count INTEGER DEFAULT 0,
  win_count   INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

-- ── weekly_review ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_review (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start       DATE NOT NULL,
  week_end         DATE,
  total_pnl        NUMERIC DEFAULT 0,
  trade_count      INTEGER DEFAULT 0,
  win_rate         NUMERIC,
  best_trade       TEXT,
  worst_trade      TEXT,
  what_worked      TEXT,
  what_didnt       TEXT,
  next_week_focus  TEXT,
  rule_score       INTEGER,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

-- ── trading_rules ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trading_rules (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  category    TEXT DEFAULT 'general',
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── risk_rules ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.risk_rules (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_type   TEXT,
  value       NUMERIC,
  description TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── announcements ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message    TEXT NOT NULL,
  type       TEXT DEFAULT 'info',
  active     BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── payment_requests ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan             TEXT NOT NULL,
  amount           NUMERIC,
  currency         TEXT DEFAULT 'INR',
  payment_method   TEXT DEFAULT 'UPI',
  transaction_ref  TEXT NOT NULL,
  notes            TEXT,
  status           TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  start_date       DATE,
  end_date         DATE,
  reviewed_by      UUID REFERENCES auth.users(id),
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── app_settings ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── postback_events ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.postback_events (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id),
  order_id   TEXT,
  payload    JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
--  Row Level Security
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_journal    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summary    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_review    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_rules    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_rules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postback_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings     ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies cleanly
DO $$ BEGIN

  -- profiles
  DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;
  CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

  -- user_settings
  DROP POLICY IF EXISTS "Users manage own settings" ON public.user_settings;
  CREATE POLICY "Users manage own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

  -- journal
  DROP POLICY IF EXISTS "Users manage own journal" ON public.journal;
  CREATE POLICY "Users manage own journal" ON public.journal FOR ALL USING (auth.uid() = user_id);

  -- trades
  DROP POLICY IF EXISTS "Users manage own trades" ON public.trades;
  CREATE POLICY "Users manage own trades" ON public.trades FOR ALL USING (auth.uid() = user_id);

  -- plans
  DROP POLICY IF EXISTS "Users manage own plans" ON public.plans;
  CREATE POLICY "Users manage own plans" ON public.plans FOR ALL USING (auth.uid() = user_id);

  -- scenarios
  DROP POLICY IF EXISTS "Users manage own scenarios" ON public.scenarios;
  CREATE POLICY "Users manage own scenarios" ON public.scenarios FOR ALL USING (auth.uid() = user_id);

  -- orders
  DROP POLICY IF EXISTS "Users manage own orders" ON public.orders;
  CREATE POLICY "Users manage own orders" ON public.orders FOR ALL USING (auth.uid() = user_id);

  -- watchlist
  DROP POLICY IF EXISTS "Users manage own watchlist" ON public.watchlist;
  CREATE POLICY "Users manage own watchlist" ON public.watchlist FOR ALL USING (auth.uid() = user_id);

  -- daily_journal
  DROP POLICY IF EXISTS "Users manage own daily journal" ON public.daily_journal;
  CREATE POLICY "Users manage own daily journal" ON public.daily_journal FOR ALL USING (auth.uid() = user_id);

  -- daily_summary
  DROP POLICY IF EXISTS "Users manage own daily summary" ON public.daily_summary;
  CREATE POLICY "Users manage own daily summary" ON public.daily_summary FOR ALL USING (auth.uid() = user_id);

  -- weekly_review
  DROP POLICY IF EXISTS "Users manage own weekly review" ON public.weekly_review;
  CREATE POLICY "Users manage own weekly review" ON public.weekly_review FOR ALL USING (auth.uid() = user_id);

  -- trading_rules
  DROP POLICY IF EXISTS "Users manage own trading rules" ON public.trading_rules;
  CREATE POLICY "Users manage own trading rules" ON public.trading_rules FOR ALL USING (auth.uid() = user_id);

  -- risk_rules
  DROP POLICY IF EXISTS "Users manage own risk rules" ON public.risk_rules;
  CREATE POLICY "Users manage own risk rules" ON public.risk_rules FOR ALL USING (auth.uid() = user_id);

  -- payment_requests
  DROP POLICY IF EXISTS "Users manage own payment requests" ON public.payment_requests;
  CREATE POLICY "Users manage own payment requests" ON public.payment_requests FOR ALL USING (auth.uid() = user_id);

  -- postback_events
  DROP POLICY IF EXISTS "Users manage own postback events" ON public.postback_events;
  CREATE POLICY "Users manage own postback events" ON public.postback_events FOR ALL USING (auth.uid() = user_id);

  -- announcements — any authenticated user can read
  DROP POLICY IF EXISTS "Anyone can read announcements" ON public.announcements;
  CREATE POLICY "Anyone can read announcements" ON public.announcements FOR SELECT USING (true);

  -- app_settings — any authenticated user can read
  DROP POLICY IF EXISTS "Anyone can read app_settings" ON public.app_settings;
  CREATE POLICY "Anyone can read app_settings" ON public.app_settings FOR SELECT USING (true);

END $$;
