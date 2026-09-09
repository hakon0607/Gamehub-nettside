import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { failure, guard } from '@/lib/guard';
import { publish } from '@/lib/github';

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const { version, notes } = (await request.json()) as { version: string; notes: string };
    await publish(String(version ?? '').trim(), String(notes ?? ''));
    revalidatePath('/');
    revalidatePath('/versjoner');
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
