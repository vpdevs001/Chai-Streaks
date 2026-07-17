// ─────────────────────────────────────────────
//  db/types.ts  –  Shared TypeScript interfaces
// ─────────────────────────────────────────────

// ── User ─────────────────────────────────────

export interface User {
  id: number;
  name: string;
  avatar_uri: string | null; // local file URI for profile picture
  created_at: string; // ISO-8601
  updated_at: string;
}

export type CreateUserInput = Pick<User, 'name'> & Partial<Pick<User, 'avatar_uri'>>;
export type UpdateUserInput = Partial<Pick<User, 'name' | 'avatar_uri'>>;

// ── Habit ────────────────────────────────────

export type FrequencyType = 'daily' | 'weekly' | 'custom';
export type ReminderStatus = 'enabled' | 'disabled';
export type HabitPriority = 'low' | 'medium' | 'high';

export interface Habit {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  icon: string | null; // emoji or icon name
  color: string | null; // hex color string, e.g. "#4CAF50"
  frequency_type: FrequencyType;
  /** JSON-encoded number[]. For 'daily' → []. For 'weekly' → [0–6]. For 'custom' → day indices */
  frequency_days: string;
  /** Target completions per frequency period (default 1) */
  target_count: number;
  /** How much this habit should weigh in the Chai Score. Defaults to 'medium'. */
  priority: HabitPriority;
  reminder_status: ReminderStatus;
  /** HH:MM string, e.g. "08:30". Null when reminder disabled. */
  reminder_time: string | null;
  /** expo-notifications identifier, stored so we can cancel it later */
  notification_id: string | null;
  is_archived: number; // SQLite has no BOOLEAN; 0 = false, 1 = true
  created_at: string;
  updated_at: string;
}

export type CreateHabitInput = Pick<
  Habit,
  'title' | 'frequency_type' | 'frequency_days' | 'target_count'
> &
  Partial<
    Pick<
      Habit,
      | 'description'
      | 'icon'
      | 'color'
      | 'priority'
      | 'reminder_status'
      | 'reminder_time'
      | 'notification_id'
    >
  > & { user_id: number };

export type UpdateHabitInput = Partial<
  Pick<
    Habit,
    | 'title'
    | 'description'
    | 'icon'
    | 'color'
    | 'frequency_type'
    | 'frequency_days'
    | 'target_count'
    | 'priority'
    | 'reminder_status'
    | 'reminder_time'
    | 'notification_id'
    | 'is_archived'
  >
>;

// ── History ──────────────────────────────────

export type CompletionStatus = 'completed' | 'skipped' | 'partial';

export interface HabitHistory {
  id: number;
  habit_id: number;
  user_id: number;
  /** YYYY-MM-DD */
  date: string;
  status: CompletionStatus;
  /** How many times completed within the period (for target_count > 1 habits) */
  completion_count: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateHistoryInput = Pick<HabitHistory, 'habit_id' | 'user_id' | 'date' | 'status'> &
  Partial<Pick<HabitHistory, 'completion_count' | 'note'>>;

export type UpdateHistoryInput = Partial<
  Pick<HabitHistory, 'status' | 'completion_count' | 'note'>
>;

// ── Aggregates (for UI) ───────────────────────

export interface HabitWithStreak extends Habit {
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  /**
   * Completion / failure rate over a trailing window (min(30 days, days
   * since the habit was created)) — never judged against days before the
   * habit existed. "Failure" = explicitly skipped OR left unmarked on a day
   * that has fully elapsed. Today is only counted once it has a logged
   * outcome (completed/skipped) — an unmarked "today" is still pending, not
   * a miss, so completion_rate_30d + failure_rate_30d === 1 except for a
   * brand-new habit with no elapsed days and nothing logged yet today,
   * where both are 0. Powers the Chai Score (utils/chaiScore.ts).
   */
  completion_rate_30d: number;
  failure_rate_30d: number;
}

export interface WeeklySummary {
  week_start: string; // YYYY-MM-DD (Monday)
  week_end: string; // YYYY-MM-DD (Sunday)
  habit_id: number;
  completed_days: number;
  target_days: number;
  completion_rate: number; // 0–1
}

export interface MonthlySummary {
  year: number;
  month: number; // 1–12
  habit_id: number;
  completed_days: number;
  total_days_in_month: number;
  completion_rate: number;
}

// ── AsyncStorage keys (re-exported for convenience) ──

export const STORAGE_KEYS = {
  HAS_ONBOARDED: '@habit_tracker/has_onboarded',
  ACTIVE_USER_ID: '@habit_tracker/active_user_id',
  THEME: '@habit_tracker/theme',
  NOTIFICATION_PERMISSION: '@habit_tracker/notification_permission'
} as const;
