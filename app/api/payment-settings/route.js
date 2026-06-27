import { getAdminClient, getUserId } from '@/lib/supabase-server.js';

const DEFAULT_PAYMENT = {
  upi: '',
  bank: {
    accountName: '',
    bank: '',
    accountNo: '',
    ifsc: '',
  },
};

async function getSettings() {
  const admin = getAdminClient();
  const { data } = await admin
    .from('app_settings')
    .select('value')
    .eq('key', 'payment_details')
    .single();
  return data?.value ?? DEFAULT_PAYMENT;
}

async function isAdmin(userId) {
  const admin = getAdminClient();
  const { data } = await admin
    .from('user_settings')
    .select('role')
    .eq('user_id', userId)
    .single();
  return data?.role === 'admin';
}

/* ── GET — public ───────────────────────────────────────────────────────── */
export async function GET() {
  try {
    const settings = await getSettings();
    return Response.json({ payment: settings });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

/* ── PATCH — admin only ─────────────────────────────────────────────────── */
export async function PATCH(req) {
  try {
    const userId = await getUserId(req);
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await isAdmin(userId))) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { upi, bank } = body;

    const current = await getSettings();
    const updated = {
      upi:  upi  ?? current.upi,
      bank: bank ? { ...current.bank, ...bank } : current.bank,
    };

    const admin = getAdminClient();
    await admin
      .from('app_settings')
      .upsert({ key: 'payment_details', value: updated, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    return Response.json({ payment: updated });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
