import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isLoggedIn } from '@/lib/auth';
import { deleteVersion } from '@/lib/versions';

export async function POST(request: Request) {
  if (!(await isLoggedIn())) return NextResponse.json({ error: 'Ikke logget inn.' }, { status: 401 });
  try {
    const { version } = (await request.json()) as { version: string };
    await deleteVersion(String(version));
    revalidatePath('/');
    revalidatePath('/admin');
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
