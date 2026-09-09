import { NextResponse } from 'next/server';
import { checkPassword, logIn } from '@/lib/auth';

export async function POST(request: Request) {
  const form = await request.formData();
  if (!checkPassword(String(form.get('password') ?? ''))) {
    return NextResponse.redirect(new URL('/admin?feil=1', request.url), 303);
  }
  await logIn();
  return NextResponse.redirect(new URL('/admin', request.url), 303);
}
