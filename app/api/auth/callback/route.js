import { NextResponse } from 'next/server';
import { exchangeCodeForToken, saveToken } from '@/lib/upstox.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code) return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });

    const accessToken = await exchangeCodeForToken(code);
    await saveToken(accessToken); // no userId — updates whichever profile has a token set
    return NextResponse.redirect(new URL('/profile', request.url));
  } catch (err) {
    console.error('Auth callback error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
