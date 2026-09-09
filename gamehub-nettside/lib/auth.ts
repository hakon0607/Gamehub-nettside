import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'gamehub_admin';

function secret(): string | null {
  const p = process.env.ADMIN_PASSWORD?.trim();
  return p && p !== 'bytt-meg' ? p : null;
}

export function configured(): boolean {
  return secret() !== null;
}

function token(): string {
  return createHmac('sha256', secret() ?? 'unset').update('gamehub-admin-v2').digest('hex');
}

function same(a: string, b: string): boolean {
  return a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function checkPassword(candidate: string): boolean {
  const expected = secret();
  return expected !== null && same(candidate, expected);
}

export async function isLoggedIn(): Promise<boolean> {
  if (!configured()) return false;
  const jar = await cookies();
  return same(jar.get(COOKIE)?.value ?? '', token());
}

export async function logIn(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, token(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 30 });
}

export async function logOut(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
