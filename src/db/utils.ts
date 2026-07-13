// ─────────────────────────────────────────────────────────────────────────────
//  db/utils.ts  –  Shared helpers used across all CRUD modules
// ─────────────────────────────────────────────────────────────────────────────

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns today's date as YYYY-MM-DD in local time */
export function todayDateString(): string {
  return toDateString(new Date());
}

/** Converts a Date to YYYY-MM-DD (local time) */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns the Monday of the week containing `date` */
export function weekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns the Sunday of the week containing `date` */
export function weekEnd(date: Date): Date {
  const start = weekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

/** Returns the number of days in a given month (1-indexed month) */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// ─── Native SQLite lifecycle helpers ─────────────────────────────────────────

/**
 * True if an error came from calling a query against a NativeDatabase that
 * has already been released/closed (e.g. expo-sqlite's SQLiteProvider
 * re-establishing its connection while an older query was still in flight —
 * see https://github.com/expo/expo/issues/37169). This can happen during
 * Fast Refresh in development, or briefly during navigation transitions.
 *
 * Screens/hooks can catch this specific error and just skip the update
 * instead of crashing, since a fresh refresh will follow shortly after.
 */
export function isReleasedDbError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /already released|shared object/i.test(message);
}

// ─── SQL helpers ──────────────────────────────────────────────────────────────

// Mirrors expo-sqlite's SQLiteBindValue: the only primitives SQLite accepts.
export type SQLiteBindValue = string | number | null | boolean | Uint8Array;

/**
 * Build a SET clause and bound values for UPDATE statements.
 * Callers must ensure all values are already serialised to SQLiteBindValue
 * (e.g. JSON.stringify arrays before passing them in).
 *
 * @example
 * const { clause, values } = buildSetClause({ name: 'Alice', avatar_uri: null });
 * // clause  → 'name = ?, avatar_uri = ?'
 * // values  → ['Alice', null]
 */
export function buildSetClause(fields: Record<string, SQLiteBindValue | undefined>): {
  clause: string;
  values: SQLiteBindValue[];
} {
  const entries = (Object.entries(fields) as [string, SQLiteBindValue | undefined][]).filter(
    ([, v]) => v !== undefined
  ) as [string, SQLiteBindValue][];

  if (entries.length === 0) throw new Error('buildSetClause: no fields to update');
  const clause = entries.map(([k]) => `${k} = ?`).join(', ');
  const values: SQLiteBindValue[] = entries.map(([, v]) => v);
  return { clause, values };
}

// ─── Streak calculator ────────────────────────────────────────────────────────

/**
 * Given a sorted (ascending) array of YYYY-MM-DD completion date strings,
 * compute the current streak (from today backwards) and longest streak.
 */
export function computeStreaks(completedDates: string[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (completedDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const today = todayDateString();
  const dateSet = new Set(completedDates);
  const sorted = [...completedDates].sort(); // ascending

  // ── longest streak (scan forward) ───────────────────────────────────────
  let longestStreak = 1;
  let runLength = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      runLength++;
      if (runLength > longestStreak) longestStreak = runLength;
    } else {
      runLength = 1;
    }
  }

  // ── current streak (scan backward from today) ────────────────────────────
  let currentStreak = 0;
  const cursor = new Date(today);

  while (dateSet.has(toDateString(cursor))) {
    currentStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { currentStreak, longestStreak };
}

// ─── Notification time helpers ────────────────────────────────────────────────

/**
 * Parse a "HH:MM" reminder time string into { hour, minute }.
 * Returns null for invalid / missing values.
 */
export function parseReminderTime(
  time: string | null | undefined
): { hour: number; minute: number } | null {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { hour: h, minute: m };
}

/** Format { hour, minute } back to "HH:MM" */
export function formatReminderTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
