import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';
import { getAllOrders } from '@/lib/upstox.js';

export async function POST(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const upstoxOrders = await getAllOrders(userId);
    let updated = 0;

    for (const o of upstoxOrders) {
      const { count } = await db.from('orders')
        .update({
          status:          (o.status || 'open').toLowerCase(),
          average_price:   o.average_price   || 0,
          filled_quantity: o.filled_quantity  || 0,
          updated_at:      new Date().toISOString(),
        })
        .eq('upstox_order_id', o.order_id)
        .eq('user_id', userId)
        .select('*', { count: 'exact', head: true });
      if (count > 0) updated++;
    }

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
