import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const clientId   = process.env.UPSTOX_API_KEY;
    const redirectUri = process.env.UPSTOX_REDIRECT_URI;

    if (!clientId)   throw new Error('UPSTOX_API_KEY is not set in .env.local');
    if (!redirectUri) throw new Error('UPSTOX_REDIRECT_URI is not set in .env.local');

    const url = `https://api.upstox.com/v2/login/authorization/dialog`
      + `?response_type=code`
      + `&client_id=${encodeURIComponent(clientId)}`
      + `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
