import { NextResponse } from 'next/server';
import { getPositions } from '@/lib/upstox.js';

export async function GET() {
  try {
    const positions = await getPositions();
    return NextResponse.json({ positions });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
