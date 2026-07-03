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
export {
  createUser,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
  ensureActiveUser
} from './userMethods';

// Habit CRUD
export {
  createHabit,
  getHabitById,
  getActiveHabits,
  getArchivedHabits,
  getHabitsWithStreaks,
  getHabitsWithReminders,
  updateHabit,
  archiveHabit,
  unarchiveHabit,
  setHabitNotificationId,
  deleteHabit
} from './habitMethods';

// History CRUD + summaries
export {
  upsertHabitHistory,
  markHabitCompleted,
  getHistoryById,
  getHistoryForDate,
  getHistoryRange,
  getAllHabitsHistoryForDate,
  getRecentHistory,
  updateHistory,
  deleteHistoryById,
  deleteHistoryForDate,
  getWeeklySummary,
  getMonthlySummary,
  getHabitCalendarData
} from './historyMethods';

// Preferences (AsyncStorage)
export {
  hasOnboarded,
  setOnboarded,
  resetOnboarding,
  setActiveUserId,
  getActiveUserId,
  clearActiveUserId,
  getTheme,
  setTheme,
  getNotificationPermission,
  setNotificationPermission,
  getPreference,
  setPreference,
  removePreference
} from './preferences';
