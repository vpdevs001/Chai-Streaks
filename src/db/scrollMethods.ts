// ─────────────────────────────────────────────────────────────────────────────
//  db/scrollMethods.ts  –  "Chai Scroll" streak-recovery currency
//
//  EARNING  — the user's account-creation date anchors a sequence of fixed,
//  non-overlapping 7-day blocks: days 1–7, days 8–14, days 15–21, and so on.
//  Once a block has fully elapsed, its overall completion rate (across every
//  habit that existed during that block) is checked; if it's 60%+, one Chai
//  Scroll is awarded. Each block is evaluated exactly once — pass or fail —
//  tracked via `users.scroll_blocks_processed`, so nothing is ever
//  re-checked or double-awarded, and a block that narrowly misses the
//  threshold this week can't retroactively earn a scroll later.
//
//  SPENDING — spend one scroll to "freeze" a missed day for a habit so its
//  streak survives the gap instead of resetting to zero.
// ─────────────────────────────────────────────────────────────────────────────

import { type SQLiteDatabase } from 'expo-sqlite';
import { toDateString, enumerateDates } from './utils';

/** Length of one earning block, in days. */
const BLOCK_LENGTH_DAYS = 7;

/** Minimum overall completion rate across a 7-day block to earn a scroll. */
const SCROLL_RATE_THRESHOLD = 0.6; // 60%

/**
 * Check whether any new 7-day block(s), anchored to the user's account
 * creation date, have fully elapsed since the last check — and if so,
 * evaluate each one's completion rate and award a Chai Scroll for every
 * block that hits the 60% threshold.
 *
 * Call this after any habit toggle (or on app open) so the award fires as
 * soon as a block completes. Safe to call as often as you like: blocks that
 * haven't fully elapsed yet are simply skipped until they have, and each
 * block is processed at most once regardless of how many times this runs.
 *
 * Returns the number of scrolls awarded (usually 0 or 1; can be more than 1
 * if the app wasn't opened for a while and multiple blocks elapsed at once).
 */
export async function checkAndAwardUserChaiScroll(
  db: SQLiteDatabase,
  userId: number
): Promise<number> {
  // ── 1. Load the user's account creation date + earning progress ───────────
  const userRow = await db.getFirstAsync<{
    created_at: string;
    scroll_blocks_processed: number;
  }>(`SELECT created_at, scroll_blocks_processed FROM users WHERE id = ?`, [userId]);
  if (!userRow) return 0;

  const accountCreatedDate = userRow.created_at.slice(0, 10); // YYYY-MM-DD
  const createdAtMidnight = new Date(accountCreatedDate + 'T00:00:00');
  const todayMidnight = new Date(toDateString(new Date()) + 'T00:00:00');

  const daysSinceCreation =
    Math.floor((todayMidnight.getTime() - createdAtMidnight.getTime()) / 86_400_000) + 1; // creation day counts as day 1

  // How many 7-day blocks have fully elapsed as of today?
  const fullyElapsedBlocks = Math.floor(daysSinceCreation / BLOCK_LENGTH_DAYS);

  // Nothing new to process (either account is <7 days old, or every elapsed
  // block has already been checked).
  if (fullyElapsedBlocks <= userRow.scroll_blocks_processed) return 0;

  // ── 2. Fetch every habit that has ever existed for this user once, up front ─
  const habits = await db.getAllAsync<{ id: number; created_at: string; is_archived: number }>(
    `SELECT id, created_at, is_archived FROM habits WHERE user_id = ?`,
    [userId]
  );

  let scrollsAwarded = 0;

  // ── 3. Walk forward one block at a time from where we left off ─────────────
  // (Normally this loop runs once. It only runs more than once if the app
  // was closed across multiple full blocks — each still gets its own,
  // correctly-scoped check.)
  for (
    let blockIndex = userRow.scroll_blocks_processed + 1;
    blockIndex <= fullyElapsedBlocks;
    blockIndex++
  ) {
    const blockStart = new Date(createdAtMidnight);
    blockStart.setDate(blockStart.getDate() + (blockIndex - 1) * BLOCK_LENGTH_DAYS);
    const blockEnd = new Date(blockStart);
    blockEnd.setDate(blockEnd.getDate() + BLOCK_LENGTH_DAYS - 1);

    const blockStartStr = toDateString(blockStart);
    const blockEndStr = toDateString(blockEnd);
    const blockDates = enumerateDates(blockStartStr, blockEndStr);

    // Habits that existed at some point during this block (created on/before
    // the block's last day — habits archived mid-block still count for the
    // days they were active, so no extra filter on is_archived here; a habit
    // archived before the block even started simply has no history in it).
    const eligibleHabits = habits.filter((h) => h.created_at.slice(0, 10) <= blockEndStr);

    let totalPossible = 0;
    let totalCompleted = 0;

    for (const date of blockDates) {
      // Only habits that existed by this specific day count toward that day.
      const habitsOnDay = eligibleHabits.filter((h) => h.created_at.slice(0, 10) <= date);
      if (habitsOnDay.length === 0) continue;

      const habitIds = habitsOnDay.map((h) => h.id);
      const placeholders = habitIds.map(() => '?').join(', ');

      const completedOnDay = await db.getFirstAsync<{ cnt: number }>(
        `SELECT COUNT(*) AS cnt FROM habit_history
         WHERE habit_id IN (${placeholders})
           AND date = ?
           AND status = 'completed'`,
        [...habitIds, date]
      );

      totalPossible += habitsOnDay.length;
      totalCompleted += completedOnDay?.cnt ?? 0;
    }

    const rate = totalPossible > 0 ? totalCompleted / totalPossible : 0;
    const earned = totalPossible > 0 && rate >= SCROLL_RATE_THRESHOLD;

    // ── 4. Record the block as processed, and award a scroll if it earned one ─
    await db.withExclusiveTransactionAsync(async (txn) => {
      const t = txn as unknown as SQLiteDatabase;
      if (earned) {
        await t.runAsync(
          `UPDATE users
             SET chai_scrolls = chai_scrolls + 1,
                 scroll_blocks_processed = ?
           WHERE id = ?`,
          [blockIndex, userId]
        );
      } else {
        await t.runAsync(`UPDATE users SET scroll_blocks_processed = ? WHERE id = ?`, [
          blockIndex,
          userId
        ]);
      }
    });

    if (earned) scrollsAwarded += 1;
  }

  return scrollsAwarded;
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
