import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { failure, guard } from '@/lib/guard';
import { setHidden } from '@/lib/github';

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const { id, hidden } = (await request.json()) as { id: number; hidden: boolean };
    await setHidden(Number(id), Boolean(hidden));
    revalidatePath('/');
    revalidatePath('/versjoner');
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
