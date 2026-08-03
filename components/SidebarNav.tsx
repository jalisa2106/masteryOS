'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Edit3, RotateCcw, BarChart2, Network, Settings, BookOpen, Code } from 'lucide-react';
import { motion } from 'framer-motion';
import LogoutButton from '@/components/LogoutButton';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/journey', label: 'Journey', icon: Compass },
  { href: '/review', label: 'Daily Review', icon: Edit3 },
  { href: '/retro', label: 'Retrospective', icon: RotateCcw },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/graph', label: 'Knowledge Graph', icon: Network },
  { href: '/resources', label: 'Resources', icon: BookOpen },
  { href: '/leetcode', label: 'LeetCode', icon: Code },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function SidebarNav({ userId }: { userId: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 border-r border-white/5 bg-[#0b0d12]/80 backdrop-blur-xl flex flex-col">
      <div className="p-6 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-white">
          Mastery<span className="text-amber-500/70">OS</span>
        </h1>
        <p className="text-xs text-white/30 mt-1 font-mono">{userId}</p>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all group ${
                active
                  ? 'text-white bg-white/8'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/4'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1 bottom-1 w-0.5 bg-amber-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-amber-400' : 'text-white/30 group-hover:text-white/50'}`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="text-xs text-white/20 font-mono tracking-wide">v1.0 · flat json · no db</div>
      </div>
    </aside>
  );
}
