import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isLoggedIn } from '@/lib/auth';
import { isVersion, saveNotes } from '@/lib/versions';

/** After the installer is up: save the notes and refresh the front page. */
export async function POST(request: Request) {
  if (!(await isLoggedIn())) return NextResponse.json({ error: 'Ikke logget inn.' }, { status: 401 });
  try {
    const { version, notes } = (await request.json()) as { version: string; notes: string };
    if (!isVersion(version)) throw new Error('Versjonen må se ut som 1.2.3.');
    await saveNotes(version, String(notes ?? ''));
    revalidatePath('/');
    revalidatePath('/admin');
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
