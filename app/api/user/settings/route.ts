import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { getUserSettings } from '@/lib/storage/readJson';
import { writeUserJson } from '@/lib/storage/writeJson';
import { z } from 'zod';

const settingsSchema = z.object({
  publicProfile: z.boolean().optional(),
  xpMultipliers: z.object({
    easy: z.number().min(0.5).max(5),
    medium: z.number().min(0.5).max(5),
    hard: z.number().min(0.5).max(5),
  }).optional(),
  baseXP: z.number().min(5).max(100).optional(),
  publicWidgets: z.record(z.string(), z.boolean()).optional(),
  quoteCategories: z.array(z.string()).optional(),
  themeAccent: z.object({ h: z.number(), s: z.number(), l: z.number() }).optional(),
  notifications: z.record(z.string(), z.boolean()).optional(),
  dailyGoal: z.number().min(1).max(10).optional(),
  focusTasksCount: z.number().min(1).max(10).optional(),
}).partial();

export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(getUserSettings(session.userId));
}

export async function PATCH(req: Request) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const current = getUserSettings(session.userId);
  const updated = { ...current, ...parsed.data };

  await writeUserJson(session.userId, 'settings.json', updated);
  return NextResponse.json({ success: true, settings: updated });
}
