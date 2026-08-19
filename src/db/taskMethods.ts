// ─────────────────────────────────────────────────────────────────────────────
//  db/taskMethods.ts  –  CRUD for the `daily_tasks` table
// ─────────────────────────────────────────────────────────────────────────────

import { type SQLiteDatabase } from 'expo-sqlite';
import { type DailyTask, type CreateDailyTaskInput, type UpdateDailyTaskInput } from './types';
import { buildSetClause, type SQLiteBindValue, todayDateString } from './utils';

// ─── Create ───────────────────────────────────────────────────────────────────

/** Add a new daily task. Returns the created row. */
export async function createDailyTask(
  db: SQLiteDatabase,
  input: CreateDailyTaskInput
): Promise<DailyTask> {
  const result = await db.runAsync(
    `INSERT INTO daily_tasks (user_id, habit_id, title, is_completed, date)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.user_id,
      input.habit_id ?? null,
      input.title,
      input.is_completed ?? 0,
      input.date
    ]
  );

  const task = await db.getFirstAsync<DailyTask>(`SELECT * FROM daily_tasks WHERE id = ?`, [
    result.lastInsertRowId
  ]);
  if (!task) throw new Error('createDailyTask: failed to retrieve inserted row');
  return task;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Get all tasks for a user on a specific date. */
export async function getDailyTasksForDate(
  db: SQLiteDatabase,
  userId: number,
  date: string
): Promise<DailyTask[]> {
  return db.getAllAsync<DailyTask>(
    `SELECT * FROM daily_tasks WHERE user_id = ? AND date = ? ORDER BY created_at ASC`,
    [userId, date]
  );
}

/** Get today's tasks for a user. */
export async function getTodayTasks(db: SQLiteDatabase, userId: number): Promise<DailyTask[]> {
  return getDailyTasksForDate(db, userId, todayDateString());
}

// ─── Update ───────────────────────────────────────────────────────────────────

/** Toggle a task's completion status. */
export async function toggleDailyTask(
  db: SQLiteDatabase,
  taskId: number
): Promise<DailyTask> {
  const task = await db.getFirstAsync<DailyTask>(`SELECT * FROM daily_tasks WHERE id = ?`, [
    taskId
  ]);
  if (!task) throw new Error(`toggleDailyTask: task ${taskId} not found`);

  const newStatus = task.is_completed === 1 ? 0 : 1;
  await db.runAsync(`UPDATE daily_tasks SET is_completed = ? WHERE id = ?`, [newStatus, taskId]);

  const updated = await db.getFirstAsync<DailyTask>(`SELECT * FROM daily_tasks WHERE id = ?`, [
    taskId
  ]);
  if (!updated) throw new Error(`toggleDailyTask: failed to retrieve updated row`);
  return updated;
}

/** Partially update a daily task. */
export async function updateDailyTask(
  db: SQLiteDatabase,
  id: number,
  input: UpdateDailyTaskInput
): Promise<DailyTask> {
  if (Object.keys(input).length === 0) {
    const existing = await db.getFirstAsync<DailyTask>(`SELECT * FROM daily_tasks WHERE id = ?`, [
      id
    ]);
    if (!existing) throw new Error(`updateDailyTask: task ${id} not found`);
    return existing;
  }

  const { clause, values } = buildSetClause(input as Record<string, SQLiteBindValue | undefined>);
  await db.runAsync(`UPDATE daily_tasks SET ${clause} WHERE id = ?`, [...values, id]);

  const updated = await db.getFirstAsync<DailyTask>(`SELECT * FROM daily_tasks WHERE id = ?`, [
    id
  ]);
  if (!updated) throw new Error(`updateDailyTask: task ${id} not found after update`);
  return updated;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/** Delete a daily task. */
export async function deleteDailyTask(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync(`DELETE FROM daily_tasks WHERE id = ?`, [id]);
}

/** Delete all tasks for a user on a specific date. */
export async function deleteDailyTasksForDate(
  db: SQLiteDatabase,
  userId: number,
  date: string
): Promise<void> {
  await db.runAsync(`DELETE FROM daily_tasks WHERE user_id = ? AND date = ?`, [userId, date]);
}
