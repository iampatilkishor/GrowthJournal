import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';

async function isAdmin(db, userId) {
  const { data } = await db.from('user_settings').select('role').eq('user_id', userId).single();
  return data?.role === 'admin';
}

/* ── GET ────────────────────────────────────────────────────────────────────
 *  ?all=1  → admin: return full history (requires auth)
 *  default → public: return single active announcement              ── */
export async function GET(request) {
  try {
    const db  = getAdminClient();
    const url = new URL(request.url);

    if (url.searchParams.get('all') === '1') {
      // Admin: full history
      const userId = await getUserId(request);
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (!(await isAdmin(db, userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const { data } = await db
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      return NextResponse.json({ announcements: data || [] });
    }

    // Public: active only
    const { data } = await db
      .from('announcements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return NextResponse.json({ announcement: data || null });
  } catch {
    return NextResponse.json({ announcement: null });
  }
}

/* ── POST — create announcement (admin only) ── */
export async function POST(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isAdmin(db, userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { message, type, deactivateOthers } = await request.json();
    if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    if (deactivateOthers) {
      await db.from('announcements').update({ active: false }).eq('active', true);
    }

    const { data, error } = await db.from('announcements').insert({
      message:    message.trim(),
      type:       type || 'info',
      active:     true,
      created_by: userId,
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, announcement: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ── PATCH — toggle active state ── */
export async function PATCH(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isAdmin(db, userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id, active } = await request.json();
    await db.from('announcements').update({ active }).eq('id', id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ── DELETE — hard delete a record ── */
export async function DELETE(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isAdmin(db, userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await request.json();
    await db.from('announcements').delete().eq('id', id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
