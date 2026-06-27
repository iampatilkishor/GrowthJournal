import { getAdminClient, todayIST } from './supabase-server.js';

function minutesSinceMarketOpen() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const total = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return total - (9 * 60 + 15);
}

export async function checkOrderRules({ tradingSymbol, quantity, transactionType, planId, userId }) {
  const db      = getAdminClient();
  const today   = todayIST();
  const violations = [];

  const rules = planId
    ? (await db.from('risk_rules').select('*').eq('plan_id', planId).limit(1).single()).data
    : null;

  if (rules) {
    // 1. No duplicate scripts
    if (!rules.allow_duplicate_scripts && transactionType === 'BUY') {
      const { count } = await db.from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('trading_symbol', tradingSymbol)
        .eq('transaction_type', 'BUY')
        .eq('user_id', userId)
        .not('status', 'in', '("rejected","cancelled","blocked")')
        .gte('placed_at', `${today}T00:00:00+05:30`)
        .lt('placed_at',  `${today}T23:59:59+05:30`);
      if (count > 0) {
        violations.push(`Duplicate script blocked: ${tradingSymbol} already has an active BUY order today`);
      }
    }

    // 2. Max quantity per script
    if (rules.max_quantity_per_script && quantity > rules.max_quantity_per_script) {
      violations.push(`Quantity ${quantity} exceeds max allowed ${rules.max_quantity_per_script} per script`);
    }

    // 3. Max trades per day
    if (rules.max_trades_per_day) {
      const { count } = await db.from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('status', 'in', '("rejected","cancelled","blocked")')
        .gte('placed_at', `${today}T00:00:00+05:30`)
        .lt('placed_at',  `${today}T23:59:59+05:30`);
      if (count >= rules.max_trades_per_day) {
        violations.push(`Max trades per day reached: ${count}/${rules.max_trades_per_day}`);
      }
    }

    // 4. Max daily loss
    if (rules.max_loss_rupees) {
      const { data: jRows } = await db.from('journal')
        .select('pnl, orders!inner(placed_at)')
        .eq('user_id', userId)
        .not('pnl', 'is', null)
        .gte('orders.placed_at', `${today}T00:00:00+05:30`)
        .lt('orders.placed_at',  `${today}T23:59:59+05:30`);
      const totalPnl = (jRows || []).reduce((s, r) => s + (r.pnl || 0), 0);
      if (totalPnl <= -rules.max_loss_rupees) {
        violations.push(`Max daily loss of ₹${rules.max_loss_rupees} reached (P&L: ₹${totalPnl.toFixed(2)})`);
      }
    }

    // 5. Early trading window
    if (rules.no_trade_before_minutes) {
      const minsSinceOpen = minutesSinceMarketOpen();
      if (minsSinceOpen >= 0 && minsSinceOpen < rules.no_trade_before_minutes) {
        violations.push(`Too early: ${rules.no_trade_before_minutes - Math.floor(minsSinceOpen)} min remaining in no-trade window`);
      }
    }
  }

  if (violations.length > 0) {
    return { allowed: false, reason: violations[0], allViolations: violations };
  }
  return { allowed: true, reason: 'All rules passed', allViolations: [] };
}

export async function matchScenario(planId, niftyLevel) {
  const db = getAdminClient();
  const { data: scenarios } = await db.from('scenarios')
    .select('*').eq('plan_id', planId).order('created_at', { ascending: true });

  for (const s of (scenarios || [])) {
    if (s.condition_type === 'range') {
      if (niftyLevel >= s.condition_value_low && niftyLevel <= s.condition_value_high) return s;
    } else if (s.condition_type === 'above') {
      if (niftyLevel > s.condition_value_low) return s;
    } else if (s.condition_type === 'below') {
      if (niftyLevel < s.condition_value_low) return s;
    }
  }
  return null;
}

export async function getTodayAdherenceScore(userId) {
  const db    = getAdminClient();
  const today = todayIST();
  const { data } = await db.from('journal')
    .select('followed_plan, orders!inner(placed_at)')
    .eq('user_id', userId)
    .not('followed_plan', 'is', null)
    .gte('orders.placed_at', `${today}T00:00:00+05:30`)
    .lt('orders.placed_at',  `${today}T23:59:59+05:30`);

  if (!data || data.length === 0) return null;
  const followed = data.filter(r => r.followed_plan === true).length;
  return Math.round((followed / data.length) * 100);
}
