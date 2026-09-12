/** Admin login: one password (ADMIN_PASSWORD in Vercel), one httpOnly cookie. */
import { createHash, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const COOKIE = 'gamehub_admin';

export function password(): string {
  return process.env.ADMIN_PASSWORD?.trim() ?? '';
}

/** The cookie holds a hash of the password, so a leaked cookie is not the password. */
export function token(): string {
  return createHash('sha256').update(`gamehub-admin:${password()}`).digest('hex');
}

export function matches(given: string): boolean {
  const want = Buffer.from(password());
  const got = Buffer.from(given);
  return want.length > 0 && want.length === got.length && timingSafeEqual(want, got);
}

export async function isAdmin(): Promise<boolean> {
  if (!password()) return false;
  const jar = await cookies();
  const have = jar.get(COOKIE)?.value ?? '';
  const want = token();
  return have.length === want.length && timingSafeEqual(Buffer.from(have), Buffer.from(want));
}
