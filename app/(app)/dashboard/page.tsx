'use server';

import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserProgress, getUserProfile, getAllRoadmaps, getUserSessions, getUserSettings,
} from '@/lib/storage/readJson';
import { roadmapCompletion, predictFinishDate, computeMasteryScore } from '@/lib/scoring/masteryScore';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const session = await verifySession();
  if (!session) redirect('/');

  const { userId } = session;
  const progress = getUserProgress(userId);
  const profile = getUserProfile(userId);
  const roadmaps = getAllRoadmaps();
  const sessions = getUserSessions(userId);
  const settings = getUserSettings(userId);
  const dailyGoal = settings.dailyGoal ?? 1;
  const focusTasksCount = settings.focusTasksCount ?? 3;

  // Format Date Helper
  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Build today's tasks from roadmap position (Adaptive pair-based scheduling)
  const todayTasks: Array<{
    id: string; title: string; track: string; estimatedMinutes: number;
    difficulty: 'easy' | 'medium' | 'hard'; roadmapId: string; dependencies: string[];
    locked: boolean;
  }> = [];

  for (const roadmap of roadmaps) {
    const allNodes = roadmap.phases.flatMap(p => p.weeks.flatMap(w => w.nodes));
    const firstIncompleteIdx = allNodes.findIndex(node => progress.nodes[node.id]?.status !== 'completed');

    if (firstIncompleteIdx !== -1) {
      const currentSetIdx = Math.floor(firstIncompleteIdx / 2);
      const idx1 = currentSetIdx * 2;
      const idx2 = currentSetIdx * 2 + 1;

      if (idx1 < allNodes.length && progress.nodes[allNodes[idx1].id]?.status !== 'completed') {
        todayTasks.push({
          ...allNodes[idx1],
          roadmapId: roadmap.id,
          locked: false,
        });
      }
      if (idx2 < allNodes.length && progress.nodes[allNodes[idx2].id]?.status !== 'completed') {
        todayTasks.push({
          ...allNodes[idx2],
          roadmapId: roadmap.id,
          locked: false,
        });
      }
    }
  }

  // Stats
  const startDate = profile.roadmapStartDates?.['6month-mastery'] || '2026-07-26';
  const daysActive = new Set(sessions.sessions.map(s => s.date.split('T')[0])).size;
  const daysSinceStart = Math.max(1, Math.floor((Date.now() - new Date(startDate).getTime()) / 86_400_000));
  const masteryScore = computeMasteryScore(progress, roadmaps, daysSinceStart, daysActive);

  const completionByRoadmap = roadmaps.map(r => {
    const allNodes = r.phases.flatMap(p => p.weeks.flatMap(w => w.nodes));
    const firstIncompleteIdx = allNodes.findIndex(node => progress.nodes[node.id]?.status !== 'completed');
    const safeFirstIncompleteIdx = firstIncompleteIdx === -1 ? allNodes.length : firstIncompleteIdx;
    
    const currentSetIdx = Math.floor(safeFirstIncompleteIdx / 2);
    
    const rStartDate = profile.roadmapStartDates?.[r.id] || startDate;
    const daysSinceStartRoadmap = Math.max(1, Math.floor((Date.now() - new Date(rStartDate).getTime()) / 86_400_000) + 1);
    
    const delayInDays = (daysSinceStartRoadmap - 1) - currentSetIdx;
    
    const numWeeks = r.phases.reduce((acc, p) => acc + p.weeks.length, 0);
    const originalDurationInDays = numWeeks * 7;
    
    const expDate = new Date(rStartDate);
    expDate.setDate(expDate.getDate() + originalDurationInDays + delayInDays);
    
    const formattedExp = formatDate(expDate);
    
    let delayText = '';
    if (delayInDays <= 0) {
      delayText = 'Timeline on track';
    } else {
      delayText = `Timeline delayed by ${delayInDays} day${delayInDays !== 1 ? 's' : ''}`;
    }
    const timelineStatus = `${delayText} • Expected completion: ${formattedExp}`;

    return {
      id: r.id,
      title: r.title,
      color: r.color,
      completion: roadmapCompletion(progress, r),
      completedNodes: allNodes.filter(n => progress.nodes[n.id]?.status === 'completed').length,
      totalNodes: r.totalNodes,
      predictedFinish: formattedExp,
      timelineStatus,
      delayInDays,
      currentSetIdx,
    };
  });

  // Track breakdown
  const trackStats: Record<string, { done: number; total: number; color: string; roadmapId: string }> = {};
  for (const roadmap of roadmaps) {
    for (const phase of roadmap.phases) {
      for (const week of phase.weeks) {
        for (const node of week.nodes) {
          if (!trackStats[node.track]) trackStats[node.track] = { done: 0, total: 0, color: '#f59e0b', roadmapId: roadmap.id };
          trackStats[node.track].total++;
          if (progress.nodes[node.id]?.status === 'completed') trackStats[node.track].done++;
        }
      }
    }
  }

  const blendedCompletion = completionByRoadmap.reduce((acc, r) => acc + r.completion * r.totalNodes, 0) /
    Math.max(completionByRoadmap.reduce((acc, r) => acc + r.totalNodes, 0), 1);

  return (
    <DashboardClient
      initialData={{
        userId,
        profile,
        settings,
        progress: {
          nodes: progress.nodes,
          streak: progress.streak,
          xp: progress.xp,
        },
        masteryScore: masteryScore.total,
        completionByRoadmap,
        blendedCompletion,
        trackStats,
        todayTasks,
        completedNodeIds: new Set(Object.entries(progress.nodes).filter(([, v]) => v.status === 'completed').map(([k]) => k)),
      }}
    />
  );
}
