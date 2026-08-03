import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import {
  getUserProgress, getUserProfile, getAllRoadmaps,
  getUserAchievements, getAchievementDefinitions, getUserSessions,
  getUserSettings, levelFromXP,
} from '@/lib/storage/readJson';
import { computeMasteryScore, roadmapCompletion, predictFinishDate } from '@/lib/scoring/masteryScore';
import { writeUserJson } from '@/lib/storage/writeJson';
import { z } from 'zod';

export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId } = session;
  const progress = getUserProgress(userId);
  const profile = getUserProfile(userId);
  const roadmaps = getAllRoadmaps();
  const sessions = getUserSessions(userId);
  const achievements = getUserAchievements(userId);
  const definitions = getAchievementDefinitions();
  const settings = getUserSettings(userId);

  const daysActive = new Set(sessions.sessions.map(s => s.date.split('T')[0])).size;
  const startDate = profile.roadmapStartDates?.['6month-mastery'] || new Date().toISOString().split('T')[0];
  const daysSinceStart = Math.max(1, Math.floor((Date.now() - new Date(startDate).getTime()) / 86_400_000));

  const masteryScore = computeMasteryScore(progress, roadmaps, daysSinceStart, daysActive);
  const completionByRoadmap = roadmaps.map(r => ({
    id: r.id,
    title: r.title,
    color: r.color,
    completion: roadmapCompletion(progress, r),
    predictedFinish: predictFinishDate(progress, r, profile.roadmapStartDates?.[r.id] || startDate, settings.dailyGoal),
    totalNodes: r.totalNodes,
    completedNodes: r.phases.flatMap(p => p.weeks.flatMap(w => w.nodes)).filter(n => progress.nodes[n.id]?.status === 'completed').length,
  }));

  const unlockedIds = new Set(achievements.unlocked.map(a => a.id));
  const achievementDetails = achievements.unlocked.map(a => {
    const def = definitions.achievements.find(d => d.id === a.id);
    return { ...def, unlockedAt: a.unlockedAt };
  }).filter(Boolean);

  return NextResponse.json({
    profile,
    progress: {
      streak: progress.streak,
      xp: progress.xp,
      nodeCount: Object.keys(progress.nodes).length,
    },
    masteryScore,
    completionByRoadmap,
    achievements: achievementDetails,
    daysActive,
    daysSinceStart,
  });
}

const updateProgressSchema = z.object({
  nodeId: z.string(),
  roadmapId: z.string(),
  status: z.enum(['completed', 'in-progress', 'skipped']),
  timeSpentMinutes: z.number().min(0).max(480).optional().default(0),
  confidence: z.number().min(1).max(5).optional().default(3),
  notes: z.string().max(1000).optional().default(''),
});

export async function PATCH(req: Request) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = updateProgressSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const { nodeId, status, timeSpentMinutes, confidence, notes } = parsed.data;
  const { userId } = session;

  const progress = getUserProgress(userId);
  const profile = getUserProfile(userId);
  const roadmaps = getAllRoadmaps();
  const settings = getUserSettings(userId);

  // Find node to compute XP
  let xpAwarded = 0;
  for (const roadmap of roadmaps) {
    for (const phase of roadmap.phases) {
      for (const week of phase.weeks) {
        const node = week.nodes.find(n => n.id === nodeId);
        if (node && status === 'completed') {
          const mult = settings.xpMultipliers[node.difficulty] ?? 1;
          xpAwarded = Math.floor(settings.baseXP * mult);
        }
      }
    }
  }

  const now = new Date().toISOString();
  const existingNode = progress.nodes[nodeId];

  // Prevent duplicate XP if already completed
  const isNewCompletion = status === 'completed' && existingNode?.status !== 'completed';
  const xpDelta = isNewCompletion ? xpAwarded : 0;

  progress.nodes[nodeId] = {
    status,
    completedAt: status === 'completed' ? now : (existingNode?.completedAt ?? ''),
    timeSpentMinutes: timeSpentMinutes ?? existingNode?.timeSpentMinutes ?? 0,
    xpAwarded,
    confidence: confidence ?? existingNode?.confidence ?? 3,
    notes: notes ?? existingNode?.notes ?? '',
  };

  // Update XP + level
  if (xpDelta > 0) {
    progress.xp.total += xpDelta;
    progress.xp.level = levelFromXP(progress.xp.total);
  }

  // Update streak
  const todayDate = new Date();
  const today = todayDate.toISOString().split('T')[0];
  
  if (status === 'completed') {
    const lastActive = progress.streak.lastActiveDate;
    
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    if (lastActive === today) {
      // Already counted today
    } else if (lastActive === yesterday) {
      // Yesterday — extend streak
      progress.streak.current++;
      progress.streak.longest = Math.max(progress.streak.longest, progress.streak.current);
    } else {
      // Gap — reset streak
      progress.streak.current = 1;
    }
    progress.streak.lastActiveDate = today;
  }

  progress.lastUpdated = now;

  await writeUserJson(userId, 'progress.json', progress);

  return NextResponse.json({ success: true, xpAwarded: xpDelta, progress: progress.nodes[nodeId], streak: progress.streak, xp: progress.xp });
}
