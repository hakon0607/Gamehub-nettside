import { NextResponse } from 'next/server';
import { COOKIE, matches, password, token } from '@/lib/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!password()) return NextResponse.json({ ok: false, reason: 'ADMIN_PASSWORD is not set in Vercel' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  if (!matches(String(body?.password ?? ''))) {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ ok: false, reason: 'Wrong password' }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, token(), { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 60 * 60 * 24 * 90 });
  return response;
}
