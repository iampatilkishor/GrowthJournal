# GrowthNotes — Trading Discipline App

GrowthNotes enforces trading discipline by requiring you to plan before you trade, checking every order against your rules, and prompting journaling after every fill.

---

## Quick Start

### 1. Clone & Install

```bash
cd GrowthNotes
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
UPSTOX_API_KEY=your_upstox_api_key
UPSTOX_API_SECRET=your_upstox_api_secret
UPSTOX_REDIRECT_URI=http://localhost:3000/api/auth/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Setting Your Upstox Token Daily

Upstox access tokens expire after 24 hours. You have two options:

### Option A — OAuth Flow (recommended for production)
1. Visit `/api/auth/login-url` to get the Upstox login URL
2. Complete the Upstox login — you'll be redirected back and the token will be saved automatically

### Option B — Manual Token (dev/testing)
```bash
curl -X POST http://localhost:3000/api/auth/set-token \
  -H "Content-Type: application/json" \
  -d '{"access_token": "your_token_here"}'
```

Check token status at any time:
```
GET /api/auth/status
```

---

## How to Use GrowthNotes

### Morning Routine (before 9:15 IST)
1. Go to **Plan** page → create today's plan
2. Set your market bias (bullish/bearish/neutral)
3. Set Nifty expected range
4. Add scenarios (IF Nifty in range X → THEN action Y)
5. Configure risk rules (max trades, max loss, max qty)
6. Save the plan

### During Market Hours
1. Go to **Order** page to place trades
2. Every order is checked against your plan rules — blocked orders show the exact reason
3. After a fill, a journal popup appears automatically
4. Dashboard shows live Nifty LTP, scenario matches, and margin

### End of Day
1. Go to **Journal** page
2. Complete any pending journal entries
3. Review your plan adherence score
4. Check the 30-day history chart

---

## Rule Engine

The rule engine runs before every order placement and can block orders for the following reasons:

| Rule | Description |
|------|-------------|
| **No Duplicate Scripts** | If `allow_duplicate_scripts = false`, blocks a second BUY on the same symbol in the same day |
| **Max Quantity** | Blocks if `quantity > risk_rules.max_quantity_per_script` |
| **Max Trades/Day** | Blocks if today's non-rejected/cancelled order count >= limit |
| **Max Daily Loss** | Blocks if sum of journaled P&L for today <= `-max_loss_rupees` |
| **No-Trade Window** | Blocks if the order is placed within `no_trade_before_minutes` minutes of 9:15 IST market open |

All times use IST (UTC+5:30). Blocked orders are saved to the database with `status = 'blocked'` and `rule_check_passed = 0` for audit trail.

---

## API Reference

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/auth/login-url` | Returns Upstox OAuth URL |
| GET | `/api/auth/callback?code=` | Exchanges auth code, saves token, redirects to `/` |
| POST | `/api/auth/set-token` | Body: `{ access_token }` — saves token directly (dev use) |
| GET | `/api/auth/status` | Returns `{ loggedIn, expiresAt }` |

### Plans
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/plans` | Create a new plan with scenarios and risk rules |
| GET | `/api/plans` | List last 30 plans |
| GET | `/api/plans/today` | Get today's active plan with scenarios, rules, adherence score |
| GET | `/api/plans/[id]/match-scenario` | Fetch Nifty LTP and return first matching scenario |
| PATCH | `/api/plans/[id]/deactivate` | Set plan `is_active = 0` |

### Orders
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/orders/place` | Run rule engine → place on Upstox → save to DB |
| GET | `/api/orders` | Today's orders joined with journal data |
| GET | `/api/orders/positions` | Proxy Upstox short-term positions |
| POST | `/api/orders/sync` | Pull all orders from Upstox and update local statuses |
| DELETE | `/api/orders/[id]` | Cancel order on Upstox and mark cancelled in DB |
| POST | `/api/orders/postback` | Upstox webhook receiver — returns 200 immediately |

### Journal
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/journal` | Upsert journal entry for an order |
| GET | `/api/journal/today` | Today's entries with stats |
| GET | `/api/journal/pending` | Orders with no journal entry (status: complete/filled) |
| GET | `/api/journal/history?days=30` | Entries grouped by date with adherence scores |

### Market
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/market/nifty` | Nifty 50 LTP from Upstox |
| GET | `/api/market/funds` | Available margin from Upstox |
| GET | `/api/market/quote?key=` | Market quote for any instrument key |

---

## Database Schema

SQLite file: `./trading.db` (auto-created on first run)

Tables: `auth`, `plans`, `scenarios`, `risk_rules`, `orders`, `journal`, `daily_summary`, `postback_events`

WAL mode and foreign keys are enabled by default.

---

## Project Structure

```
GrowthNotes/
  lib/
    db.js           — SQLite singleton + schema init
    upstox.js       — Upstox API v2 wrapper
    ruleEngine.js   — Order enforcement logic
  app/
    layout.jsx      — Root layout with sidebar
    page.jsx        — Dashboard
    plan/page.jsx   — Plan builder
    order/page.jsx  — Order placement
    journal/page.jsx — Journal & history
    api/            — All API route handlers
    globals.css     — CSS variables and styles
  components/
    Sidebar.jsx, JournalModal.jsx, RuleBlockedCard.jsx
    ScenarioMatchBanner.jsx, StatCard.jsx, Toast.jsx
  hooks/
    useNiftyLTP.js, useTodayPlan.js, useTodayOrders.js
```

---

## Upstox Postback (Webhooks)

Configure your Upstox postback URL to:
```
POST https://your-domain.com/api/orders/postback
```

The route saves the raw payload and updates order status immediately. It always returns `200 OK` as required by Upstox.

---

## Tech Stack

- **Next.js 14** (App Router, no TypeScript)
- **SQLite** via `better-sqlite3` (WAL mode, singleton pattern)
- **Upstox API v2** for market data and order execution
- **Recharts** for adherence score bar chart
- **Plain CSS** with CSS variables (no Tailwind, no UI library)
