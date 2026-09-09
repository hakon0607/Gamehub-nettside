import { NextResponse } from 'next/server';
import { isLoggedIn } from '@/lib/auth';

/** Every admin API route starts here: no cookie, no action. */
export async function guard(): Promise<NextResponse | null> {
  if (await isLoggedIn()) return null;
  return NextResponse.json({ error: 'Ikke logget inn.' }, { status: 401 });
}

export function failure(error: unknown): NextResponse {
  return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
}
