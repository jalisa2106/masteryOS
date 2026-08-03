import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS = ['jalisa'];
const ROADMAP_START_DATE = '2026-07-26'; // DD-MM-YYYY: 26-07-2026

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath: string, data: unknown) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Created: ${filePath}`);
  } else {
    console.log(`Exists (skipped): ${filePath}`);
  }
}

for (const userId of USERS) {
  const userDir = path.join(DATA_DIR, 'users', userId);
  ensureDir(userDir);

  const displayName = 'Jalisa';

  writeFile(path.join(userDir, 'profile.json'), {
    userId,
    displayName,
    avatarInitials: displayName.slice(0, 2).toUpperCase(),
    themeAccent: { h: 37, s: 94, l: 50 }, // amber
    workingHours: { start: '09:00', end: '23:00' },
    preferredStudyDuration: 60,
    roadmapStartDates: {
      '6month-mastery': ROADMAP_START_DATE,
      'webdev-8week': ROADMAP_START_DATE,
    },
    activeRoadmaps: ['6month-mastery', 'webdev-8week'],
    createdAt: new Date().toISOString(),
  });

  writeFile(path.join(userDir, 'progress.json'), {
    userId,
    nodes: {},
    streak: { current: 0, longest: 0, lastActiveDate: null },
    xp: { total: 0, level: 1 },
    archived: [],
    lastUpdated: new Date().toISOString(),
  });

  writeFile(path.join(userDir, 'sessions.json'), {
    userId,
    sessions: [],
  });

  writeFile(path.join(userDir, 'journal.json'), {
    userId,
    entries: [],
  });

  writeFile(path.join(userDir, 'retrospectives.json'), {
    userId,
    entries: [],
  });

  writeFile(path.join(userDir, 'achievements.json'), {
    userId,
    unlocked: [],
  });

  writeFile(path.join(userDir, 'resources.json'), {
    userId,
    resources: [],
  });

  writeFile(path.join(userDir, 'settings.json'), {
    userId,
    publicProfile: false,
    xpMultipliers: {
      easy: 1.0,
      medium: 1.5,
      hard: 2.0,
    },
    baseXP: 20,
    publicWidgets: {
      streak: false,
      completion: false,
      masteryLevel: false,
      heatmap: false,
      showcase: false,
    },
    quoteCategories: [
      'discipline', 'consistency', 'entrepreneurship', 'wealth', 'leadership',
      'engineering', 'software', 'stoicism', 'fitness', 'ambition',
    ],
    shownQuoteIndexes: [],
    notifications: {
      dailyReminder: false,
      streakAlert: true,
      achievementToast: true,
    },
  });

  console.log(`✓ User data seeded for ${userId}`);
}

// ─── Achievement Definitions ──────────────────────────────────────────────────

const achDir = path.join(DATA_DIR, 'achievements');
ensureDir(achDir);

writeFile(path.join(achDir, 'definitions.json'), {
  achievements: [
    // Consistency
    { id: 'ach-first-day', title: 'First Step', description: 'Completed your very first task.', category: 'consistency', rarity: 'common', roadmapScope: 'any', icon: 'footprints', xpReward: 50, hidden: false, criteria: { type: 'total-nodes', count: 1 } },
    { id: 'ach-first-week', title: 'First Week Down', description: 'Completed every scheduled node in your first week.', category: 'consistency', rarity: 'common', roadmapScope: 'any', icon: 'flame', xpReward: 150, hidden: false, criteria: { type: 'week-completion', count: 1 } },
    { id: 'ach-streak-7', title: 'Week Warrior', description: 'Maintained a 7-day streak.', category: 'consistency', rarity: 'common', roadmapScope: 'any', icon: 'zap', xpReward: 100, hidden: false, criteria: { type: 'streak', days: 7 } },
    { id: 'ach-streak-14', title: 'Two Weeks Strong', description: 'Maintained a 14-day streak.', category: 'consistency', rarity: 'rare', roadmapScope: 'any', icon: 'zap', xpReward: 200, hidden: false, criteria: { type: 'streak', days: 14 } },
    { id: 'ach-streak-30', title: 'Unbreakable', description: '30-day streak — iron discipline.', category: 'consistency', rarity: 'epic', roadmapScope: 'any', icon: 'shield', xpReward: 500, hidden: false, criteria: { type: 'streak', days: 30 } },
    { id: 'ach-streak-60', title: 'Machine Mode', description: '60 days without breaking the chain.', category: 'consistency', rarity: 'legendary', roadmapScope: 'any', icon: 'crown', xpReward: 1000, hidden: false, criteria: { type: 'streak', days: 60 } },
    { id: 'ach-streak-100', title: 'Centurion', description: '100-day streak. You are the roadmap.', category: 'consistency', rarity: 'legendary', roadmapScope: 'any', icon: 'trophy', xpReward: 2000, hidden: false, criteria: { type: 'streak', days: 100 } },
    // 6-Month Mastery specific
    { id: 'ach-first-contest', title: 'Contestant', description: 'Completed your first Codeforces contest.', category: 'milestone', rarity: 'common', roadmapScope: '6month-mastery', icon: 'terminal', xpReward: 100, hidden: false, criteria: { type: 'node-type', nodeType: 'contest', count: 1 } },
    { id: 'ach-100-problems', title: 'Century Solver', description: 'Solved 100 DSA problems.', category: 'milestone', rarity: 'epic', roadmapScope: '6month-mastery', icon: 'hash', xpReward: 750, hidden: false, criteria: { type: 'track-nodes', track: 'DSA', count: 100 } },
    { id: 'ach-first-book', title: 'Bookworm v1', description: 'Finished your first business/finance book.', category: 'learning', rarity: 'rare', roadmapScope: '6month-mastery', icon: 'book-open', xpReward: 200, hidden: false, criteria: { type: 'track-nodes', track: 'Business', count: 4 } },
    { id: 'ach-dsa-phase-1', title: 'Pattern Hunter', description: 'Completed Phase 1: DSA Patterns.', category: 'milestone', rarity: 'rare', roadmapScope: '6month-mastery', icon: 'layers', xpReward: 400, hidden: false, criteria: { type: 'phase-completion', phaseId: 'phase-1' } },
    { id: 'ach-dp-master', title: 'DP Demystified', description: 'Completed the entire Dynamic Programming phase.', category: 'milestone', rarity: 'epic', roadmapScope: '6month-mastery', icon: 'brain', xpReward: 600, hidden: false, criteria: { type: 'phase-completion', phaseId: 'phase-2' } },
    { id: 'ach-6month-complete', title: 'Mastery OS: Complete', description: 'Finished the full 6-Month Mastery Roadmap.', category: 'legendary', rarity: 'legendary', roadmapScope: '6month-mastery', icon: 'star', xpReward: 5000, hidden: false, criteria: { type: 'roadmap-completion', roadmapId: '6month-mastery' } },
    // 8-Week Web Dev specific
    { id: 'ach-todo-rebuilt', title: 'From Memory', description: 'Rebuilt the todo list entirely from memory on Day 14.', category: 'milestone', rarity: 'rare', roadmapScope: 'webdev-8week', icon: 'code-2', xpReward: 200, hidden: false, criteria: { type: 'specific-node', dayNumber: 14 } },
    { id: 'ach-full-stack-crud', title: 'Full Stack', description: 'Shipped full-stack CRUD with auth on Day 42.', category: 'milestone', rarity: 'epic', roadmapScope: 'webdev-8week', icon: 'server', xpReward: 600, hidden: false, criteria: { type: 'specific-node', dayNumber: 42 } },
    { id: 'ach-solo-build', title: 'Solo Architect', description: 'Completed the Week 8 Solo Build — no AI, no reference.', category: 'legendary', rarity: 'legendary', roadmapScope: 'webdev-8week', icon: 'rocket', xpReward: 1500, hidden: false, criteria: { type: 'phase-completion', phaseId: 'phase-2' } },
    { id: 'ach-webdev-complete', title: 'Manual Coder', description: 'Finished the 8-Week Web Dev Roadmap without AI.', category: 'legendary', rarity: 'legendary', roadmapScope: 'webdev-8week', icon: 'award', xpReward: 3000, hidden: false, criteria: { type: 'roadmap-completion', roadmapId: 'webdev-8week' } },
    // Hidden
    { id: 'ach-night-owl', title: '???', description: 'Completed a task between midnight and 4am.', category: 'hidden', rarity: 'rare', roadmapScope: 'any', icon: 'moon', xpReward: 150, hidden: true, criteria: { type: 'time-of-day', start: 0, end: 4 } },
    { id: 'ach-all-roadmaps', title: '???', description: 'Active on both roadmaps in the same week.', category: 'hidden', rarity: 'epic', roadmapScope: 'any', icon: 'layers', xpReward: 300, hidden: true, criteria: { type: 'multi-roadmap-week' } },
    { id: 'ach-first-retro', title: 'Introspector', description: 'Completed your first weekly retrospective.', category: 'consistency', rarity: 'common', roadmapScope: 'any', icon: 'rotate-ccw', xpReward: 75, hidden: false, criteria: { type: 'retrospectives', count: 1 } },
    { id: 'ach-journal-7', title: 'Daily Scribe', description: 'Logged 7 consecutive daily reviews.', category: 'consistency', rarity: 'rare', roadmapScope: 'any', icon: 'edit-3', xpReward: 200, hidden: false, criteria: { type: 'journal-streak', days: 7 } },
    { id: 'ach-level-10', title: 'Lvl 10 Reached', description: 'Reached Level 10.', category: 'progression', rarity: 'rare', roadmapScope: 'any', icon: 'trending-up', xpReward: 250, hidden: false, criteria: { type: 'level', level: 10 } },
    { id: 'ach-level-25', title: 'Elite', description: 'Reached Level 25.', category: 'progression', rarity: 'epic', roadmapScope: 'any', icon: 'activity', xpReward: 500, hidden: false, criteria: { type: 'level', level: 25 } },
  ]
});

// ─── Quotes seed ──────────────────────────────────────────────────────────────

const quotesDir = path.join(DATA_DIR, 'quotes');
ensureDir(quotesDir);

const quotes = [
  // Discipline
  { text: "Discipline equals freedom.", author: "Jocko Willink", category: "discipline" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle", category: "discipline" },
  { text: "The pain of discipline is far less than the pain of regret.", author: "Unknown", category: "discipline" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun", category: "discipline" },
  { text: "Self-control is strength. Calmness is mastery. You have to get to a point where your mood doesn't shift based on the insignificant actions of someone else.", author: "Morgan Freeman", category: "discipline" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier", category: "discipline" },
  { text: "All great achievements require time.", author: "Maya Angelou", category: "discipline" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain", category: "discipline" },
  // Consistency
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "consistency" },
  { text: "The chains of habit are too light to be felt until they are too heavy to be broken.", author: "Warren Buffett", category: "consistency" },
  { text: "Consistency is what transforms average into excellence.", author: "Unknown", category: "consistency" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma", category: "consistency" },
  { text: "A year from now you may wish you had started today.", author: "Karen Lamb", category: "consistency" },
  { text: "You don't rise to the level of your goals. You fall to the level of your systems.", author: "James Clear", category: "consistency" },
  // Engineering
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck", category: "engineering" },
  { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler", category: "engineering" },
  { text: "The most powerful tool we have as developers is automation.", author: "Scott Hanselman", category: "engineering" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson", category: "engineering" },
  { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House", category: "engineering" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci", category: "engineering" },
  { text: "The best code is no code at all.", author: "Jeff Atwood", category: "engineering" },
  { text: "Software is a great combination between artistry and engineering.", author: "Bill Gates", category: "engineering" },
  // Programming
  { text: "Programming isn't about what you know; it's about what you can figure out.", author: "Chris Pine", category: "programming" },
  { text: "The function of good software is to make the complex appear simple.", author: "Grady Booch", category: "programming" },
  { text: "In programming, the hard part isn't solving problems, but deciding what problems to solve.", author: "Paul Graham", category: "programming" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds", category: "programming" },
  { text: "Java is to JavaScript what car is to carpet.", author: "Chris Heilmann", category: "programming" },
  { text: "It is not enough to do your best; you must know what to do, and then do your best.", author: "W. Edwards Deming", category: "programming" },
  // Stoicism
  { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", category: "stoicism" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius", category: "stoicism" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius", category: "stoicism" },
  { text: "Man is not disturbed by events, but by his opinions about them.", author: "Epictetus", category: "stoicism" },
  { text: "If you want to improve, be content to be thought foolish and stupid.", author: "Epictetus", category: "stoicism" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca", category: "stoicism" },
  { text: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca", category: "stoicism" },
  // Ambition
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt", category: "ambition" },
  { text: "Dream big and dare to fail.", author: "Norman Vaughan", category: "ambition" },
  { text: "The biggest risk is not taking any risk.", author: "Mark Zuckerberg", category: "ambition" },
  { text: "Shoot for the moon. Even if you miss, you'll land among the stars.", author: "Norman Vincent Peale", category: "ambition" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs", category: "ambition" },
  // Wealth
  { text: "The real measure of your wealth is how much you'd be worth if you lost all your money.", author: "Unknown", category: "wealth" },
  { text: "Compound interest is the eighth wonder of the world.", author: "Albert Einstein", category: "wealth" },
  { text: "Do not save what is left after spending; instead spend what is left after saving.", author: "Warren Buffett", category: "wealth" },
  { text: "Risk comes from not knowing what you are doing.", author: "Warren Buffett", category: "wealth" },
  { text: "The goal of investing is not to minimize boredom, it's to maximize returns.", author: "Peter Lynch", category: "wealth" },
  // Entrepreneurship
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", category: "entrepreneurship" },
  { text: "Ideas are easy. Implementation is hard.", author: "Guy Kawasaki", category: "entrepreneurship" },
  { text: "Your most unhappy customers are your greatest source of learning.", author: "Bill Gates", category: "entrepreneurship" },
  { text: "Fail often so you can succeed sooner.", author: "Tom Kelley", category: "entrepreneurship" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", category: "entrepreneurship" },
  // Startups
  { text: "A startup is a company designed to grow fast.", author: "Paul Graham", category: "startups" },
  { text: "Make something people want.", author: "Paul Graham", category: "startups" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "startups" },
  { text: "Move fast and break things.", author: "Mark Zuckerberg", category: "startups" },
  { text: "Perfect is the enemy of good.", author: "Voltaire", category: "startups" },
  // Leadership
  { text: "Leadership is not about being in charge. It's about taking care of those in your charge.", author: "Simon Sinek", category: "leadership" },
  { text: "The greatest leader is not necessarily the one who does the greatest things. He is the one that gets the people to do the greatest things.", author: "Ronald Reagan", category: "leadership" },
  { text: "A good leader takes a little more than his share of the blame, a little less than his share of the credit.", author: "Arnold H. Glasgow", category: "leadership" },
  // Mathematics
  { text: "Mathematics is not about numbers, equations, computations, or algorithms: it is about understanding.", author: "William Paul Thurston", category: "mathematics" },
  { text: "The essence of mathematics lies in its freedom.", author: "Georg Cantor", category: "mathematics" },
  { text: "Without mathematics, there is nothing you can do. Everything around you is mathematics.", author: "Shakuntala Devi", category: "mathematics" },
  { text: "Go down deep enough into anything and you will find mathematics.", author: "Dean Schlicter", category: "mathematics" },
  // Life
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon", category: "life" },
  { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson", category: "life" },
  { text: "The unexamined life is not worth living.", author: "Socrates", category: "life" },
  { text: "In the end, it is not the years in your life that count. It's the life in your years.", author: "Abraham Lincoln", category: "life" },
  // Fitness
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn", category: "fitness" },
  { text: "No matter how slow you go, you are still lapping everybody on the couch.", author: "Unknown", category: "fitness" },
  { text: "The hardest lift is lifting your butt off the couch.", author: "Unknown", category: "fitness" },
  // Investing
  { text: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett", category: "investing" },
  { text: "In investing, what is comfortable is rarely profitable.", author: "Robert Arnott", category: "investing" },
  { text: "The individual investor should act consistently as an investor and not as a speculator.", author: "Benjamin Graham", category: "investing" },
  // Software
  { text: "Software is eating the world.", author: "Marc Andreessen", category: "software" },
  { text: "The computer was born to solve problems that did not exist before.", author: "Bill Gates", category: "software" },
  { text: "Every great developer you know got there by solving problems they were unqualified to solve until they did it.", author: "Patrick McKenzie", category: "software" },
  { text: "The art of programming is the art of organizing complexity.", author: "Edsger Dijkstra", category: "software" },
];

writeFile(path.join(quotesDir, 'quotes.json'), { quotes });

console.log('\n✅ All data files seeded successfully.');
