// ─────────────────────────────────────────────────────────────────────────────
//  db/timeMethods.ts  –  CRUD for the `time_entries` table
// ─────────────────────────────────────────────────────────────────────────────

import { type SQLiteDatabase } from 'expo-sqlite';
import { type TimeEntry, type CreateTimeEntryInput, type UpdateTimeEntryInput } from './types';
import { buildSetClause, type SQLiteBindValue, todayDateString, toDateString } from './utils';

// ─── Create ───────────────────────────────────────────────────────────────────

/** Start a new time entry (timer). Returns the created row. */
export async function startTimeEntry(
  db: SQLiteDatabase,
  input: CreateTimeEntryInput
): Promise<TimeEntry> {
  const result = await db.runAsync(
    `INSERT INTO time_entries (user_id, habit_id, task_name, start_time, end_time, duration_seconds)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.user_id,
      input.habit_id ?? null,
      input.task_name,
      input.start_time,
      input.end_time ?? null,
      input.duration_seconds ?? 0
    ]
  );

  const entry = await db.getFirstAsync<TimeEntry>(`SELECT * FROM time_entries WHERE id = ?`, [
    result.lastInsertRowId
  ]);
  if (!entry) throw new Error('startTimeEntry: failed to retrieve inserted row');
  return entry;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Get the currently running time entry (end_time IS NULL), if any. */
export async function getRunningTimeEntry(
  db: SQLiteDatabase,
  userId: number
): Promise<TimeEntry | null> {
  return db.getFirstAsync<TimeEntry>(
    `SELECT * FROM time_entries WHERE user_id = ? AND end_time IS NULL ORDER BY start_time DESC LIMIT 1`,
    [userId]
  );
}

/** Get all time entries for a user on a specific date (YYYY-MM-DD). */
export async function getTimeEntriesForDate(
  db: SQLiteDatabase,
  userId: number,
  date: string
): Promise<TimeEntry[]> {
  return db.getAllAsync<TimeEntry>(
    `SELECT * FROM time_entries
     WHERE user_id = ? AND date(start_time) = ?
     ORDER BY start_time ASC`,
    [userId, date]
  );
}

/** Get all time entries for a user within a date range. */
export async function getTimeEntriesInRange(
  db: SQLiteDatabase,
  userId: number,
  fromDate: string,
  toDate: string
): Promise<TimeEntry[]> {
  return db.getAllAsync<TimeEntry>(
    `SELECT * FROM time_entries
     WHERE user_id = ? AND date(start_time) BETWEEN ? AND ?
     ORDER BY start_time ASC`,
    [userId, fromDate, toDate]
  );
}

/** Get total seconds tracked per day for the last N days. */
export async function getDailyTimeTotals(
  db: SQLiteDatabase,
  userId: number,
  days: string[]
): Promise<Record<string, number>> {
  if (days.length === 0) return {};

  const placeholders = days.map(() => '?').join(', ');
  const rows = await db.getAllAsync<{ day: string; total_seconds: number }>(
    `SELECT date(start_time) AS day, SUM(duration_seconds) AS total_seconds
     FROM time_entries
     WHERE user_id = ? AND date(start_time) IN (${placeholders})
       AND end_time IS NOT NULL
     GROUP BY date(start_time)`,
    [userId, ...days]
  );

  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.day] = row.total_seconds;
  }
  return result;
}

/** Get recent time entries for a user (most recent first). */
export async function getRecentTimeEntries(
  db: SQLiteDatabase,
  userId: number,
  limit = 50
): Promise<TimeEntry[]> {
  return db.getAllAsync<TimeEntry>(
    `SELECT * FROM time_entries
     WHERE user_id = ? AND end_time IS NOT NULL
     ORDER BY start_time DESC
     LIMIT ?`,
    [userId, limit]
  );
}

// ─── Update ───────────────────────────────────────────────────────────────────

/** Stop a running time entry. Sets end_time and computes duration. */
export async function stopTimeEntry(db: SQLiteDatabase, entryId: number): Promise<TimeEntry> {
  const now = new Date().toISOString();
  const entry = await db.getFirstAsync<TimeEntry>(`SELECT * FROM time_entries WHERE id = ?`, [
    entryId
  ]);
  if (!entry) throw new Error(`stopTimeEntry: entry ${entryId} not found`);
  if (entry.end_time) throw new Error(`stopTimeEntry: entry ${entryId} is already stopped`);

  const startMs = new Date(entry.start_time).getTime();
  const endMs = new Date(now).getTime();
  const durationSeconds = Math.round((endMs - startMs) / 1000);

  await db.runAsync(`UPDATE time_entries SET end_time = ?, duration_seconds = ? WHERE id = ?`, [
    now,
    durationSeconds,
    entryId
  ]);

  const updated = await db.getFirstAsync<TimeEntry>(`SELECT * FROM time_entries WHERE id = ?`, [
    entryId
  ]);
  if (!updated) throw new Error(`stopTimeEntry: failed to retrieve updated row`);
  return updated;
}

/** Partially update a time entry. */
export async function updateTimeEntry(
  db: SQLiteDatabase,
  id: number,
  input: UpdateTimeEntryInput
): Promise<TimeEntry> {
  if (Object.keys(input).length === 0) {
    const existing = await db.getFirstAsync<TimeEntry>(`SELECT * FROM time_entries WHERE id = ?`, [
      id
    ]);
    if (!existing) throw new Error(`updateTimeEntry: entry ${id} not found`);
    return existing;
  }

  const { clause, values } = buildSetClause(input as Record<string, SQLiteBindValue | undefined>);
  await db.runAsync(`UPDATE time_entries SET ${clause} WHERE id = ?`, [...values, id]);

  const updated = await db.getFirstAsync<TimeEntry>(`SELECT * FROM time_entries WHERE id = ?`, [
    id
  ]);
  if (!updated) throw new Error(`updateTimeEntry: entry ${id} not found after update`);
  return updated;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/** Delete a time entry. */
export async function deleteTimeEntry(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync(`DELETE FROM time_entries WHERE id = ?`, [id]);
}
