// ─────────────────────────────────────────────────────────────────────────────
//  db/habitMethods.ts  –  CRUD for the `habits` table
// ─────────────────────────────────────────────────────────────────────────────

import { type SQLiteDatabase } from 'expo-sqlite';
import {
  type Habit,
  type CreateHabitInput,
  type UpdateHabitInput,
  type HabitWithStreak
} from './types';
import {
  buildSetClause,
  computeStreaks,
  enumerateDates,
  toDateString,
  todayDateString,
  type SQLiteBindValue
} from './utils';

/** Trailing window (in days) used for the completion/failure rates that feed the Chai Score. */
const RATE_WINDOW_DAYS = 30;

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * Insert a new habit. Returns the full created row.
 */
export async function createHabit(db: SQLiteDatabase, input: CreateHabitInput): Promise<Habit> {
  const result = await db.runAsync(
    `INSERT INTO habits
       (user_id, title, description, icon, color,
        frequency_type, frequency_days, target_count, priority,
        reminder_status, reminder_time, notification_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.user_id,
      input.title,
      input.description ?? null,
      input.icon ?? null,
      input.color ?? null,
      input.frequency_type,
      input.frequency_days,
      input.target_count,
      input.priority ?? 'medium',
      input.reminder_status ?? 'disabled',
      input.reminder_time ?? null,
      input.notification_id ?? null
    ]
  );

  const habit = await db.getFirstAsync<Habit>(`SELECT * FROM habits WHERE id = ?`, [
    result.lastInsertRowId
  ]);
  if (!habit) throw new Error('createHabit: failed to retrieve inserted row');
  return habit;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Fetch a single habit by ID. Returns null if not found. */
export async function getHabitById(db: SQLiteDatabase, id: number): Promise<Habit | null> {
  return db.getFirstAsync<Habit>(`SELECT * FROM habits WHERE id = ?`, [id]);
}

/** Fetch all active (non-archived) habits for a user. */
export async function getActiveHabits(db: SQLiteDatabase, userId: number): Promise<Habit[]> {
  return db.getAllAsync<Habit>(
    `SELECT * FROM habits
     WHERE user_id = ? AND is_archived = 0
     ORDER BY created_at ASC`,
    [userId]
  );
}

/** Fetch archived habits for a user. */
export async function getArchivedHabits(db: SQLiteDatabase, userId: number): Promise<Habit[]> {
  return db.getAllAsync<Habit>(
    `SELECT * FROM habits
     WHERE user_id = ? AND is_archived = 1
     ORDER BY updated_at DESC`,
    [userId]
  );
}

/**
 * Fetch all active habits enriched with streak & completion totals.
 * Keeps the streak math in JS (avoids complex window-function SQL).
 */
export async function getHabitsWithStreaks(
  db: SQLiteDatabase,
  userId: number
): Promise<HabitWithStreak[]> {
  const habits = await getActiveHabits(db, userId);

  if (habits.length === 0) return [];

  const habitIds = habits.map((h) => h.id);
  const placeholders = habitIds.map(() => '?').join(', ');

  // Query 1: every completed OR frozen date for every active habit, in one
  // round trip. 'frozen' days (recovered with a Chai Scroll — see
  // db/scrollMethods.ts) count toward streak continuity even though they're
  // not real completions, so a single covered gap doesn't reset the streak.
  const dateRows = await db.getAllAsync<{ habit_id: number; date: string }>(
    `SELECT habit_id, date FROM habit_history
     WHERE habit_id IN (${placeholders}) AND status IN ('completed', 'frozen')
     ORDER BY habit_id ASC, date ASC`,
    habitIds
  );

  // Query 2: total completions per habit, in one round trip.
  const countRows = await db.getAllAsync<{ habit_id: number; total: number }>(
    `SELECT habit_id, COUNT(*) AS total FROM habit_history
     WHERE habit_id IN (${placeholders}) AND status = 'completed'
     GROUP BY habit_id`,
    habitIds
  );

  // Query 3: raw status rows (with date) within the trailing rate window, in
  // one round trip. Used to derive completion_rate_30d / failure_rate_30d
  // below — these feed straight into the Chai Score (see utils/chaiScore.ts).
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - (RATE_WINDOW_DAYS - 1));
  const windowStartStr = toDateString(windowStart);

  const recentRows = await db.getAllAsync<{ habit_id: number; date: string; status: string }>(
    `SELECT habit_id, date, status FROM habit_history
     WHERE habit_id IN (${placeholders}) AND date >= ?`,
    [...habitIds, windowStartStr]
  );

  // Group dates by habit_id
  const datesByHabit = new Map<number, string[]>();
  for (const row of dateRows) {
    const arr = datesByHabit.get(row.habit_id);
    if (arr) arr.push(row.date);
    else datesByHabit.set(row.habit_id, [row.date]);
  }

  // Map counts by habit_id
  const countByHabit = new Map<number, number>();
  for (const row of countRows) {
    countByHabit.set(row.habit_id, row.total);
  }

  // Group recent status-by-date per habit_id, so we can walk day by day.
  const recentByHabit = new Map<number, Map<string, string>>();
  for (const row of recentRows) {
    let byDate = recentByHabit.get(row.habit_id);
    if (!byDate) {
      byDate = new Map<string, string>();
      recentByHabit.set(row.habit_id, byDate);
    }
    byDate.set(row.date, row.status);
  }

  const today = todayDateString();
  const yesterday = toDateString(new Date(Date.now() - 86400000));

  // Compute streaks + windowed rates in JS (no DB calls in this loop)
  return habits.map((habit) => {
    const dates = datesByHabit.get(habit.id) ?? [];
    const { currentStreak, longestStreak } = computeStreaks(dates);

    // A habit is only ever judged from the day it was created onward, and
    // never against days before it existed — and never against a 30-day
    // window it hasn't lived through yet.
    const createdDateStr = habit.created_at.slice(0, 10);
    const rangeStart = createdDateStr > windowStartStr ? createdDateStr : windowStartStr;

    // Fully-elapsed days only (up to yesterday). Today isn't over yet, so
    // it's handled separately below instead of being enumerated here.
    const elapsedDays = enumerateDates(rangeStart, yesterday);
    const historyForHabit = recentByHabit.get(habit.id) ?? new Map<string, string>();

    let completedInWindow = 0;
    let skippedInWindow = 0;
    let missedInWindow = 0;
    let windowDays = 0;

    for (const day of elapsedDays) {
      const status = historyForHabit.get(day);
      if (status === 'completed') {
        completedInWindow++;
        windowDays++;
      } else if (status === 'skipped') {
        skippedInWindow++;
        windowDays++;
      } else if (status === 'frozen') {
        // Recovered with a Chai Scroll — it exists purely to keep the
        // *streak* alive, so it's neutral here: not a miss, but not a real
        // completion either. Excluded from the rate denominator entirely.
      } else {
        missedInWindow++; // day fully passed with nothing logged → missed
        windowDays++;
      }
    }

    // Today only counts once it actually has a logged outcome. A habit
    // created today — or any habit not yet acted on today — shouldn't be
    // scored as "missed" before the day has even finished.
    if (createdDateStr <= today) {
      const todayStatus = historyForHabit.get(today);
      if (todayStatus === 'completed') {
        completedInWindow++;
        windowDays++;
      } else if (todayStatus === 'skipped') {
        skippedInWindow++;
        windowDays++;
      }
      // else: today is still pending — excluded from the denominator.
    }

    // A Chai Scroll can only patch a real gap: yesterday must have no
    // history entry at all, and the habit must have already existed then
    // (no recovering a day before it was created).
    const recoverableDate =
      createdDateStr <= yesterday && !historyForHabit.has(yesterday) ? yesterday : null;

    return {
      ...habit,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      total_completions: countByHabit.get(habit.id) ?? 0,
      completion_rate_30d: windowDays > 0 ? completedInWindow / windowDays : 0,
      failure_rate_30d: windowDays > 0 ? (skippedInWindow + missedInWindow) / windowDays : 0,
      recoverableDate
    };
  });
}

/** Fetch habits that have an enabled reminder (used by notification scheduler). */
export async function getHabitsWithReminders(db: SQLiteDatabase, userId: number): Promise<Habit[]> {
  return db.getAllAsync<Habit>(
    `SELECT * FROM habits
     WHERE user_id = ? AND is_archived = 0 AND reminder_status = 'enabled'`,
    [userId]
  );
}

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Partially update a habit. Only keys present in `input` are changed.
 */
export async function updateHabit(
  db: SQLiteDatabase,
  id: number,
  input: UpdateHabitInput
): Promise<Habit> {
  if (Object.keys(input).length === 0) {
    const existing = await getHabitById(db, id);
    if (!existing) throw new Error(`updateHabit: habit ${id} not found`);
    return existing;
  }

  const { clause, values } = buildSetClause(input as Record<string, SQLiteBindValue | undefined>);

  await db.runAsync(`UPDATE habits SET ${clause} WHERE id = ?`, [...values, id]);

  const updated = await getHabitById(db, id);
  if (!updated) throw new Error(`updateHabit: habit ${id} not found after update`);
  return updated;
}

/** Convenience wrapper to archive a habit (soft delete). */
export async function archiveHabit(db: SQLiteDatabase, id: number): Promise<Habit> {
  return updateHabit(db, id, { is_archived: 1 });
}

/** Restore a previously archived habit. */
export async function unarchiveHabit(db: SQLiteDatabase, id: number): Promise<Habit> {
  return updateHabit(db, id, { is_archived: 0 });
}

/** Update the notification_id stored against a habit after scheduling. */
export async function setHabitNotificationId(
  db: SQLiteDatabase,
  habitId: number,
  notificationId: string | null
): Promise<void> {
  await db.runAsync(`UPDATE habits SET notification_id = ? WHERE id = ?`, [
    notificationId,
    habitId
  ]);
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Permanently delete a habit and all its history (via CASCADE).
 */
export async function deleteHabit(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync(`DELETE FROM habits WHERE id = ?`, [id]);
}
