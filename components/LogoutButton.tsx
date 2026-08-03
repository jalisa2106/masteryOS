'use client';

import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const setDenied = useAuthStore(state => state.setDenied);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      setDenied();
      // Wait a moment, then redirect
      router.push('/');
      router.refresh();
    } catch (e) {
      console.error('Logout failed:', e);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loggingOut}
      className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition-all text-red-400 hover:text-red-300 text-xs font-semibold w-full"
      title="Sign Out"
    >
      <LogOut className="w-3.5 h-3.5" strokeWidth={2.5} />
      <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
    </button>
  );
}
