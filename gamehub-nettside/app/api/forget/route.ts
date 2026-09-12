/**
 * POST /api/forget — the erasure right, answered by the app rather than by
 * email. The app sends the installation id it is about to forget; every row
 * stored under it is deleted here. Idempotent: asking twice is fine, and an
 * id that was never seen returns ok as well, so nobody learns from the
 * answer whether a given id exists.
 */
import { NextResponse } from 'next/server';
import { configured, ensureSchema, sql } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!configured) return NextResponse.json({ ok: false, reason: 'no database' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const id = typeof body?.id === 'string' ? body.id.slice(0, 64) : '';
  if (!/^[a-f0-9]{16,64}$/i.test(id)) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await ensureSchema();
    const q = sql();
    await q`DELETE FROM plays WHERE install_id = ${id}`;
    await q`DELETE FROM activity WHERE install_id = ${id}`;
    await q`DELETE FROM installs WHERE id = ${id}`;
    // Feature counts are daily totals with no id attached, so nothing there
    // can be traced back to this installation and nothing is removed.
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('forget failed', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
