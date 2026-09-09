import { NextResponse } from 'next/server';
import { checkPassword, configured, logIn } from '@/lib/auth';

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get('password') ?? '');
  if (!configured()) {
    return NextResponse.redirect(new URL('/admin?feil=ikke-satt-opp', request.url), 303);
  }
  if (!checkPassword(password)) {
    return NextResponse.redirect(new URL('/admin?feil=passord', request.url), 303);
  }
  await logIn();
  return NextResponse.redirect(new URL('/admin', request.url), 303);
}
