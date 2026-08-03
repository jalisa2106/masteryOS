'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, TrendingUp, Calendar, Compass } from 'lucide-react';
import { useProgressStore } from '@/lib/store/progressStore';
import { useUIStore } from '@/lib/store/uiStore';
import ProgressRing from '@/components/dashboard/ProgressRing';
import RoadmapSwitcher from '@/components/dashboard/RoadmapSwitcher';
import TodaysTasks from '@/components/dashboard/TodaysTasks';
import type { NodeProgress, UserProfile, UserSettings } from '@/lib/storage/readJson';
import { getTrackColor } from '@/lib/theme/trackPalette';

interface DashboardData {
  userId: string;
  profile: UserProfile;
  settings: UserSettings;
  progress: {
    nodes: Record<string, NodeProgress>;
    streak: { current: number; longest: number; lastActiveDate: string | null };
    xp: { total: number; level: number };
  };
  masteryScore: number;
  completionByRoadmap: Array<{
    id: string; title: string; color: string; completion: number;
    completedNodes: number; totalNodes: number; predictedFinish: string;
    timelineStatus?: string;
  }>;
  blendedCompletion: number;
  trackStats: Record<string, { done: number; total: number; color: string; roadmapId: string }>;
  todayTasks: Array<{ id: string; title: string; track: string; estimatedMinutes: number; difficulty: 'easy' | 'medium' | 'hard'; roadmapId: string; dependencies: string[]; locked: boolean }>;
  completedNodeIds: Set<string>;
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export default function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const { hydrate, nodes, streak, xp, lastLevelUp, setLastLevelUp } = useProgressStore();
  const { selectedRoadmap } = useUIStore();

  useEffect(() => {
    hydrate({
      nodes: initialData.progress.nodes,
      streak: initialData.progress.streak,
      xp: initialData.progress.xp,
      masteryScore: initialData.masteryScore,
      completionByRoadmap: initialData.completionByRoadmap,
    });
  }, [initialData, hydrate]);

  // Compute current completion based on switcher
  const activeCompletion = selectedRoadmap === 'all'
    ? initialData.blendedCompletion
    : (initialData.completionByRoadmap.find(r => r.id === selectedRoadmap)?.completion ?? 0);

  const activeColor = selectedRoadmap === 'all'
    ? '#f59e0b'
    : (initialData.completionByRoadmap.find(r => r.id === selectedRoadmap)?.color ?? '#f59e0b');

  // Filter today's tasks by selected roadmap
  const activeTasks = selectedRoadmap === 'all'
    ? initialData.todayTasks
    : initialData.todayTasks.filter(t => t.roadmapId === selectedRoadmap);

  const trackEntries = Object.entries(initialData.trackStats)
    .filter(([, s]) => s.total > 0)
    .sort(([, a], [, b]) => (b.done / b.total) - (a.done / a.total));

  return (
    <>
      {/* Level-up Banner */}
      {lastLevelUp && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-4 py-4 bg-gradient-to-r from-amber-500/30 via-amber-500/20 to-amber-500/30 backdrop-blur-md border-b border-amber-500/20"
          initial={{ y: -80 }}
          animate={{ y: 0 }}
          exit={{ y: -80 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={() => setLastLevelUp(null)}
        >
          <Zap className="text-amber-400 w-6 h-6" />
          <span className="text-white font-bold text-lg tracking-wide">
            LEVEL UP — You&apos;ve reached <span className="text-amber-400 font-mono">Lvl {lastLevelUp}</span>
          </span>
          <Zap className="text-amber-400 w-6 h-6" />
        </motion.div>
      )}

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={cardVariant} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Welcome back, <span className="text-amber-400">{initialData.profile.displayName}</span>
            </h2>
            <p className="text-white/40 text-sm mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <RoadmapSwitcher />
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Main Progress Ring — 2 cols */}
          <motion.div
            variants={cardVariant}
            className="md:col-span-2 bg-[#101319]/80 backdrop-blur-md rounded-[20px] p-8 border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full"
              style={{ background: `radial-gradient(circle, ${activeColor}15 0%, transparent 70%)` }}
            />
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-6">Overall Mastery</h3>

            <div className="flex items-center gap-8">
              <ProgressRing
                percentage={activeCompletion}
                size={200}
                strokeWidth={14}
                color={activeColor}
              />
              <div className="flex flex-col gap-4 flex-1">
                {initialData.completionByRoadmap.map(r => (
                  <div key={r.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-white/80">{r.title}</span>
                      <span className="font-mono text-white/60">{r.completion.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: r.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${r.completion}%` }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                      />
                    </div>
                    <p className="text-xs text-white/30">
                      {r.completedNodes}/{r.totalNodes} nodes
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Stats column */}
          <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 gap-5 h-fit">
            <motion.div
              variants={cardVariant}
              className="sm:col-span-1 bg-[#101319]/80 backdrop-blur-md rounded-[20px] p-6 border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.4)] flex flex-col justify-center"
            >
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">Streak</span>
              </div>
              <div className="text-4xl font-mono font-bold text-white tabular-nums">
                {streak.current}
                <span className="text-base text-white/40 font-sans tracking-normal ml-1">days</span>
              </div>
              <p className="text-xs text-white/30 mt-1">Best: {streak.longest} days</p>
            </motion.div>

            <motion.div
              variants={cardVariant}
              className="sm:col-span-1 bg-[#101319]/80 backdrop-blur-md rounded-[20px] p-6 border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.4)] flex flex-col justify-center"
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">Level {xp.level}</span>
              </div>
              <div className="text-4xl font-mono font-bold text-amber-400 tabular-nums">
                {xp.total.toLocaleString()}
                <span className="text-base text-white/40 font-sans tracking-normal ml-1">XP</span>
              </div>
              <div className="mt-3">
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: `${Math.min(100, (xp.total / Math.floor(100 * Math.pow(xp.level + 1, 1.5))) * 100)}%`
                    }}
                  />
                </div>
                <p className="text-xs text-white/30 mt-1">
                  {xp.total} / {Math.floor(100 * Math.pow(xp.level + 1, 1.5))} XP
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={cardVariant}
              className="sm:col-span-2 bg-[#101319]/80 backdrop-blur-md rounded-[20px] p-6 border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.4)]"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">Mastery Score</span>
              </div>
              <div className="text-4xl font-mono font-bold text-emerald-400 tabular-nums">
                {initialData.masteryScore.toFixed(0)}
                <span className="text-base text-white/40 font-sans tracking-normal ml-1">/ 100</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Track Cards */}
        <motion.div variants={cardVariant}>
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Track Breakdown</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {trackEntries.map(([track, stats]) => {
              const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
              const color = getTrackColor(track);
              return (
                <div
                  key={track}
                  className="flex-shrink-0 w-44 bg-[#101319]/80 rounded-[14px] p-4 border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-white/70 truncate">{track}</span>
                    <span className="font-mono text-xs font-bold" style={{ color }}>{pct}%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <p className="text-xs text-white/30 mt-2">{stats.done}/{stats.total}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Current Focus */}
        <motion.div
          variants={cardVariant}
          className="bg-[#101319]/80 backdrop-blur-md rounded-[20px] p-6 border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.4)]"
        >
          <div className="flex flex-col gap-2 mb-5 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Current Focus</h3>
              <span className="ml-auto text-xs text-white/30">{activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''}</span>
            </div>
            
            {/* Timeline status indicator */}
            <div className="text-xs font-mono text-white/50 mt-1 flex flex-col gap-1.5">
              {selectedRoadmap === 'all' ? (
                initialData.completionByRoadmap.map(r => (
                  <div key={r.id} className="flex flex-wrap items-center gap-2 bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="text-white/40 text-[10px] uppercase font-bold">{r.title}:</span>
                    <span className="text-amber-400 font-semibold">{r.timelineStatus}</span>
                  </div>
                ))
              ) : (
                (() => {
                  const activeRoadmap = initialData.completionByRoadmap.find(r => r.id === selectedRoadmap);
                  return activeRoadmap ? (
                    <div className="flex flex-wrap items-center gap-2 bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/5 w-fit">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeRoadmap.color }} />
                      <span className="text-amber-400 font-semibold">{activeRoadmap.timelineStatus}</span>
                    </div>
                  ) : null;
                })()
              )}
            </div>
          </div>
          <TodaysTasks
            tasks={activeTasks}
            completedNodeIds={initialData.completedNodeIds}
          />
        </motion.div>
      </motion.div>
    </>
  );
}
