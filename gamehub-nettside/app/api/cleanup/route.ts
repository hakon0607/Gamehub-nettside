/**
 * Retention, run once a day by a Vercel cron job (see vercel.json).
 *
 * The privacy policy promises 24 months for anything tied to an
 * installation. This is what keeps that promise without anyone remembering
 * to do it: rows older than that are deleted, and the daily feature totals,
 * which carry no identifier, are left alone.
 */
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { configured, ensureSchema, sql } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MONTHS = 24;

async function run(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorised =
    (secret && request.headers.get('authorization') === `Bearer ${secret}`) || (await isAdmin());
  if (!authorised) return NextResponse.json({ ok: false }, { status: 401 });
  if (!configured) return NextResponse.json({ ok: false, reason: 'no database' }, { status: 503 });

  await ensureSchema();
  const q = sql();
  const stale = await q`SELECT id FROM installs WHERE last_seen < now() - interval '${MONTHS} months'`;
  const ids = stale.map((row: { id: string }) => row.id);
  if (ids.length > 0) {
    await q`DELETE FROM plays WHERE install_id = ANY(${ids})`;
    await q`DELETE FROM activity WHERE install_id = ANY(${ids})`;
    await q`DELETE FROM installs WHERE id = ANY(${ids})`;
  }
  await q`DELETE FROM activity WHERE day < CURRENT_DATE - ${MONTHS * 31}`;
  await q`DELETE FROM plays WHERE day < CURRENT_DATE - ${MONTHS * 31}`;
  return NextResponse.json({ ok: true, installsDeleted: ids.length });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
