// ─────────────────────────────────────────────────────────────────────────────
//  db/scrollMethods.ts  –  "Chai Scroll" streak-recovery currency
//
//  EARNING  — one scroll is awarded whenever the user maintains a 50%+
//  overall completion rate across ALL active habits for 7 CONSECUTIVE
//  calendar days.  The check runs against the trailing 7 days from today.
//  To prevent minting the same scroll twice in the same 7-day window, the
//  user row stores `last_scroll_award_date`.  A new scroll is only awarded
//  once per non-overlapping 7-day block that meets the threshold.
//
//  SPENDING — spend one scroll to "freeze" a missed day for a habit so its
//  streak survives the gap instead of resetting to zero.
// ─────────────────────────────────────────────────────────────────────────────

import { type SQLiteDatabase } from 'expo-sqlite';

/** Minimum overall completion rate across all 7 trailing days to earn a scroll. */
const SCROLL_RATE_THRESHOLD = 0.5; // 50%

/**
 * Check whether the user has maintained ≥50% overall completion rate for
 * the past 7 days (including today). If so, and they have not already been
 * awarded a scroll for this 7-day window, award one and record today as the
 * new award date.
 *
 * Call this after any habit toggle so the award fires as soon as the user
 * crosses the threshold.
 *
 * Returns the number of scrolls awarded (0 or 1).
 */
export async function checkAndAwardUserChaiScroll(
  db: SQLiteDatabase,
  userId: number
): Promise<number> {
  // ── 1. Work out the trailing 7-day window ──────────────────────────────────
  const today = new Date();
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  const windowStart = dates[0]; // 6 days ago
  const windowEnd   = dates[6]; // today

  // ── 2. Check if we already awarded a scroll for this exact window ──────────
  const userRow = await db.getFirstAsync<{ chai_scrolls: number; last_scroll_award_date: string | null }>(
    `SELECT chai_scrolls, last_scroll_award_date FROM users WHERE id = ?`,
    [userId]
  );
  if (!userRow) return 0;

  // If the last award date falls within [windowStart, windowEnd], we've
  // already paid out for this window — don't double-mint.
  const lastAward = userRow.last_scroll_award_date ?? '';
  if (lastAward >= windowStart && lastAward <= windowEnd) return 0;

  // ── 3. Fetch all active habits that existed at the start of the window ─────
  const habits = await db.getAllAsync<{ id: number; created_at: string }>(
    `SELECT id, created_at FROM habits
     WHERE user_id = ? AND is_archived = 0 AND date(created_at) <= ?`,
    [userId, windowEnd]
  );
  if (habits.length === 0) return 0;

  // ── 4. For each day, count completions vs. total eligible habits ───────────
  let totalPossible = 0;
  let totalCompleted = 0;

  for (const date of dates) {
    // Habits that existed on this date
    const eligibleHabits = habits.filter((h) => h.created_at.slice(0, 10) <= date);
    if (eligibleHabits.length === 0) continue;

    const habitIds = eligibleHabits.map((h) => h.id);
    const placeholders = habitIds.map(() => '?').join(', ');

    const completedOnDay = await db.getFirstAsync<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM habit_history
       WHERE habit_id IN (${placeholders})
         AND date = ?
         AND status = 'completed'`,
      [...habitIds, date]
    );

    totalPossible  += eligibleHabits.length;
    totalCompleted += completedOnDay?.cnt ?? 0;
  }

  // ── 5. Check threshold ─────────────────────────────────────────────────────
  if (totalPossible === 0) return 0;
  const rate = totalCompleted / totalPossible;
  if (rate < SCROLL_RATE_THRESHOLD) return 0;

  // ── 6. Award the scroll ────────────────────────────────────────────────────
  await db.withExclusiveTransactionAsync(async (txn) => {
    const t = txn as unknown as SQLiteDatabase;
    await t.runAsync(
      `UPDATE users
         SET chai_scrolls = chai_scrolls + 1,
             last_scroll_award_date = ?
       WHERE id = ?`,
      [windowEnd, userId]
    );
  });

  return 1;
}

/**
 * Legacy per-habit scroll award — no longer used for earning, kept so
 * existing imports don't break. Returns 0 immediately.
 * @deprecated Use checkAndAwardUserChaiScroll instead.
 */
export async function maybeAwardChaiScroll(
  _db: SQLiteDatabase,
  _habitId: number,
  _userId: number,
  _currentStreak: number
): Promise<number> {
  return 0;
}

/**
 * Spend one Chai Scroll to recover a habit's streak by "freezing" a missed
 * day — the day counts as covered (not a miss) when streaks are computed,
 * so the streak survives the gap instead of resetting.
 *
 * Throws if the user has no scrolls left, or if that day is already logged.
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
