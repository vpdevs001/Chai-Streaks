// ─────────────────────────────────────────────────────────────────────────────
//  db/schema.ts  –  Table DDL + migration runner
//  Uses expo-sqlite (SDK 55): SQLiteDatabase from 'expo-sqlite'
// ─────────────────────────────────────────────────────────────────────────────

import { type SQLiteDatabase } from 'expo-sqlite';

// ─── DDL strings ─────────────────────────────────────────────────────────────

const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    avatar_uri  TEXT,
    created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
`;

const CREATE_HABITS_TABLE = `
  CREATE TABLE IF NOT EXISTS habits (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER NOT NULL,
    title             TEXT    NOT NULL,
    description       TEXT,
    icon              TEXT,
    color             TEXT,
    frequency_type    TEXT    NOT NULL DEFAULT 'daily',   -- 'daily' | 'weekly' | 'custom'
    frequency_days    TEXT    NOT NULL DEFAULT '[]',      -- JSON number[]
    target_count      INTEGER NOT NULL DEFAULT 1,
    reminder_status   TEXT    NOT NULL DEFAULT 'disabled',
    reminder_time     TEXT,                               -- 'HH:MM'
    notification_id   TEXT,
    is_archived       INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );
`;

const CREATE_HABIT_HISTORY_TABLE = `
  CREATE TABLE IF NOT EXISTS habit_history (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id         INTEGER NOT NULL,
    user_id          INTEGER NOT NULL,
    date             TEXT    NOT NULL,   -- YYYY-MM-DD
    status           TEXT    NOT NULL,   -- 'completed' | 'skipped' | 'partial'
    completion_count INTEGER NOT NULL DEFAULT 1,
    note             TEXT,
    created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users  (id) ON DELETE CASCADE,
    UNIQUE (habit_id, date)   -- one record per habit per day
  );
`;

// Useful indexes to keep queries fast
const CREATE_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_habits_user_id
    ON habits (user_id);

  CREATE INDEX IF NOT EXISTS idx_history_habit_id
    ON habit_history (habit_id);

  CREATE INDEX IF NOT EXISTS idx_history_user_date
    ON habit_history (user_id, date);

  CREATE INDEX IF NOT EXISTS idx_history_date
    ON habit_history (date);
`;

// Triggers to auto-update updated_at on row change
const CREATE_TRIGGERS = `
  CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
  AFTER UPDATE ON users
  BEGIN
    UPDATE users SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = NEW.id;
  END;

  CREATE TRIGGER IF NOT EXISTS trg_habits_updated_at
  AFTER UPDATE ON habits
  BEGIN
    UPDATE habits SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = NEW.id;
  END;

  CREATE TRIGGER IF NOT EXISTS trg_history_updated_at
  AFTER UPDATE ON habit_history
  BEGIN
    UPDATE habit_history SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = NEW.id;
  END;
`;

// ─── Migrations ───────────────────────────────────────────────────────────────
//  Each migration is a plain function that receives the db instance.
//  To add a new migration: push a new entry to MIGRATIONS (never edit existing ones).
//  The runner stores the applied version in PRAGMA user_version.

type MigrationFn = (db: SQLiteDatabase) => Promise<void>;

const MIGRATIONS: { name: string; run: MigrationFn }[] = [
  {
    name: 'v1_initial_schema',
    run: async (db) => {
      await db.execAsync(`PRAGMA journal_mode = WAL;`);
      await db.execAsync(`PRAGMA foreign_keys = ON;`);
      await db.execAsync(CREATE_USERS_TABLE);
      await db.execAsync(CREATE_HABITS_TABLE);
      await db.execAsync(CREATE_HABIT_HISTORY_TABLE);
      await db.execAsync(CREATE_INDEXES);
      await db.execAsync(CREATE_TRIGGERS);
    }
  },
  {
    name: 'v2_add_habit_priority',
    run: async (db) => {
      // 'low' | 'medium' | 'high' — drives the Chai Score weighting (see
      // utils/chaiScore.ts). Existing habits default to 'medium' so nobody's
      // score jumps around the moment this migration runs.
      await db.execAsync(`ALTER TABLE habits ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium';`);
    }
  }
  // Future migrations go here, e.g.:
  // {
  //   name: 'v3_add_habit_tags',
  //   run: async (db) => {
  //     await db.execAsync(`ALTER TABLE habits ADD COLUMN tags TEXT DEFAULT '[]';`);
  //   },
  // },
];

// ─── Migration runner (used as `onInit` in <SQLiteProvider>) ─────────────────

/**
 * Pass this as the `onInit` prop of `<SQLiteProvider>`.
 *
 * @example
 * <SQLiteProvider databaseName="habittracker.db" onInit={migrateDatabase}>
 *   <App />
 * </SQLiteProvider>
 */
export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  // ✅ Set WAL mode once, standalone, before any transaction
  await db.execAsync('PRAGMA journal_mode = WAL;');

  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;
  const pendingMigrations = MIGRATIONS.slice(currentVersion);

  if (pendingMigrations.length === 0) return;

  for (let i = 0; i < pendingMigrations.length; i++) {
    const migration = pendingMigrations[i];
    const nextVersion = currentVersion + i + 1;

    await db.withExclusiveTransactionAsync(async (txn) => {
      await migration.run(txn as unknown as SQLiteDatabase);
    });

    await db.execAsync(`PRAGMA user_version = ${nextVersion};`);
    console.log(`[DB] Applied migration: ${migration.name} → v${nextVersion}`);
  }
}

// ─── Full data reset ──────────────────────────────────────────────────────────

/**
 * Wipes every row from every table (users, habits, habit_history) while
 * keeping the schema intact. Relies on the ON DELETE CASCADE foreign keys
 * defined in CREATE_HABITS_TABLE / CREATE_HABIT_HISTORY_TABLE, so deleting
 * from `users` is enough to cascade-delete everything else.
 *
 * Note: this only clears SQLite data. Callers are responsible for also
 * clearing the AsyncStorage-backed preferences (active user id, onboarding
 * flag) via db/preferences so the app doesn't think a deleted user is still
 * active.
 */
export async function resetAllData(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync('DELETE FROM users;');
}
