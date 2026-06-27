import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';

async function isAdmin(db, userId) {
  const { data } = await db.from('user_settings').select('role').eq('user_id', userId).single();
  return data?.role === 'admin';
}

/* ── GET — list all users with settings ── */
export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isAdmin(db, userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Get all auth users
    const { data: authUsers } = await db.auth.admin.listUsers({ perPage: 1000 });
    // Get all user_settings
    const { data: settings } = await db.from('user_settings').select('*');

    const settingsMap = {};
    for (const s of settings || []) settingsMap[s.user_id] = s;

    const TRIAL_DAYS = 15;
    const now = new Date();

    const users = (authUsers?.users || []).map(u => {
      const s = settingsMap[u.id] || {};
      const trialStarted = s.trial_started_at ? new Date(s.trial_started_at) : null;
      const elapsed = trialStarted ? Math.floor((now - trialStarted) / 864e5) : null;
      const trialDaysLeft = elapsed != null ? Math.max(0, TRIAL_DAYS - elapsed) : TRIAL_DAYS;
      return {
        id:            u.id,
        email:         u.email,
        createdAt:     u.created_at,
        lastSignIn:    u.last_sign_in_at,
        tier:          s.tier   || 'free',
        role:          s.role   || 'user',
        plan:          s.plan   || 'trial',
        trialDaysLeft,
        trialExpired:  (s.tier || 'free') === 'free' && elapsed != null && elapsed >= TRIAL_DAYS,
        currency:      s.currency || 'INR',
      };
    });

    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ── PATCH — update a user's tier or role ── */
export async function PATCH(request) {
  try {
    const db       = getAdminClient();
    const adminId  = await getUserId(request);
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isAdmin(db, adminId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { targetUserId, tier, role, plan } = await request.json();
    if (!targetUserId) return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });

    const update = { updated_at: new Date().toISOString() };
    if (tier !== undefined) update.tier = tier;
    if (role !== undefined) update.role = role;
    if (plan !== undefined) update.plan = plan;

    const { error } = await db
      .from('user_settings')
      .upsert({ user_id: targetUserId, ...update }, { onConflict: 'user_id' });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
