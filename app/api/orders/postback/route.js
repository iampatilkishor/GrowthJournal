import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-server.js';

export async function POST(request) {
  const responsePromise = NextResponse.json({ received: true });
  try {
    const body    = await request.json();
    const db      = getAdminClient();
    const orderId = body.order_id || body.orderId || '';

    await db.from('postback_events').insert({
      upstox_order_id: orderId,
      raw_payload:     body,
      processed:       false,
    });

    if (orderId) {
      const status = (body.status || 'open').toLowerCase();
      await db.from('orders').update({
        status,
        average_price:   body.average_price   || 0,
        filled_quantity: body.filled_quantity  || 0,
        updated_at:      new Date().toISOString(),
      }).eq('upstox_order_id', orderId);

      await db.from('postback_events').update({ processed: true })
        .eq('upstox_order_id', orderId).eq('processed', false);
    }
  } catch (err) {
    console.error('Postback error:', err.message);
  }
  return responsePromise;
}
