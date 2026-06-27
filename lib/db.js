import Database from 'better-sqlite3';
import path from 'path';

let db;

function getDb() {
  if (db) return db;
  db = new Database(path.join(process.cwd(), 'trading.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchema(db);
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      access_token TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      nifty_range_low REAL,
      nifty_range_high REAL,
      bias TEXT CHECK(bias IN ('bullish','bearish','neutral')) DEFAULT 'neutral',
      instruments TEXT DEFAULT '[]',
      max_trades_per_day INTEGER DEFAULT 5,
      max_loss_per_day REAL DEFAULT 5000,
      notes TEXT DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
      condition_type TEXT CHECK(condition_type IN ('range','above','below')) NOT NULL,
      condition_value_low REAL,
      condition_value_high REAL,
      action TEXT CHECK(action IN ('buy_ce','buy_pe','sell_ce','sell_pe')) NOT NULL,
      instrument TEXT NOT NULL,
      max_quantity INTEGER NOT NULL DEFAULT 1,
      entry_reason TEXT DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS risk_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
      max_quantity_per_script INTEGER DEFAULT 50,
      allow_duplicate_scripts INTEGER DEFAULT 0,
      no_trade_before_minutes INTEGER DEFAULT 15,
      max_trades_per_day INTEGER DEFAULT 5,
      max_loss_rupees REAL DEFAULT 5000,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      upstox_order_id TEXT UNIQUE,
      plan_id INTEGER REFERENCES plans(id),
      scenario_id INTEGER REFERENCES scenarios(id),
      trading_symbol TEXT NOT NULL,
      instrument_token TEXT,
      transaction_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      order_type TEXT NOT NULL,
      price REAL DEFAULT 0,
      trigger_price REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      average_price REAL DEFAULT 0,
      filled_quantity INTEGER DEFAULT 0,
      product TEXT DEFAULT 'I',
      validity TEXT DEFAULT 'DAY',
      rule_check_passed INTEGER DEFAULT 1,
      rule_check_reason TEXT DEFAULT '',
      placed_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS journal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      plan_id INTEGER REFERENCES plans(id),
      followed_plan INTEGER,
      entry_reason TEXT DEFAULT '',
      exit_reason TEXT DEFAULT '',
      emotion TEXT DEFAULT '',
      outcome_notes TEXT DEFAULT '',
      pnl REAL,
      tags TEXT DEFAULT '[]',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS daily_summary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      total_trades INTEGER DEFAULT 0,
      plan_followed_count INTEGER DEFAULT 0,
      plan_violated_count INTEGER DEFAULT 0,
      gross_pnl REAL DEFAULT 0,
      plan_adherence_score REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS postback_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      upstox_order_id TEXT NOT NULL,
      raw_payload TEXT NOT NULL,
      processed INTEGER DEFAULT 0,
      received_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      instrument_token TEXT NOT NULL,
      exchange TEXT NOT NULL DEFAULT 'NSE',
      max_quantity INTEGER NOT NULL DEFAULT 25,
      notes TEXT DEFAULT '',
      plan_id INTEGER REFERENCES plans(id) ON DELETE SET NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  // Migration: add plan_id to watchlist
  const wCols = db.prepare('PRAGMA table_info(watchlist)').all().map(c => c.name);
  if (!wCols.includes('plan_id')) {
    db.prepare('ALTER TABLE watchlist ADD COLUMN plan_id INTEGER REFERENCES plans(id) ON DELETE SET NULL').run();
  }

  // Migration: add target_price, stop_loss, exit_reason, product to scenarios
  const sCols = db.prepare('PRAGMA table_info(scenarios)').all().map(c => c.name);
  if (!sCols.includes('target_price')) {
    db.prepare('ALTER TABLE scenarios ADD COLUMN target_price REAL').run();
  }
  if (!sCols.includes('stop_loss')) {
    db.prepare('ALTER TABLE scenarios ADD COLUMN stop_loss REAL').run();
  }
  if (!sCols.includes('exit_reason')) {
    db.prepare("ALTER TABLE scenarios ADD COLUMN exit_reason TEXT DEFAULT ''").run();
  }
  if (!sCols.includes('product')) {
    db.prepare("ALTER TABLE scenarios ADD COLUMN product TEXT DEFAULT 'I'").run();
  }
}

export default getDb;
