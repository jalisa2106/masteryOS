'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Zap, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useProgressStore } from '@/lib/store/progressStore';
import { easings } from '@/lib/motion/easings';

const DIFFICULTY_DOTS = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const TRACK_COLORS: Record<string, string> = {
  'DSA': '#f59e0b',
  'CP': '#6366f1',
  'General': '#10b981',
  'Business': '#3b82f6',
  'Finance': '#8b5cf6',
  'Entrepreneurship': '#f97316',
  'Critical Thinking': '#14b8a6',
  'JS Fundamentals': '#ec4899',
  'React Core': '#0ea5e9',
  'Next.js Fundamentals': '#a3e635',
  'NestJS Core': '#6366f1',
  'Integration': '#f43f5e',
  'Solo Build': '#f59e0b',
};

interface TaskNode {
  id: string;
  title: string;
  track: string;
  estimatedMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  roadmapId: string;
  dependencies?: string[];
  locked?: boolean;
}

interface TodaysTasksProps {
  tasks: TaskNode[];
  completedNodeIds: Set<string>;
}

export default function TodaysTasks({ tasks, completedNodeIds }: TodaysTasksProps) {
  const { nodes, markNodeComplete } = useProgressStore();
  const router = useRouter();
  const [completing, setCompleting] = useState<string | null>(null);
  const [showParticles, setShowParticles] = useState<string | null>(null);

  const handleComplete = async (task: TaskNode) => {
    if (completing || nodes[task.id]?.status === 'completed') return;

    setCompleting(task.id);
    setShowParticles(task.id);

    try {
      const res = await fetch('/api/user/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: task.id,
          roadmapId: task.roadmapId,
          status: 'completed',
          timeSpentMinutes: task.estimatedMinutes,
          confidence: 3,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        markNodeComplete(task.id, task.roadmapId, data.xpAwarded);
        router.refresh();
      }
    } finally {
      setCompleting(null);
      setTimeout(() => setShowParticles(null), 800);
    }
  };

  const isLocked = (task: TaskNode) =>
    task.locked || (task.dependencies?.some(dep => nodes[dep]?.status !== 'completed') ?? false);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🎯</div>
        <p className="text-white/60 font-medium">Focus checklist completed!</p>
        <p className="text-white/40 text-sm mt-1">Great work! Adjust your goals in Settings to see more tasks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, i) => {
        const isCompleted = nodes[task.id]?.status === 'completed' || completedNodeIds.has(task.id);
        const locked = !isCompleted && isLocked(task);
        const trackColor = TRACK_COLORS[task.track] || '#f59e0b';
        const dots = DIFFICULTY_DOTS[task.difficulty] ?? 1;

        return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease: easings.easeOutExpo as any }}
            className={`relative flex items-center gap-4 p-4 rounded-[14px] border transition-all group ${
              isCompleted
                ? 'bg-white/5 border-white/5 opacity-60'
                : locked
                ? 'bg-white/3 border-white/5 opacity-50 cursor-not-allowed'
                : 'bg-[#101319]/60 border-white/8 hover:border-white/15 hover:bg-white/5 cursor-pointer'
            }`}
            onClick={() => !isCompleted && !locked && handleComplete(task)}
          >
            {/* Track color strip */}
            <div
              className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
              style={{ backgroundColor: trackColor }}
            />

            {/* Checkbox */}
            <div className="relative ml-2 flex-shrink-0">
              {/* Particle burst */}
              <AnimatePresence>
                {showParticles === task.id && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    {[...Array(8)].map((_, j) => (
                      <motion.div
                        key={j}
                        className="absolute w-1 h-1 rounded-full"
                        style={{ backgroundColor: trackColor, top: '50%', left: '50%' }}
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate={{
                          x: Math.cos((j * Math.PI * 2) / 8) * 20,
                          y: Math.sin((j * Math.PI * 2) / 8) * 20,
                          opacity: 0,
                        }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  isCompleted
                    ? 'border-transparent'
                    : locked
                    ? 'border-white/20'
                    : 'border-white/30 group-hover:border-amber-500'
                }`}
                style={{ backgroundColor: isCompleted ? trackColor : 'transparent' }}
                animate={completing === task.id ? { scale: [1, 0.8, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <AnimatePresence>
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                  {locked && !isCompleted && (
                    <Lock className="w-2.5 h-2.5 text-white/30" />
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Title + metadata */}
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${isCompleted ? 'line-through text-white/40' : 'text-white/90'}`}>
                {task.title}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: `${trackColor}20`, color: trackColor }}
                >
                  {task.track}
                </span>
                <span className="text-xs text-white/40 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {task.estimatedMinutes}m
                </span>
                {/* Difficulty dots */}
                <span className="flex gap-0.5">
                  {[1, 2, 3].map(d => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: d <= dots ? trackColor : 'rgba(255,255,255,0.1)' }}
                    />
                  ))}
                </span>
              </div>
            </div>

            {/* XP badge */}
            {!isCompleted && !locked && (
              <div className="flex items-center gap-1 text-amber-500 text-xs font-mono font-bold">
                <Zap className="w-3 h-3" />
                +{task.difficulty === 'hard' ? 40 : task.difficulty === 'medium' ? 30 : 20}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
