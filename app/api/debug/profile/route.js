import { NextResponse } from 'next/server';
import { getAdminClient, getUserId } from '@/lib/supabase-server.js';

export async function GET(request) {
  const db     = getAdminClient();
  const userId = await getUserId(request);

  const { data, error } = await db.from('profiles')
    .select('id, broker, broker_token, broker_token_expires_at')
    .eq('id', userId)
    .single();

  return NextResponse.json({
    userId,
    row: data ? {
      id: data.id,
      broker: data.broker,
      has_token: !!data.broker_token,
      token_preview: data.broker_token?.slice(0, 20) + '...',
      expires_at: data.broker_token_expires_at,
      expires_at_type: typeof data.broker_token_expires_at,
    } : null,
    error: error?.message,
  });
}
