import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';

async function isAdmin(db, userId) {
  const { data } = await db.from('user_settings').select('role').eq('user_id', userId).single();
  return data?.role === 'admin';
}

/* ── PATCH — admin approves, rejects, or edits ── */
export async function PATCH(request, { params }) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isAdmin(db, userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body   = await request.json();
    // action: 'approve' | 'reject' | 'edit'
    const { action, rejectionReason, plan, amount, startDate, endDate, status: newStatus } = body;

    const { data: pr, error: fetchErr } = await db
      .from('payment_requests').select('*').eq('id', id).single();
    if (fetchErr || !pr) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    if (action === 'edit') {
      /* ── Plain edit — update fields without changing approval state ── */
      const update = {
        ...(plan      !== undefined && { plan }),
        ...(amount    !== undefined && { amount }),
        ...(startDate !== undefined && { start_date: startDate || null }),
        ...(endDate   !== undefined && { end_date:   endDate   || null }),
        ...(newStatus !== undefined && { status: newStatus }),
        updated_at: new Date().toISOString(),
      };
      const { error: updateErr } = await db.from('payment_requests').update(update).eq('id', id);
      if (updateErr) throw updateErr;

      // If admin manually sets status to approved, sync tier
      if (newStatus === 'approved') {
        const resolvedPlan = plan ?? pr.plan;
        const tierMap = { founding: 'founding', quarterly: 'pro', yearly: 'pro', pro: 'pro' };
        const newTier = tierMap[resolvedPlan] || 'pro';
        await db.from('user_settings').upsert({
          user_id: pr.user_id,
          tier:    newTier,
          plan:    resolvedPlan,
          ...(startDate && { subscription_start: startDate }),
          ...(endDate   && { subscription_end:   endDate }),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      }

      return NextResponse.json({ success: true });
    }

    /* ── Approve / reject ── */
    const update = {
      status:           action === 'approve' ? 'approved' : 'rejected',
      reviewed_at:      new Date().toISOString(),
      reviewed_by:      userId,
      rejection_reason: action === 'reject' ? (rejectionReason || null) : null,
      ...(plan      && { plan }),
      ...(amount    && { amount }),
      ...(startDate && { start_date: startDate }),
      ...(endDate   && { end_date:   endDate }),
    };

    const { error: updateErr } = await db.from('payment_requests').update(update).eq('id', id);
    if (updateErr) throw updateErr;

    // On approve — upgrade user tier
    if (action === 'approve') {
      const resolvedPlan = plan ?? pr.plan;
      const tierMap = { founding: 'founding', quarterly: 'pro', yearly: 'pro', pro: 'pro' };
      const newTier = tierMap[resolvedPlan] || 'pro';
      await db.from('user_settings').upsert({
        user_id: pr.user_id,
        tier:    newTier,
        plan:    resolvedPlan,
        ...(startDate && { subscription_start: startDate }),
        ...(endDate   && { subscription_end:   endDate }),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
