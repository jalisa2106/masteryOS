import { NextResponse } from 'next/server';
import { createSession, clearSession } from '@/lib/auth';
import { z } from 'zod';

const sessionSchema = z.object({
  userId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = sessionSchema.parse(body);

    await createSession(userId);

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    return NextResponse.json(
      { error: 'ACCESS DENIED — unrecognized identity' },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ success: true });
}
