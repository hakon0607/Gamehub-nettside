import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { failure, guard } from '@/lib/guard';
import { setReleaseNotes } from '@/lib/github';

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const { id, body } = (await request.json()) as { id: number; body: string };
    await setReleaseNotes(Number(id), String(body ?? ''));
    revalidatePath('/');
    revalidatePath('/versjoner');
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
