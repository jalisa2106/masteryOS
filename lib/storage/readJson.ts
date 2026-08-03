import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

function readJsonFile<T>(relativePath: string): T {
  const filePath = path.join(DATA_DIR, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Data file not found: ${relativePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RoadmapNode {
  id: string;
  title: string;
  track: string;
  type: 'task' | 'checkpoint' | 'contest' | 'review';
  estimatedMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  dependencies: string[];
  resources: string[];
  checkpoint: boolean;
  dayNumber?: number;
}

export interface RoadmapWeek {
  id: string;
  title: string;
  tracks: string[];
  nodes: RoadmapNode[];
}

export interface RoadmapPhase {
  id: string;
  title: string;
  weeks: RoadmapWeek[];
}

export interface Roadmap {
  id: string;
  title: string;
  description: string;
  sourceFile: string;
  parsedAt: string;
  durationWeeks: number;
  color: string;
  phases: RoadmapPhase[];
  tracks: string[];
  totalNodes: number;
}

export interface RoadmapManifestEntry {
  id: string;
  title: string;
  file: string;
  color: string;
  durationWeeks: number;
  totalNodes: number;
}

export interface NodeProgress {
  status: 'completed' | 'in-progress' | 'skipped';
  completedAt: string;
  timeSpentMinutes: number;
  xpAwarded: number;
  confidence: number;
  notes: string;
}

export interface UserProgress {
  userId: string;
  nodes: Record<string, NodeProgress>;
  streak: { current: number; longest: number; lastActiveDate: string | null };
  xp: { total: number; level: number };
  archived: Array<{ nodeId: string; archivedAt: string; progress: NodeProgress }>;
  lastUpdated: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  avatarInitials: string;
  themeAccent: { h: number; s: number; l: number };
  workingHours: { start: string; end: string };
  preferredStudyDuration: number;
  roadmapStartDates: Record<string, string>;
  activeRoadmaps: string[];
  createdAt: string;
}

export interface JournalEntry {
  date: string;
  learned: string;
  blocked: string;
  difficult: string;
  confidence: number;
  mood: number;
  energy: number;
  focus: number;
  sleepHours: number;
  studyHours: number;
  journal: string;
  nodesCompletedToday: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserJournal {
  userId: string;
  entries: JournalEntry[];
}

export interface RetrospectiveEntry {
  weekNumber: number;
  weekStartDate: string;
  answers: {
    wins: string;
    struggles: string;
    keyLearning: string;
    nextWeekFocus: string;
  };
  computed: {
    nodesCompleted: number;
    hoursStudied: number;
    streakMaintained: boolean;
    weakestTrack: string;
    paceStatus: 'ahead' | 'on-track' | 'behind';
    predictedFinish6Month: string;
    predictedFinishWebDev: string;
  };
  createdAt: string;
}

export interface UserRetrospectives {
  userId: string;
  entries: RetrospectiveEntry[];
}

export interface AchievementUnlock {
  id: string;
  unlockedAt: string;
}

export interface UserAchievements {
  userId: string;
  unlocked: AchievementUnlock[];
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  roadmapScope: string;
  icon: string;
  xpReward: number;
  hidden: boolean;
  criteria: Record<string, unknown>;
}

export interface UserSettings {
  userId: string;
  publicProfile: boolean;
  xpMultipliers: { easy: number; medium: number; hard: number };
  baseXP: number;
  publicWidgets: Record<string, boolean>;
  quoteCategories: string[];
  shownQuoteIndexes: number[];
  notifications: Record<string, boolean>;
  dailyGoal?: number;
  focusTasksCount?: number;
}

export interface StudySession {
  id: string;
  date: string;
  durationMinutes: number;
  nodeIds: string[];
  roadmapId: string;
  mood: number;
  energy: number;
  notes: string;
}

export interface UserSessions {
  userId: string;
  sessions: StudySession[];
}

export interface QuoteEntry {
  text: string;
  author: string;
  category: string;
}

// ─── Reader Functions ──────────────────────────────────────────────────────────

export function getRoadmapManifest(): { roadmaps: RoadmapManifestEntry[] } {
  return readJsonFile('roadmaps/_manifest.json');
}

export function getRoadmap(id: string): Roadmap {
  return readJsonFile(`roadmaps/${id}.json`);
}

export function getAllRoadmaps(): Roadmap[] {
  const manifest = getRoadmapManifest();
  return manifest.roadmaps.map(r => getRoadmap(r.id));
}

export function getUserProgress(userId: string): UserProgress {
  validateUserId(userId);
  return readJsonFile(`users/${userId}/progress.json`);
}

export function getUserProfile(userId: string): UserProfile {
  validateUserId(userId);
  return readJsonFile(`users/${userId}/profile.json`);
}

export function getUserJournal(userId: string): UserJournal {
  validateUserId(userId);
  return readJsonFile(`users/${userId}/journal.json`);
}

export function getUserRetrospectives(userId: string): UserRetrospectives {
  validateUserId(userId);
  return readJsonFile(`users/${userId}/retrospectives.json`);
}

export function getUserAchievements(userId: string): UserAchievements {
  validateUserId(userId);
  return readJsonFile(`users/${userId}/achievements.json`);
}

export function getUserSettings(userId: string): UserSettings {
  validateUserId(userId);
  const data = readJsonFile<UserSettings>(`users/${userId}/settings.json`);
  if (data.dailyGoal === undefined) data.dailyGoal = 1;
  if (data.focusTasksCount === undefined) data.focusTasksCount = 3;
  return data;
}

export function getUserSessions(userId: string): UserSessions {
  validateUserId(userId);
  return readJsonFile(`users/${userId}/sessions.json`);
}

export function getAchievementDefinitions(): { achievements: AchievementDefinition[] } {
  return readJsonFile('achievements/definitions.json');
}

export function getQuotes(): { quotes: QuoteEntry[] } {
  return readJsonFile('quotes/quotes.json');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function ensureUserDirectory(userId: string) {
  const userDir = path.join(DATA_DIR, 'users', userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  
  const files = [
    'achievements.json',
    'journal.json',
    'leetcode.json',
    'profile.json',
    'progress.json',
    'resources.json',
    'retrospectives.json',
    'sessions.json',
    'settings.json'
  ];
  
  for (const file of files) {
    const filePath = path.join(userDir, file);
    if (!fs.existsSync(filePath)) {
      const templatePath = path.join(DATA_DIR, 'users', 'jalisa', file);
      if (fs.existsSync(templatePath)) {
        let content = fs.readFileSync(templatePath, 'utf-8');
        content = content.replace(/"userId":\s*"jalisa"/g, `"userId": "${userId}"`);
        if (file === 'profile.json') {
          const initials = userId.substring(0, 2).toUpperCase();
          const displayName = userId.charAt(0).toUpperCase() + userId.slice(1);
          content = content.replace(/"displayName":\s*"Jalisa"/g, `"displayName": "${displayName}"`);
          content = content.replace(/"avatarInitials":\s*"JA"/g, `"avatarInitials": "${initials}"`);
          const todayStr = new Date().toISOString().split('T')[0];
          content = content.replace(/"6month-mastery":\s*"[^"]*"/g, `"6month-mastery": "${todayStr}"`);
          content = content.replace(/"webdev-8week":\s*"[^"]*"/g, `"webdev-8week": "${todayStr}"`);
        }
        if (file === 'settings.json') {
          content = content.replace(/"dailyGoal":\s*\d+/g, `"dailyGoal": 2`);
          content = content.replace(/"focusTasksCount":\s*\d+/g, `"focusTasksCount": 2`);
        }
        if (file === 'progress.json') {
          const defaultProgress = {
            userId,
            nodes: {},
            streak: { current: 0, longest: 0, lastActiveDate: null },
            xp: { total: 0, level: 1 },
            archived: [],
            lastUpdated: new Date().toISOString()
          };
          content = JSON.stringify(defaultProgress, null, 2);
        }
        fs.writeFileSync(filePath, content, 'utf-8');
      }
    }
  }
}

export function validateUserId(userId: string): asserts userId is string {
  if (!userId || !/^[a-zA-Z0-9_-]+$/.test(userId)) {
    throw new Error('Invalid userId — path traversal prevented.');
  }
  ensureUserDirectory(userId);
}

/** Get all nodes across a roadmap, flattened */
export function getAllNodes(roadmap: Roadmap): RoadmapNode[] {
  return roadmap.phases.flatMap(p => p.weeks.flatMap(w => w.nodes));
}

/** XP required to reach a given level. Formula: 100 * n^1.5 */
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

/** Derive level from total XP */
export function levelFromXP(totalXP: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXP) level++;
  return level;
}

export interface ResourceEntry {
  id: string;
  title: string;
  url: string;
  type: 'video' | 'article' | 'course' | 'tool' | 'other';
  track?: string;
  completed: boolean;
  rating?: number;
  notes?: string;
  bookmarked: boolean;
  revisitDate?: string;
  addedAt: string;
}

export interface UserResources {
  userId: string;
  resources: ResourceEntry[];
}

export function getUserResources(userId: string): UserResources {
  validateUserId(userId);
  return readJsonFile<UserResources>(`users/${userId}/resources.json`);
}

export interface LeetCodeProblem {
  id: string;
  title: string;
  url: string;
  completed: boolean;
}

export interface LeetCodeSkill {
  id: string;
  title: string;
  track: string;
  problems: LeetCodeProblem[];
}

export interface UserLeetCode {
  userId: string;
  skills: LeetCodeSkill[];
}

export function getUserLeetCode(userId: string): UserLeetCode {
  validateUserId(userId);
  return readJsonFile<UserLeetCode>(`users/${userId}/leetcode.json`);
}
