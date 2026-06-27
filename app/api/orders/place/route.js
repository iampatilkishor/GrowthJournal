import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';
import { placeOrder } from '@/lib/upstox.js';
import { checkOrderRules } from '@/lib/ruleEngine.js';

export async function POST(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      tradingSymbol, instrumentToken, transactionType,
      quantity, orderType, price = 0, triggerPrice = 0,
      product = 'I', planId = null, scenarioId = null,
    } = body;

    if (!tradingSymbol || !transactionType || !quantity || !orderType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const ruleResult = await checkOrderRules({ tradingSymbol, quantity, transactionType, planId, userId });

    if (!ruleResult.allowed) {
      await db.from('orders').insert({
        user_id: userId, plan_id: planId, scenario_id: scenarioId,
        trading_symbol: tradingSymbol, instrument_token: instrumentToken || '',
        transaction_type: transactionType, quantity, order_type: orderType,
        price, trigger_price: triggerPrice, status: 'blocked', product,
        rule_check_passed: false, rule_check_reason: ruleResult.reason,
      });
      return NextResponse.json(
        { blocked: true, reason: ruleResult.reason, allViolations: ruleResult.allViolations },
        { status: 403 }
      );
    }

    const upstoxResult  = await placeOrder({ tradingSymbol, instrumentToken, transactionType, quantity, orderType, price, triggerPrice, product }, userId);
    const upstoxOrderId = upstoxResult?.order_id || null;

    const { data: order } = await db.from('orders').insert({
      user_id: userId, upstox_order_id: upstoxOrderId,
      plan_id: planId, scenario_id: scenarioId,
      trading_symbol: tradingSymbol, instrument_token: instrumentToken || '',
      transaction_type: transactionType, quantity, order_type: orderType,
      price, trigger_price: triggerPrice, status: 'open', product,
      rule_check_passed: true, rule_check_reason: 'All rules passed',
    }).select().single();

    return NextResponse.json({ success: true, orderId: order.id, upstoxOrderId, promptJournal: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
