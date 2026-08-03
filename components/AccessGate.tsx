'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function AccessGate() {
  const [status, setStatus] = useState<'denied' | 'authenticating' | 'granted'>('denied');
  const router = useRouter();

  useEffect(() => {
    // Expose the global function to the window object
    (window as any).getAccess = async (userId: string) => {
      const sanitized = userId?.toLowerCase().trim();
      if (!sanitized || !/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
        console.error(`ACCESS DENIED — unrecognized identity format: '${userId}'`);
        return;
      }
      
      setStatus('authenticating');
      
      try {
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: sanitized }),
        });
        
        if (res.ok) {
          console.log(`ACCESS GRANTED — Welcome back, ${sanitized}.`);
          setStatus('granted');
          // Short delay for the unlock animation before redirecting
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 1500);
        } else {
          console.error('ACCESS DENIED — System rejected the token.');
          setStatus('denied');
        }
      } catch (e) {
        console.error('ACCESS DENIED — Connection failed.');
        setStatus('denied');
      }
    };

    (window as any).getAccess.logout = async () => {
      await fetch('/api/auth/session', { method: 'DELETE' });
      router.push('/');
      router.refresh();
    };

    return () => {
      // Cleanup global on unmount just in case, though it's typically fine
      delete (window as any).getAccess;
    };
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08090c] text-white overflow-hidden">
      {/* Subtle animated background mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#101319] to-[#08090c] opacity-50" />
      
      <AnimatePresence mode="wait">
        {status === 'denied' && (
          <motion.div
            key="denied"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }} // easeOutExpo
            className="relative flex flex-col items-center space-y-6"
          >
            <div className="relative">
              <div className="absolute inset-0 blur-2xl bg-white/5 rounded-full" />
              <Shield className="w-16 h-16 text-white/40 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" strokeWidth={1} />
            </div>
            <p className="font-mono text-sm tracking-widest text-white/40 uppercase">
              awaiting identity confirmation…
            </p>
          </motion.div>
        )}
        
        {status === 'authenticating' && (
          <motion.div
            key="authenticating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative flex flex-col items-center space-y-6"
          >
            <Shield className="w-16 h-16 text-white/80 animate-pulse" strokeWidth={1.5} />
            <p className="font-mono text-sm tracking-widest text-white/80 uppercase">
              verifying…
            </p>
          </motion.div>
        )}
        
        {status === 'granted' && (
          <motion.div
            key="granted"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex flex-col items-center space-y-6"
          >
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-green-500/20 rounded-full animate-pulse" />
              <Shield className="w-16 h-16 text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]" strokeWidth={2} />
            </div>
            <p className="font-mono text-sm tracking-widest text-green-400 uppercase drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]">
              ACCESS GRANTED
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
