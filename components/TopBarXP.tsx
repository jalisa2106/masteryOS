'use client';

import { useProgressStore } from '@/lib/store/progressStore';
import { Zap } from 'lucide-react';
import { useEffect } from 'react';
import LogoutButton from '@/components/LogoutButton';

interface TopBarXPProps {
  initialXP: number;
  initialLevel: number;
}

export default function TopBarXP({ initialXP, initialLevel }: TopBarXPProps) {
  const { xp, hydrate } = useProgressStore();

  // Sync initial values into store if not yet hydrated
  useEffect(() => {
    if (xp.total === 0 && initialXP > 0) {
      hydrate({ xp: { total: initialXP, level: initialLevel } });
    }
  }, []);

  const displayLevel = xp.level > 1 ? xp.level : initialLevel;
  const displayXP = xp.total > 0 ? xp.total : initialXP;

  return (
    <div className="flex items-center gap-3">
      <LogoutButton />
    </div>
  );
}
