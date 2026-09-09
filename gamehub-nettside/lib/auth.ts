import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * One password, one cookie.
 *
 * The cookie holds an HMAC of a fixed string under the password, so a valid
 * cookie proves the password was known when it was set, and changing the
 * password in Vercel logs everyone out. Nothing is stored anywhere.
 */
const COOKIE = 'gamehub_admin';

function secret(): string | null {
  const password = process.env.ADMIN_PASSWORD?.trim();
  return password && password !== 'bytt-meg' ? password : null;
}

export function configured(): boolean {
  return secret() !== null;
}

function token(): string {
  return createHmac('sha256', secret() ?? 'unset').update('gamehub-admin-v1').digest('hex');
}

export function checkPassword(candidate: string): boolean {
  const expected = secret();
  if (!expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isLoggedIn(): Promise<boolean> {
  if (!configured()) return false;
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value ?? '';
  const expected = token();
  return value.length === expected.length && timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

export async function logIn(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, token(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function logOut(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
