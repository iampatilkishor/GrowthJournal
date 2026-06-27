import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';

/* ── POST — user submits a payment request ── */
export async function POST(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { plan, amount, currency, paymentMethod, transactionRef, notes } = body;

    if (!plan || !transactionRef) {
      return NextResponse.json({ error: 'plan and transactionRef are required' }, { status: 400 });
    }

    // Check for duplicate pending request
    const { data: existing } = await db
      .from('payment_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (existing) {
      return NextResponse.json({ error: 'You already have a pending payment request.' }, { status: 409 });
    }

    const { data, error } = await db.from('payment_requests').insert({
      user_id:         userId,
      plan,
      amount:          amount ? parseFloat(amount) : null,
      currency:        currency || 'INR',
      payment_method:  paymentMethod || 'UPI',
      transaction_ref: transactionRef,
      notes:           notes || null,
      status:          'pending',
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, request: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ── GET — user checks their own request status ── */
export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await db
      .from('payment_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({ requests: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
