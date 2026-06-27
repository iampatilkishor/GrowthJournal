import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';
import { cancelOrder, modifyOrder } from '@/lib/upstox.js';

export async function PATCH(request, { params }) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id }  = await params;
    const body    = await request.json();
    const { quantity, orderType, price = 0, triggerPrice = 0 } = body;

    const { data: order } = await db.from('orders').select('*').eq('id', id).eq('user_id', userId).single();
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (order.upstox_order_id) {
      await modifyOrder(order.upstox_order_id, { quantity, orderType, price, triggerPrice }, userId);
    }

    await db.from('orders').update({
      quantity, order_type: orderType, price, trigger_price: triggerPrice,
      updated_at: new Date().toISOString(),
    }).eq('id', id).eq('user_id', userId);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const { data: order } = await db.from('orders').select('*').eq('id', id).eq('user_id', userId).single();
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (order.upstox_order_id) {
      await cancelOrder(order.upstox_order_id, userId);
    }

    await db.from('orders').update({
      status: 'cancelled', updated_at: new Date().toISOString(),
    }).eq('id', id).eq('user_id', userId);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
