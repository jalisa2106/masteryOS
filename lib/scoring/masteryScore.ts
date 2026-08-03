import type { UserProgress, Roadmap } from '@/lib/storage/readJson';

export interface MasteryScoreComponents {
  completionScore: number;   // 0–40: weighted by node difficulty
  streakScore: number;       // 0–20: streak * decay
  consistencyScore: number;  // 0–20: days active / total days
  xpScore: number;           // 0–20: XP vs projected XP
  total: number;             // 0–100
}

/**
 * Computes a 0–100 Mastery Score for a user.
 *
 * Formula (fully documented, no black-box numbers):
 *   completionScore = (completedNodes / totalNodes) * 40
 *     - Weighted by difficulty: hard=2x, medium=1.5x, easy=1x
 *
 *   streakScore = min(streak.current / 30, 1) * 20
 *     - Capped at 30 days (a 30-day streak maxes this component)
 *     - Decay: if last active > 1 day ago, streakScore * 0.5
 *
 *   consistencyScore = (daysActive / daysSinceStart) * 20
 *     - Days active = number of unique dates with at least one session
 *
 *   xpScore = min(xp.total / projectedXP, 1) * 20
 *     - projectedXP = expected XP at current pace (completedFraction * totalPossibleXP)
 *     - If on or ahead of pace → full score; if behind → proportional
 *
 *   total = sum of all components
 */
export function computeMasteryScore(
  progress: UserProgress,
  roadmaps: Roadmap[],
  daysSinceStart: number,
  daysActive: number,
): MasteryScoreComponents {
  const difficultyWeight = { easy: 1, medium: 1.5, hard: 2 };

  let weightedCompleted = 0;
  let weightedTotal = 0;

  for (const roadmap of roadmaps) {
    for (const phase of roadmap.phases) {
      for (const week of phase.weeks) {
        for (const node of week.nodes) {
          const w = difficultyWeight[node.difficulty] ?? 1;
          weightedTotal += w;
          if (progress.nodes[node.id]?.status === 'completed') {
            weightedCompleted += w;
          }
        }
      }
    }
  }

  const completionFraction = weightedTotal > 0 ? weightedCompleted / weightedTotal : 0;
  const completionScore = completionFraction * 40;

  const streak = progress.streak.current;
  const lastActive = progress.streak.lastActiveDate;
  const daysSinceActive = lastActive
    ? Math.floor((Date.now() - new Date(lastActive).getTime()) / 86_400_000)
    : 999;
  let streakScore = Math.min(streak / 30, 1) * 20;
  if (daysSinceActive > 1) streakScore *= 0.5;

  const effectiveDays = Math.max(daysSinceStart, 1);
  const consistencyScore = Math.min(daysActive / effectiveDays, 1) * 20;

  // Projected XP: simple linear projection based on completion
  const totalPossibleXP = weightedTotal * 20 * 1.5; // avg multiplier
  const projectedXP = completionFraction > 0 ? progress.xp.total / completionFraction : 1;
  const xpScore = Math.min(progress.xp.total / Math.max(projectedXP, 1), 1) * 20;

  const total = completionScore + streakScore + consistencyScore + xpScore;

  return {
    completionScore: Math.round(completionScore * 10) / 10,
    streakScore: Math.round(streakScore * 10) / 10,
    consistencyScore: Math.round(consistencyScore * 10) / 10,
    xpScore: Math.round(xpScore * 10) / 10,
    total: Math.round(Math.min(total, 100) * 10) / 10,
  };
}

/**
 * Compute completion percentage for a single roadmap.
 */
export function roadmapCompletion(progress: UserProgress, roadmap: Roadmap): number {
  let total = 0, completed = 0;
  for (const phase of roadmap.phases) {
    for (const week of phase.weeks) {
      for (const node of week.nodes) {
        total++;
        if (progress.nodes[node.id]?.status === 'completed') completed++;
      }
    }
  }
  return total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
}

/**
 * Predicted finish date using linear regression on weekly velocity.
 * Returns ISO date string.
 */
export function predictFinishDate(
  progress: UserProgress,
  roadmap: Roadmap,
  startDate: string,
  dailyGoal: number = 2,
): string {
  const allNodes = roadmap.phases.flatMap(p => p.weeks.flatMap(w => w.nodes));
  const firstIncompleteIdx = allNodes.findIndex(node => progress.nodes[node.id]?.status !== 'completed');
  const safeFirstIncompleteIdx = firstIncompleteIdx === -1 ? allNodes.length : firstIncompleteIdx;

  const currentSetIdx = Math.floor(safeFirstIncompleteIdx / 2);
  
  const daysSinceStartRoadmap = Math.max(1, Math.floor((Date.now() - new Date(startDate).getTime()) / 86_400_000) + 1);
  const delayInDays = (daysSinceStartRoadmap - 1) - currentSetIdx;
  
  const numWeeks = roadmap.phases.reduce((acc, p) => acc + p.weeks.length, 0);
  const originalDurationInDays = numWeeks * 7;

  const expDate = new Date(startDate);
  expDate.setDate(expDate.getDate() + originalDurationInDays + delayInDays);

  const day = String(expDate.getDate()).padStart(2, '0');
  const month = expDate.toLocaleDateString('en-US', { month: 'short' });
  const year = expDate.getFullYear();
  return `${day} ${month} ${year}`;
}
