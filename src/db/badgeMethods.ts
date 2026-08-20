// ─────────────────────────────────────────────────────────────────────────────
//  db/badgeMethods.ts  –  Badge definitions, evaluation, and persistence
// ─────────────────────────────────────────────────────────────────────────────

import { type SQLiteDatabase } from 'expo-sqlite';
import { type UserBadge } from './types';
import { todayDateString, toDateString } from './utils';

// ─── Badge definitions ───────────────────────────────────────────────────────

export interface BadgeDefinition {
  key: string;
  emoji: string;
  title: string;
  description: string;
  category:
    'streak' | 'completions' | 'habits' | 'tasks' | 'score' | 'perfect' | 'scrolls' | 'time';
  threshold: number;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ── Streak badges (account-level consecutive days with ≥1 completion) ──
  {
    key: 'streak_3',
    emoji: '✨',
    title: 'Spark',
    description: '3-day streak',
    category: 'streak',
    threshold: 3
  },
  {
    key: 'streak_7',
    emoji: '🔥',
    title: 'Week Warrior',
    description: '7-day streak',
    category: 'streak',
    threshold: 7
  },
  {
    key: 'streak_14',
    emoji: '⚡',
    title: 'Fortnight Fighter',
    description: '14-day streak',
    category: 'streak',
    threshold: 14
  },
  {
    key: 'streak_21',
    emoji: '🧠',
    title: 'Habit Loop',
    description: '21-day streak: habit formed!',
    category: 'streak',
    threshold: 21
  },
  {
    key: 'streak_30',
    emoji: '💫',
    title: 'Monthly Master',
    description: '30-day streak',
    category: 'streak',
    threshold: 30
  },
  {
    key: 'streak_60',
    emoji: '🌟',
    title: 'Sixty Strong',
    description: '60-day streak',
    category: 'streak',
    threshold: 60
  },
  {
    key: 'streak_90',
    emoji: '💥',
    title: 'Quarter Champion',
    description: '90-day streak',
    category: 'streak',
    threshold: 90
  },
  {
    key: 'streak_180',
    emoji: '🏆',
    title: 'Half Year Hero',
    description: '180-day streak',
    category: 'streak',
    threshold: 180
  },
  {
    key: 'streak_365',
    emoji: '👑',
    title: 'Year Legend',
    description: '365-day streak',
    category: 'streak',
    threshold: 365
  },

  // ── Total completion badges ──
  {
    key: 'completions_10',
    emoji: '🎯',
    title: 'Getting Started',
    description: '10 total completions',
    category: 'completions',
    threshold: 10
  },
  {
    key: 'completions_25',
    emoji: '🚀',
    title: 'Steady Pace',
    description: '25 total completions',
    category: 'completions',
    threshold: 25
  },
  {
    key: 'completions_50',
    emoji: '🎪',
    title: 'Habit Builder',
    description: '50 total completions',
    category: 'completions',
    threshold: 50
  },
  {
    key: 'completions_100',
    emoji: '💯',
    title: 'Century Club',
    description: '100 total completions',
    category: 'completions',
    threshold: 100
  },
  {
    key: 'completions_250',
    emoji: '💎',
    title: 'Consistency Pro',
    description: '250 total completions',
    category: 'completions',
    threshold: 250
  },
  {
    key: 'completions_500',
    emoji: '🎖️',
    title: 'Five Hundred',
    description: '500 total completions',
    category: 'completions',
    threshold: 500
  },
  {
    key: 'completions_1000',
    emoji: '🏅',
    title: 'Thousand Club',
    description: '1000 total completions',
    category: 'completions',
    threshold: 1000
  },

  // ── Habit count badges (sensible realistic milestones) ──
  {
    key: 'habits_1',
    emoji: '🌱',
    title: 'First Seed',
    description: 'Create your first habit',
    category: 'habits',
    threshold: 1
  },
  {
    key: 'habits_3',
    emoji: '🌿',
    title: 'Triple Threat',
    description: 'Track 3 habits',
    category: 'habits',
    threshold: 3
  },
  {
    key: 'habits_5',
    emoji: '🖐️',
    title: 'High Five',
    description: 'Track 5 habits',
    category: 'habits',
    threshold: 5
  },
  {
    key: 'habits_7',
    emoji: '⭐',
    title: 'Daily Seven',
    description: 'Master 7 daily habits',
    category: 'habits',
    threshold: 7
  },

  // ── Daily Task tracking badges ──
  {
    key: 'tasks_1',
    emoji: '📝',
    title: 'First Task',
    description: 'Complete your first daily task',
    category: 'tasks',
    threshold: 1
  },
  {
    key: 'tasks_10',
    emoji: '📋',
    title: 'Task Tackler',
    description: 'Complete 10 daily tasks',
    category: 'tasks',
    threshold: 10
  },
  {
    key: 'tasks_25',
    emoji: '⚡',
    title: 'Action Oriented',
    description: 'Complete 25 daily tasks',
    category: 'tasks',
    threshold: 25
  },
  {
    key: 'tasks_50',
    emoji: '🎯',
    title: 'Productivity Pro',
    description: 'Complete 50 daily tasks',
    category: 'tasks',
    threshold: 50
  },
  {
    key: 'tasks_100',
    emoji: '🏆',
    title: 'Execution Master',
    description: 'Complete 100 daily tasks',
    category: 'tasks',
    threshold: 100
  },

  // ── Chai Score badges ──
  {
    key: 'score_20',
    emoji: '🍵',
    title: 'First Sip',
    description: 'Chai Score reaches 20',
    category: 'score',
    threshold: 20
  },
  {
    key: 'score_40',
    emoji: '☕',
    title: 'Chai Learner',
    description: 'Chai Score reaches 40',
    category: 'score',
    threshold: 40
  },
  {
    key: 'score_60',
    emoji: '🫖',
    title: 'Chai Expert',
    description: 'Chai Score reaches 60',
    category: 'score',
    threshold: 60
  },
  {
    key: 'score_80',
    emoji: '🧉',
    title: 'Master Chai',
    description: 'Chai Score reaches 80',
    category: 'score',
    threshold: 80
  },
  {
    key: 'score_100',
    emoji: '🏺',
    title: 'Perfect Brew',
    description: 'Chai Score reaches 100',
    category: 'score',
    threshold: 100
  },

  // ── Perfect day badges (all due habits completed) ──
  {
    key: 'perfect_1',
    emoji: '⭐',
    title: 'Perfect Day',
    description: 'Complete all habits in a day',
    category: 'perfect',
    threshold: 1
  },
  {
    key: 'perfect_7',
    emoji: '🌟',
    title: 'Perfect Week',
    description: '7 perfect days',
    category: 'perfect',
    threshold: 7
  },
  {
    key: 'perfect_30',
    emoji: '💫',
    title: 'Perfect Month',
    description: '30 perfect days',
    category: 'perfect',
    threshold: 30
  },

  // ── Chai Scroll badges ──
  {
    key: 'scrolls_1',
    emoji: '📜',
    title: 'First Scroll',
    description: 'Earn your first Chai Scroll',
    category: 'scrolls',
    threshold: 1
  },
  {
    key: 'scrolls_5',
    emoji: '📃',
    title: 'Scroll Collector',
    description: 'Earn 5 Chai Scrolls',
    category: 'scrolls',
    threshold: 5
  },
  {
    key: 'scrolls_10',
    emoji: '📄',
    title: 'Scroll Master',
    description: 'Earn 10 Chai Scrolls',
    category: 'scrolls',
    threshold: 10
  },

  // ── Time tracking badges ──
  {
    key: 'time_1h',
    emoji: '⏱️',
    title: 'First Hour',
    description: 'Track 1 hour total',
    category: 'time',
    threshold: 3600
  },
  {
    key: 'time_10h',
    emoji: '⏰',
    title: 'Time Apprentice',
    description: 'Track 10 hours total',
    category: 'time',
    threshold: 36000
  },
  {
    key: 'time_50h',
    emoji: '🕐',
    title: 'Time Master',
    description: 'Track 50 hours total',
    category: 'time',
    threshold: 180000
  },
  {
    key: 'time_100h',
    emoji: '🕰️',
    title: 'Time Lord',
    description: 'Track 100 hours total',
    category: 'time',
    threshold: 360000
  },
  {
    key: 'time_7d',
    emoji: '📅',
    title: 'Week Tracker',
    description: 'Track time 7 days in a row',
    category: 'time',
    threshold: 7
  },
  {
    key: 'time_30d',
    emoji: '🗓️',
    title: 'Month Tracker',
    description: 'Track time 30 days in a row',
    category: 'time',
    threshold: 30
  },
  {
    key: 'time_morning',
    emoji: '🌅',
    title: 'Early Bird',
    description: 'Track time before 9am',
    category: 'time',
    threshold: 1
  },
  {
    key: 'time_night',
    emoji: '🌙',
    title: 'Night Owl',
    description: 'Track time after 9pm',
    category: 'time',
    threshold: 1
  }
];

// ─── Badge evaluation ────────────────────────────────────────────────────────

/**
 * Compute the account-level streak: consecutive days (ending today or
 * yesterday) where the user completed at least one habit.
 */
export async function computeAccountStreak(
  db: SQLiteDatabase,
  userId: number
): Promise<{ currentStreak: number; longestStreak: number }> {
  const rows = await db.getAllAsync<{ date: string }>(
    `SELECT DISTINCT date FROM habit_history
     WHERE user_id = ? AND status IN ('completed', 'frozen')
     ORDER BY date ASC`,
    [userId]
  );

  if (rows.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const dateSet = new Set(rows.map((r) => r.date));
  const sorted = rows.map((r) => r.date).sort();

  // Longest streak (scan forward)
  let longestStreak = 1;
  let runLength = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00');
    const curr = new Date(sorted[i] + 'T00:00:00');
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    if (diffDays === 1) {
      runLength++;
      if (runLength > longestStreak) longestStreak = runLength;
    } else {
      runLength = 1;
    }
  }

  // Current streak (scan backward from today)
  const today = todayDateString();
  let currentStreak = 0;
  const cursor = new Date(today + 'T00:00:00');

  // If today has no completion yet, start from yesterday
  if (!dateSet.has(toDateString(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (dateSet.has(toDateString(cursor))) {
    currentStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { currentStreak, longestStreak };
}

/**
 * Evaluate all badges for a user and return newly earned ones.
 * Also persists them to the user_badges table.
 */
export async function evaluateAndAwardBadges(
  db: SQLiteDatabase,
  userId: number
): Promise<BadgeDefinition[]> {
  // Get already-earned badge keys
  const earnedRows = await db.getAllAsync<{ badge_key: string }>(
    `SELECT badge_key FROM user_badges WHERE user_id = ?`,
    [userId]
  );
  const earnedKeys = new Set(earnedRows.map((r) => r.badge_key));

  // Gather stats
  const { currentStreak, longestStreak } = await computeAccountStreak(db, userId);
  const maxStreak = Math.max(currentStreak, longestStreak);

  const completionRow = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM habit_history WHERE user_id = ? AND status = 'completed'`,
    [userId]
  );
  const totalCompletions = completionRow?.total ?? 0;

  const habitCountRow = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM habits WHERE user_id = ? AND is_archived = 0`,
    [userId]
  );
  const activeHabits = habitCountRow?.total ?? 0;

  const userRow = await db.getFirstAsync<{ chai_scrolls: number }>(
    `SELECT chai_scrolls FROM users WHERE id = ?`,
    [userId]
  );
  const totalScrolls = userRow?.chai_scrolls ?? 0;

  // Perfect days: days where all due habits were completed
  const perfectDays = await countPerfectDays(db, userId);

  // Chai Score — we need habits with streaks for this
  const { getHabitsWithStreaks } = await import('./habitMethods');
  const { computeChaiScore, habitsToChaiScoreInputs } = await import('../utils/chaiScore');
  const habits = await getHabitsWithStreaks(db, userId);
  const chaiScore = computeChaiScore(habitsToChaiScoreInputs(habits));

  // Time tracking stats
  const timeStats = await getTimeTrackingStats(db, userId);

  // Daily task completion stats
  const taskRow = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM daily_tasks WHERE user_id = ? AND is_completed = 1`,
    [userId]
  );
  const totalTasksCompleted = taskRow?.total ?? 0;

  // Evaluate each badge
  const newBadges: BadgeDefinition[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (earnedKeys.has(badge.key)) continue;

    let earned = false;
    switch (badge.category) {
      case 'streak':
        earned = maxStreak >= badge.threshold;
        break;
      case 'completions':
        earned = totalCompletions >= badge.threshold;
        break;
      case 'habits':
        earned = activeHabits >= badge.threshold;
        break;
      case 'tasks':
        earned = totalTasksCompleted >= badge.threshold;
        break;
      case 'score':
        earned = chaiScore >= badge.threshold;
        break;
      case 'perfect':
        earned = perfectDays >= badge.threshold;
        break;
      case 'scrolls':
        earned = totalScrolls >= badge.threshold;
        break;
      case 'time':
        earned = evaluateTimeBadge(badge.key, timeStats);
        break;
    }

    if (earned) {
      await db.runAsync(`INSERT OR IGNORE INTO user_badges (user_id, badge_key) VALUES (?, ?)`, [
        userId,
        badge.key
      ]);
      newBadges.push(badge);
    }
  }

  return newBadges;
}

// ─── Time tracking stats ─────────────────────────────────────────────────────

interface TimeTrackingStats {
  totalSeconds: number;
  consecutiveDays: number;
  hasMorningEntry: boolean;
  hasNightEntry: boolean;
}

async function getTimeTrackingStats(
  db: SQLiteDatabase,
  userId: number
): Promise<TimeTrackingStats> {
  // Total seconds tracked
  const totalRow = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(duration_seconds), 0) AS total FROM time_entries
     WHERE user_id = ? AND end_time IS NOT NULL`,
    [userId]
  );
  const totalSeconds = totalRow?.total ?? 0;

  // Consecutive days with at least one completed time entry
  const dateRows = await db.getAllAsync<{ day: string }>(
    `SELECT DISTINCT date(start_time) AS day FROM time_entries
     WHERE user_id = ? AND end_time IS NOT NULL
     ORDER BY day DESC`,
    [userId]
  );

  let consecutiveDays = 0;
  if (dateRows.length > 0) {
    const today = todayDateString();
    const cursor = new Date(today + 'T00:00:00');
    const dateSet = new Set(dateRows.map((r) => r.day));

    // If today has no entry, start from yesterday
    if (!dateSet.has(toDateString(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (dateSet.has(toDateString(cursor))) {
      consecutiveDays++;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  // Morning entry (before 9am)
  const morningRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM time_entries
     WHERE user_id = ? AND end_time IS NOT NULL
       AND strftime('%H', start_time) < '09'`,
    [userId]
  );
  const hasMorningEntry = (morningRow?.count ?? 0) > 0;

  // Night entry (after 9pm)
  const nightRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM time_entries
     WHERE user_id = ? AND end_time IS NOT NULL
       AND strftime('%H', start_time) >= '21'`,
    [userId]
  );
  const hasNightEntry = (nightRow?.count ?? 0) > 0;

  return { totalSeconds, consecutiveDays, hasMorningEntry, hasNightEntry };
}

function evaluateTimeBadge(key: string, stats: TimeTrackingStats): boolean {
  switch (key) {
    case 'time_1h':
      return stats.totalSeconds >= 3600;
    case 'time_10h':
      return stats.totalSeconds >= 36000;
    case 'time_50h':
      return stats.totalSeconds >= 180000;
    case 'time_100h':
      return stats.totalSeconds >= 360000;
    case 'time_7d':
      return stats.consecutiveDays >= 7;
    case 'time_30d':
      return stats.consecutiveDays >= 30;
    case 'time_morning':
      return stats.hasMorningEntry;
    case 'time_night':
      return stats.hasNightEntry;
    default:
      return false;
  }
}

/**
 * Count days where every habit that was due (and existed) was completed.
 */
async function countPerfectDays(db: SQLiteDatabase, userId: number): Promise<number> {
  // Get all habits with their creation dates
  const habits = await db.getAllAsync<{ id: number; created_at: string }>(
    `SELECT id, created_at FROM habits WHERE user_id = ?`,
    [userId]
  );
  if (habits.length === 0) return 0;

  // Get all completed dates
  const completedRows = await db.getAllAsync<{ date: string; habit_id: number }>(
    `SELECT date, habit_id FROM habit_history
     WHERE user_id = ? AND status = 'completed'
     ORDER BY date ASC`,
    [userId]
  );

  // Group completions by date
  const completionsByDate = new Map<string, Set<number>>();
  for (const row of completedRows) {
    let set = completionsByDate.get(row.date);
    if (!set) {
      set = new Set();
      completionsByDate.set(row.date, set);
    }
    set.add(row.habit_id);
  }

  let perfectCount = 0;
  for (const [date, completedHabitIds] of completionsByDate) {
    // How many habits existed on this date?
    const habitsOnDate = habits.filter((h) => h.created_at.slice(0, 10) <= date);
    if (habitsOnDate.length === 0) continue;

    // Were all of them completed?
    const allCompleted = habitsOnDate.every((h) => completedHabitIds.has(h.id));
    if (allCompleted) perfectCount++;
  }

  return perfectCount;
}

// ─── Read badges ─────────────────────────────────────────────────────────────

/** Get all badges earned by a user. */
export async function getUserBadges(db: SQLiteDatabase, userId: number): Promise<UserBadge[]> {
  return db.getAllAsync<UserBadge>(
    `SELECT * FROM user_badges WHERE user_id = ? ORDER BY earned_at DESC`,
    [userId]
  );
}

/** Get count of unseen badges for a user. */
export async function getUnseenBadgeCount(db: SQLiteDatabase, userId: number): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM user_badges WHERE user_id = ? AND seen = 0`,
    [userId]
  );
  return row?.count ?? 0;
}

/** Mark all badges as seen for a user. */
export async function markBadgesSeen(db: SQLiteDatabase, userId: number): Promise<void> {
  await db.runAsync(`UPDATE user_badges SET seen = 1 WHERE user_id = ?`, [userId]);
}
