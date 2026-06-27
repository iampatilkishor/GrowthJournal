import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';

async function isAdmin(db, userId) {
  const { data } = await db.from('user_settings').select('role').eq('user_id', userId).single();
  return data?.role === 'admin';
}

export async function GET(request) {
  try {
    const db     = getAdminClient();
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isAdmin(db, userId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data, error } = await db
      .from('payment_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ requests: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
