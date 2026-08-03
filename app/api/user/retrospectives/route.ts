import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { getUserRetrospectives, getUserProgress, getAllRoadmaps, getUserProfile, getUserSessions, getUserSettings, type Roadmap, type UserProgress } from '@/lib/storage/readJson';
import { writeUserJson } from '@/lib/storage/writeJson';
import { roadmapCompletion, predictFinishDate } from '@/lib/scoring/masteryScore';
import { z } from 'zod';

const retroSchema = z.object({
  weekNumber: z.number().min(1).max(52),
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  answers: z.object({
    wins: z.string().max(2000).optional().default(''),
    struggles: z.string().max(2000).optional().default(''),
    keyLearning: z.string().max(2000).optional().default(''),
    nextWeekFocus: z.string().max(2000).optional().default(''),
  }),
});

// Shared helper — computes the track with the lowest completion ratio
function computeWeakestTrack(roadmaps: Roadmap[], progress: UserProgress): string {
  const trackCompletion: Record<string, { done: number; total: number }> = {};
  for (const roadmap of roadmaps) {
    for (const phase of roadmap.phases) {
      for (const week of phase.weeks) {
        for (const node of week.nodes) {
          if (!trackCompletion[node.track]) trackCompletion[node.track] = { done: 0, total: 0 };
          trackCompletion[node.track].total++;
          if (progress.nodes[node.id]?.status === 'completed') trackCompletion[node.track].done++;
        }
      }
    }
  }
  return (
    Object.entries(trackCompletion).sort(
      ([, a], [, b]) => a.done / Math.max(a.total, 1) - b.done / Math.max(b.total, 1)
    )[0]?.[0] ?? 'General'
  );
}

export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId } = session;
  const retros = getUserRetrospectives(userId);
  const progress = getUserProgress(userId);
  const profile = getUserProfile(userId);
  const roadmaps = getAllRoadmaps();
  const sessions = getUserSessions(userId);

  // Compute pre-populated data for the current week's retro
  const weekSessions = sessions.sessions.slice(-7);
  const weekNodes = weekSessions.flatMap(s => s.nodeIds);
  const hoursStudied = weekSessions.reduce((s, sess) => s + sess.durationMinutes / 60, 0);

  const weakestTrack = computeWeakestTrack(roadmaps, progress);

  const settings = getUserSettings(userId);
  const dailyGoal = settings.dailyGoal ?? 1;

  // Pace status for 6-month roadmap
  const sixMonthRoadmap = roadmaps.find(r => r.id === '6month-mastery');
  const startDate = profile.roadmapStartDates?.['6month-mastery'] || '2026-07-26';
  const daysSinceStart = Math.max(1, Math.floor((Date.now() - new Date(startDate).getTime()) / 86_400_000));
  
  const completedNodes6 = sixMonthRoadmap ? sixMonthRoadmap.phases.flatMap(p => p.weeks.flatMap(w => w.nodes)).filter(n => progress.nodes[n.id]?.status === 'completed').length : 0;
  const expectedNodes6 = daysSinceStart * dailyGoal;
  const paceStatus = completedNodes6 >= expectedNodes6 * 1.05 ? 'ahead'
    : completedNodes6 >= expectedNodes6 * 0.9 ? 'on-track' : 'behind';

  const prePopulated = {
    nodesCompletedThisWeek: weekNodes.length,
    hoursStudied: Math.round(hoursStudied * 10) / 10,
    streakMaintained: progress.streak.current > 0,
    weakestTrack,
    paceStatus,
    predictedFinish6Month: sixMonthRoadmap ? predictFinishDate(progress, sixMonthRoadmap, startDate, dailyGoal) : '',
    predictedFinishWebDev: roadmaps.find(r => r.id === 'webdev-8week')
      ? predictFinishDate(progress, roadmaps.find(r => r.id === 'webdev-8week')!, profile.roadmapStartDates?.['webdev-8week'] || startDate, dailyGoal)
      : '',
  };

  return NextResponse.json({ entries: retros.entries, prePopulated });
}

export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = retroSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const retros = getUserRetrospectives(session.userId);
  const progress = getUserProgress(session.userId);
  const profile = getUserProfile(session.userId);
  const roadmaps = getAllRoadmaps();
  const sessions = getUserSessions(session.userId);

  const weekSessions = sessions.sessions.slice(-7);
  const hoursStudied = weekSessions.reduce((s, sess) => s + sess.durationMinutes / 60, 0);

  const settings = getUserSettings(session.userId);
  const dailyGoal = settings.dailyGoal ?? 1;

  const sixMonthRoadmap = roadmaps.find(r => r.id === '6month-mastery');
  const startDate = profile.roadmapStartDates?.['6month-mastery'] || '2026-07-26';
  const daysSinceStart = Math.max(1, Math.floor((Date.now() - new Date(startDate).getTime()) / 86_400_000));
  
  const completedNodes6 = sixMonthRoadmap ? sixMonthRoadmap.phases.flatMap(p => p.weeks.flatMap(w => w.nodes)).filter(n => progress.nodes[n.id]?.status === 'completed').length : 0;
  const expectedNodes6 = daysSinceStart * dailyGoal;
  const paceStatus: 'ahead' | 'on-track' | 'behind' = completedNodes6 >= expectedNodes6 * 1.05 ? 'ahead'
    : completedNodes6 >= expectedNodes6 * 0.9 ? 'on-track' : 'behind';

  const entry = {
    ...parsed.data,
    computed: {
      nodesCompleted: weekSessions.flatMap(s => s.nodeIds).length,
      hoursStudied: Math.round(hoursStudied * 10) / 10,
      streakMaintained: progress.streak.current > 0,
      weakestTrack: computeWeakestTrack(roadmaps, progress),
      paceStatus,
      predictedFinish6Month: sixMonthRoadmap ? predictFinishDate(progress, sixMonthRoadmap, startDate, dailyGoal) : '',
      predictedFinishWebDev: roadmaps.find(r => r.id === 'webdev-8week')
        ? predictFinishDate(progress, roadmaps.find(r => r.id === 'webdev-8week')!, profile.roadmapStartDates?.['webdev-8week'] || startDate, dailyGoal)
        : '',
    },
    createdAt: new Date().toISOString(),
  };

  const idx = retros.entries.findIndex(e => e.weekStartDate === entry.weekStartDate);
  if (idx >= 0) {
    retros.entries[idx] = entry;
  } else {
    retros.entries.push(entry);
  }

  await writeUserJson(session.userId, 'retrospectives.json', retros);
  return NextResponse.json({ success: true, entry });
}
