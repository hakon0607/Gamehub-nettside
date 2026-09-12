/**
 * POST /api/ping — the message GameHub sends every five minutes.
 *
 * Body: { id, version, language, state: 'open'|'tray', playing: string|null,
 *         games: number, launchers: string[], os: string,
 *         events: { [feature]: count } }
 *
 * The IP address is used for nothing and stored nowhere; the country comes
 * from Vercel's own header and that is all that is kept.
 */
import { NextResponse } from 'next/server';
import { configured, ensureSchema, sql } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EVENTS = new Set(['launch', 'screenshot', 'clip', 'trim', 'freeze', 'wallpaper', 'quicktools']);
const text = (v: unknown, max = 80) => (typeof v === 'string' ? v.slice(0, max) : '');

export async function POST(request: Request) {
  if (!configured) return NextResponse.json({ ok: false, reason: 'no database' }, { status: 503 });
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const id = text(body?.id, 64);
  if (!/^[a-f0-9]{16,64}$/i.test(id)) return NextResponse.json({ ok: false }, { status: 400 });

  const version = text(body.version, 20);
  const language = text(body.language, 8);
  const state = body.state === 'tray' ? 'tray' : 'open';
  const playing = body.playing ? text(body.playing, 120) : null;
  const games = Math.max(0, Math.min(100_000, Number(body.games) || 0));
  const launchers: string[] = Array.isArray(body.launchers) ? body.launchers.map((l: unknown) => text(l, 24)).filter(Boolean).slice(0, 20) : [];
  const os = text(body.os, 80);
  const country = text(request.headers.get('x-vercel-ip-country'), 2).toUpperCase();

  try {
    await ensureSchema();
    const q = sql();
    await q`INSERT INTO installs (id, version, language, country, os, state, playing, games, launchers, pings)
            VALUES (${id}, ${version}, ${language}, ${country}, ${os}, ${state}, ${playing}, ${games}, ${launchers}, 1)
            ON CONFLICT (id) DO UPDATE SET
              last_seen = now(), version = EXCLUDED.version, language = EXCLUDED.language,
              country = CASE WHEN EXCLUDED.country = '' THEN installs.country ELSE EXCLUDED.country END,
              os = EXCLUDED.os, state = EXCLUDED.state, playing = EXCLUDED.playing,
              games = EXCLUDED.games, launchers = EXCLUDED.launchers, pings = installs.pings + 1`;
    await q`INSERT INTO activity (install_id, day) VALUES (${id}, CURRENT_DATE) ON CONFLICT DO NOTHING`;
    if (playing) {
      await q`INSERT INTO plays (install_id, day, game) VALUES (${id}, CURRENT_DATE, ${playing}) ON CONFLICT DO NOTHING`;
    }
    const events = body.events && typeof body.events === 'object' ? body.events : {};
    for (const [kind, raw] of Object.entries(events)) {
      const n = Math.max(0, Math.min(10_000, Math.floor(Number(raw) || 0)));
      if (!EVENTS.has(kind) || n === 0) continue;
      await q`INSERT INTO events (day, kind, count) VALUES (CURRENT_DATE, ${kind}, ${n})
              ON CONFLICT (day, kind) DO UPDATE SET count = events.count + EXCLUDED.count`;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('ping failed', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
