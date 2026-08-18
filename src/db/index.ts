// ─────────────────────────────────────────────────────────────────────────────
//  db/index.ts  –  Single import point for the entire database layer
//
//  Usage:
//    import { migrateDatabase, createHabit, getWeeklySummary, hasOnboarded } from '@/db';
// ─────────────────────────────────────────────────────────────────────────────

// Schema / migration
export { migrateDatabase, resetAllData } from './schema';

// Types & constants
export * from './types';

// Utilities
export * from './utils';

// User CRUD
export { createUser, ensureActiveUser, getUserById, updateUser } from './userMethods';

// Habit CRUD
export {
  archiveHabit,
  createHabit,
  deleteHabit,
  getActiveHabits,
  getHabitById,
  getHabitsWithReminders,
  getHabitsWithStreaks,
  reorderHabits,
  setHabitNotificationId,
  updateHabit
} from './habitMethods';

// History CRUD + summaries
export {
  deleteHistoryForDate,
  getAllHabitsHistoryForDate,
  getHabitCalendarData,
  getHistoryForDate,
  getWeeklySummary,
  markHabitCompleted,
  upsertHabitHistory
} from './historyMethods';

// Chai Scrolls (streak-recovery currency)
export {
  checkAndAwardUserChaiScroll,
  maybeAwardChaiScroll,
  recoverHabitStreak
} from './scrollMethods';

// Badges
export {
  BADGE_DEFINITIONS,
  computeAccountStreak,
  evaluateAndAwardBadges,
  getUnseenBadgeCount,
  getUserBadges,
  markBadgesSeen,
  type BadgeDefinition
} from './badgeMethods';

// Time tracking
export {
  deleteTimeEntry,
  getDailyTimeTotals,
  getRecentTimeEntries,
  getRunningTimeEntry,
  getTimeEntriesForDate,
  getTimeEntriesInRange,
  startTimeEntry,
  stopTimeEntry,
  updateTimeEntry
} from './timeMethods';

// Preferences (AsyncStorage)
export {
  clearActiveUserId,
  getActiveUserId,
  getNotificationPermission,
  getPreference,
  getTheme,
  hasOnboarded,
  removePreference,
  resetOnboarding,
  setActiveUserId,
  setNotificationPermission,
  setOnboarded,
  setPreference,
  setTheme
} from './preferences';
