import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { configured } from '@/lib/db';
import { stats } from '@/lib/stats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ ok: false }, { status: 401 });
  if (!configured) return NextResponse.json({ ok: false, reason: 'no database' }, { status: 503 });
  try {
    return NextResponse.json(await stats(), { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('stats failed', error);
    return NextResponse.json({ ok: false, reason: String(error) }, { status: 500 });
  }
}
