import { NextResponse } from 'next/server';
import { logOut } from '@/lib/auth';

export async function POST(request: Request) {
  await logOut();
  return NextResponse.redirect(new URL('/admin', request.url), 303);
}
