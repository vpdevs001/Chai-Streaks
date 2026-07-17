// ─────────────────────────────────────────────────────────────────────────────
//  db/scrollMethods.ts  –  "Chai Scroll" streak-recovery currency
//
//  Earn one Chai Scroll every time a habit's current streak crosses a new
//  multiple of 7 (7, 14, 21, ...). Spend one to "freeze" a missed day —
//  turning a gap in a habit's history into a `frozen` entry so the streak
//  keeps running right through it, instead of resetting to zero.
//
//  Scrolls are a single balance on the user (users.chai_scrolls), spendable
//  against any of their habits. Each habit tracks the highest streak length
//  it has already been paid out for (habits.last_scroll_award_streak) so a
//  recompute of getHabitsWithStreaks() never mints the same scroll twice.
// ─────────────────────────────────────────────────────────────────────────────

import { type SQLiteDatabase } from 'expo-sqlite';

/** Award one scroll every N days of streak. */
const SCROLL_STREAK_INTERVAL = 7;

/**
 * Call this right after a habit's completion is recorded for today, passing
 * its freshly-recomputed `current_streak`. If the streak has crossed one or
 * more new multiples of 7 since the last award, mints that many Chai
 * Scrolls onto the user's balance and records the new high-water mark.
 *
 * Returns the number of scrolls just awarded (0 if none — the common case).
 */
export async function maybeAwardChaiScroll(
  db: SQLiteDatabase,
  habitId: number,
  userId: number,
  currentStreak: number
): Promise<number> {
  const habit = await db.getFirstAsync<{ last_scroll_award_streak: number }>(
    `SELECT last_scroll_award_streak FROM habits WHERE id = ?`,
    [habitId]
  );
  const lastAwarded = habit?.last_scroll_award_streak ?? 0;

  const milestonesReached = Math.floor(currentStreak / SCROLL_STREAK_INTERVAL);
  const milestonesAlreadyPaid = Math.floor(lastAwarded / SCROLL_STREAK_INTERVAL);
  const scrollsToAward = milestonesReached - milestonesAlreadyPaid;

  if (scrollsToAward <= 0) return 0;

  await db.withExclusiveTransactionAsync(async (txn) => {
    const t = txn as unknown as SQLiteDatabase;
    await t.runAsync(`UPDATE habits SET last_scroll_award_streak = ? WHERE id = ?`, [
      currentStreak,
      habitId
    ]);
    await t.runAsync(`UPDATE users SET chai_scrolls = chai_scrolls + ? WHERE id = ?`, [
      scrollsToAward,
      userId
    ]);
  });

  return scrollsToAward;
}

/**
 * Spend one Chai Scroll to recover a habit's streak by "freezing" a missed
 * day — the day counts as covered (not a miss) when streaks are computed,
 * so the streak survives the gap instead of resetting.
 *
 * Throws if the user has no scrolls left, or if that day is already logged
 * (nothing to recover — use the normal complete/skip actions instead).
 */
export async function recoverHabitStreak(
  db: SQLiteDatabase,
  habitId: number,
  userId: number,
  date: string
): Promise<void> {
  const user = await db.getFirstAsync<{ chai_scrolls: number }>(
    `SELECT chai_scrolls FROM users WHERE id = ?`,
    [userId]
  );
  if (!user || user.chai_scrolls <= 0) {
    throw new Error('recoverHabitStreak: no Chai Scrolls available');
  }

  const existing = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM habit_history WHERE habit_id = ? AND date = ?`,
    [habitId, date]
  );
  if (existing) {
    throw new Error('recoverHabitStreak: that day is already logged');
  }

  await db.withExclusiveTransactionAsync(async (txn) => {
    const t = txn as unknown as SQLiteDatabase;
    await t.runAsync(
      `INSERT INTO habit_history (habit_id, user_id, date, status, completion_count)
       VALUES (?, ?, ?, 'frozen', 0)`,
      [habitId, userId, date]
    );
    await t.runAsync(`UPDATE users SET chai_scrolls = chai_scrolls - 1 WHERE id = ?`, [userId]);
  });
}
