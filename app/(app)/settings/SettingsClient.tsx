'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Eye, EyeOff, Zap, Globe } from 'lucide-react';
import type { UserSettings, UserProfile } from '@/lib/storage/readJson';
import LogoutButton from '@/components/LogoutButton';

interface SettingsClientProps {
  settings: UserSettings;
  profile: UserProfile;
  userId: string;
}

export default function SettingsClient({ settings: initialSettings, profile: initialProfile, userId }: SettingsClientProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const saveSettings = async (data: Partial<UserSettings>) => {
    setSaving(true);
    try {
      await fetch('/api/user/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      setSettings(s => ({ ...s, ...data }));
      setSaved('settings');
      setTimeout(() => setSaved(null), 2000);
    } finally { setSaving(false); }
  };

  const saveProfile = async (data: Partial<UserProfile>) => {
    setSaving(true);
    try {
      await fetch('/api/user/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      setProfile(p => ({ ...p, ...data }));
      setSaved('profile');
      setTimeout(() => setSaved(null), 2000);
    } finally { setSaving(false); }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-[#101319]/80 backdrop-blur-md rounded-[20px] p-6 border border-white/5 space-y-4">
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  );

  const Row = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm font-medium text-white/80">{label}</p>
        {desc && <p className="text-xs text-white/40 mt-0.5">{desc}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-amber-500' : 'bg-white/10'}`}
    >
      <motion.div
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
        animate={{ x: value ? 24 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <p className="text-white/40 text-sm mt-1">Configure your Mastery OS</p>
        </div>
        <LogoutButton />
      </div>

      <Section title="Profile">
        <Row label="User ID" desc="Cannot be changed">
          <span className="font-mono text-sm text-amber-400">{userId}</span>
        </Row>
        <Row label="Working Hours" desc="Used to calculate study pace">
          <div className="flex gap-2">
            <input
              type="time"
              value={profile.workingHours?.start || '09:00'}
              onChange={e => saveProfile({ workingHours: { start: e.target.value, end: profile.workingHours?.end || '17:00' } })}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-amber-500/40 font-mono"
            />
            <span className="text-white/40 self-center">to</span>
            <input
              type="time"
              value={profile.workingHours?.end || '17:00'}
              onChange={e => saveProfile({ workingHours: { start: profile.workingHours?.start || '09:00', end: e.target.value } })}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-amber-500/40 font-mono"
            />
          </div>
        </Row>
        <Row label="Preferred Study Duration" desc="In minutes">
          <input
            type="number"
            min={15} max={480} step={15}
            value={profile.preferredStudyDuration || 60}
            onChange={e => saveProfile({ preferredStudyDuration: parseInt(e.target.value) || 60 })}
            className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-amber-500/40 font-mono text-center"
          />
        </Row>

        <Row label="6-Month Roadmap Start" desc="Used to calculate today's tasks and pace">
          <input
            type="date"
            value={profile.roadmapStartDates?.['6month-mastery'] || '2026-07-26'}
            onChange={e => saveProfile({ roadmapStartDates: { ...profile.roadmapStartDates, '6month-mastery': e.target.value } })}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-amber-500/40 font-mono"
          />
        </Row>
        <Row label="Web Dev Roadmap Start">
          <input
            type="date"
            value={profile.roadmapStartDates?.['webdev-8week'] || '2026-07-26'}
            onChange={e => saveProfile({ roadmapStartDates: { ...profile.roadmapStartDates, 'webdev-8week': e.target.value } })}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-amber-500/40 font-mono"
          />
        </Row>
      </Section>

      <Section title="Roadmap Scheduling">
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-sm text-white/70">
          <p className="font-semibold text-amber-400 mb-1">Adaptive Timeline</p>
          <p className="text-xs text-white/50 leading-relaxed">
            Your daily workload is fixed at <strong>2 tasks per day</strong>. The roadmap adapts automatically to your pace; missing a day will pause your timeline, and completing tasks will catch you up.
          </p>
        </div>
      </Section>

      <Section title="XP Multipliers">
        <p className="text-xs text-white/40">Base XP: {settings.baseXP} per task. Multiplied by difficulty.</p>
        {(['easy', 'medium', 'hard'] as const).map(diff => (
          <Row key={diff} label={diff.charAt(0).toUpperCase() + diff.slice(1)} desc={`${diff === 'easy' ? '🟢' : diff === 'medium' ? '🟡' : '🔴'} +${Math.floor(settings.baseXP * settings.xpMultipliers[diff])} XP`}>
            <input
              type="number" min={0.5} max={5} step={0.5}
              value={settings.xpMultipliers[diff]}
              onChange={e => saveSettings({ xpMultipliers: { ...settings.xpMultipliers, [diff]: parseFloat(e.target.value) || 1 } })}
              className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-amber-500/40 font-mono text-center"
            />
          </Row>
        ))}
      </Section>

      <Section title="Public Profile">
        <Row label="Enable Public Profile" desc="Makes your profile visible at /p/userId">
          <Toggle value={settings.publicProfile} onChange={v => saveSettings({ publicProfile: v })} />
        </Row>
        {(['streak', 'completion', 'masteryLevel', 'heatmap', 'showcase'] as const).map(widget => (
          <Row key={widget} label={`Show ${widget}`} desc={`/api/public/${userId}/${widget}`}>
            <Toggle
              value={settings.publicWidgets?.[widget] ?? false}
              onChange={v => saveSettings({ publicWidgets: { ...settings.publicWidgets, [widget]: v } })}
            />
          </Row>
        ))}
      </Section>

      <Section title="Notifications">
        <Row label="Streak alert" desc="Reminder if you haven't logged today">
          <Toggle value={settings.notifications?.streakAlert ?? true} onChange={v => saveSettings({ notifications: { ...settings.notifications, streakAlert: v } })} />
        </Row>
        <Row label="Achievement toasts" desc="Pop-up when you unlock something">
          <Toggle value={settings.notifications?.achievementToast ?? true} onChange={v => saveSettings({ notifications: { ...settings.notifications, achievementToast: v } })} />
        </Row>
      </Section>

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-5 py-3 rounded-2xl text-sm font-medium"
        >
          ✓ {saved.charAt(0).toUpperCase() + saved.slice(1)} saved
        </motion.div>
      )}
    </div>
  );
}
