import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import * as Notifications from 'expo-notifications';
import {
  getHabitsWithStreaks,
  upsertHabitHistory,
  deleteHistoryForDate,
  getHistoryForDate,
  ensureActiveUser,
  getUserById,
  checkAndAwardUserChaiScroll,
  recoverHabitStreak,
  computeAccountStreak,
  evaluateAndAwardBadges,
  getPreference,
  setPreference,
  STORAGE_KEYS,
  reorderHabits as reorderHabitsInDb
} from '../db';
import { isReleasedDbError } from '../db/utils';
import type { HabitWithStreak, HabitHistory, User } from '../db/types';
import { todayString, isHabitDueToday } from '../utils/dateHelpers';

export type HabitStatus = 'completed' | 'skipped' | 'unmarked';

interface HabitsContextValue {
  habits: HabitWithStreak[];
  userId: number | null;
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  reorderHabits: (habitIds: number[]) => Promise<void>;
  toggleHabit: (habitId: number, targetStatus?: 'completed' | 'skipped') => Promise<void>;
  getHabitStatus: (habitId: number) => HabitStatus;
  isCompleted: (habitId: number) => boolean;
  completedCount: number;
  completionRate: number;
  chaiScrolls: number;
  scrollsAwarded: number;
  clearScrollsAwarded: () => void;
  recoverStreak: (habitId: number) => Promise<void>;
  /** Account-level streak: consecutive days with ≥1 habit completed. */
  accountStreak: number;
  accountLongestStreak: number;
  /** Habits that were due yesterday but have no history entry. */
  missedYesterdayHabits: HabitWithStreak[];
  /** IDs of missed habits already marked by the user in this session. */
  markedMissedIds: Set<number>;
  /** Whether the missed-habit dialog should be shown. */
  showMissedDialog: boolean;
  dismissMissedDialog: () => void;
  markMissedHabit: (habitId: number, status: 'completed' | 'skipped') => Promise<void>;
}

const HabitsContext = createContext<HabitsContextValue | null>(null);

/**
 * Owns ALL habit/today's-history state for the whole app, including the one
 * and only `Notifications.setBadgeCountAsync` side effect.
 *
 * This used to live in a plain `useHabits()` hook that every screen called
 * independently. That meant every screen (Home *and* Progress) instantiated
 * its own copy of `habits`/`todayHistory`, each with its own badge-setting
 * `useEffect`. Those two copies loaded asynchronously and re-rendered on
 * their own schedules, so whichever instance's effect happened to fire last
 * (e.g. right after switching tabs, while the *other* screen's fetch was
 * still mid-flight with a stale/partial `todayHistory`) would silently
 * overwrite the OS badge with a wrong number — which is exactly how the
 * badge could get stuck on "1" even though every habit on screen was
 * already marked. Provisioning this state once, here, and having every
 * screen read the *same* instance via `useHabits()` below removes that
 * duplicate-effect race entirely: there is now only one place that ever
 * calls `setBadgeCountAsync`, and it always reflects the latest data.
 */
export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [todayHistory, setTodayHistory] = useState<Record<number, HabitHistory>>({});
  const [userId, setUserId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Set right after toggleHabit mints new Chai Scroll(s), so the UI can
  // show a one-off celebration. Callers should clear it once shown.
  const [scrollsAwarded, setScrollsAwarded] = useState(0);
  const [accountStreak, setAccountStreak] = useState(0);
  const [accountLongestStreak, setAccountLongestStreak] = useState(0);
  const [missedYesterdayHabits, setMissedYesterdayHabits] = useState<HabitWithStreak[]>([]);
  const [markedMissedIds, setMarkedMissedIds] = useState<Set<number>>(new Set());
  const [showMissedDialog, setShowMissedDialog] = useState(false);

  // Guards against setState after unmount, and lets us tell whether a
  // "database already released" error (see db/utils.ts) happened after
  // this provider went away — in which case it's safe to just ignore it,
  // since nothing is listening for the result anymore.
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (isMounted.current && habits.length === 0) setLoading(true);
    try {
      const uid = await ensureActiveUser(db);
      if (!isMounted.current) return;
      setUserId(uid);

      const u = await getUserById(db, uid);
      if (!isMounted.current) return;
      setUser(u);

      const h = await getHabitsWithStreaks(db, uid);
      if (!isMounted.current) return;

      // Load today's history for each habit BEFORE setting either habits or
      // todayHistory state. This prevents an intermediate render where habits
      // is fresh but todayHistory is stale, which caused the badge effect to
      // fire with a wrong pendingCount (e.g. 1 when it should be 0).
      const today = todayString();
      const histMap: Record<number, HabitHistory> = {};
      await Promise.all(
        h.map(async (habit) => {
          const hist = await getHistoryForDate(db, habit.id, today);
          if (hist) histMap[habit.id] = hist;
        })
      );
      if (!isMounted.current) return;

      // Batch both updates so they trigger a single render with consistent
      // data — the badge effect now always sees matching habits + todayHistory.
      setHabits(h);
      setTodayHistory(histMap);

      // Compute account-level streak
      const streak = await computeAccountStreak(db, uid);
      if (!isMounted.current) return;
      setAccountStreak(streak.currentStreak);
      setAccountLongestStreak(streak.longestStreak);

      // Check for missed habits from yesterday (only on first open of the day)
      const lastOpened = await getPreference(STORAGE_KEYS.LAST_OPENED_DATE);
      const todayStr = todayString();
      if (lastOpened !== todayStr) {
        // Find habits due yesterday that have no history entry
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        const missed: HabitWithStreak[] = [];
        for (const habit of h) {
          // Only check habits that existed yesterday
          if (habit.created_at.slice(0, 10) > yesterdayStr) continue;
          // Only check habits due yesterday
          if (!isHabitDueToday(habit, yesterday)) continue;
          // Check if there's any history for yesterday
          const hist = await getHistoryForDate(db, habit.id, yesterdayStr);
          if (!hist) {
            missed.push(habit);
          }
        }

        if (!isMounted.current) return;
        setMissedYesterdayHabits(missed);
        setMarkedMissedIds(new Set());
        if (missed.length > 0) {
          setShowMissedDialog(true);
        }

        // Update last opened date
        await setPreference(STORAGE_KEYS.LAST_OPENED_DATE, todayStr);
      }

      // Evaluate badges in the background
      evaluateAndAwardBadges(db, uid).catch(() => {});
    } catch (err) {
      // The native db connection can momentarily be torn down/reopened
      // (Fast Refresh, or a fast navigation transition) while a query is
      // still in flight. In that case just skip this refresh — the next
      // effect run / focus event will retry against the live connection.
      if (!isReleasedDbError(err)) throw err;
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Toggle a habit to a specific status.
   * - If habit currently has the same status → remove (unmark).
   * - Otherwise → set to the given status.
   */
  const toggleHabit = useCallback(
    async (habitId: number, targetStatus: 'completed' | 'skipped' = 'completed') => {
      if (!userId) return;
      try {
        const today = todayString();
        const existing = todayHistory[habitId];

        if (existing && existing.status === targetStatus) {
          // Same status tapped again → unmark
          await deleteHistoryForDate(db, habitId, today);
          if (!isMounted.current) return;
          setTodayHistory((prev) => {
            const next = { ...prev };
            delete next[habitId];
            return next;
          });
        } else {
          // Set new status (completed or skipped)
          const hist = await upsertHabitHistory(db, {
            habit_id: habitId,
            user_id: userId,
            date: today,
            status: targetStatus,
            completion_count: targetStatus === 'completed' ? 1 : 0
          });
          if (!isMounted.current) return;
          setTodayHistory((prev) => ({ ...prev, [habitId]: hist }));
        }

        // refresh streaks
        const updated = await getHabitsWithStreaks(db, userId);
        if (!isMounted.current) return;
        setHabits(updated);

        // Recompute account streak immediately so the UI updates live
        const streak = await computeAccountStreak(db, userId);
        if (!isMounted.current) return;
        setAccountStreak(streak.currentStreak);
        setAccountLongestStreak(streak.longestStreak);

        // Check if a new 7-day block (anchored to account creation) has just
        // elapsed with a >= 60% completion rate, earning a Chai Scroll
        const awarded = await checkAndAwardUserChaiScroll(db, userId);
        if (awarded > 0) {
          if (!isMounted.current) return;
          setScrollsAwarded((prev) => prev + awarded);
          const freshUser = await getUserById(db, userId);
          if (!isMounted.current) return;
          setUser(freshUser);
        }
      } catch (err) {
        if (!isReleasedDbError(err)) throw err;
      }
    },
    [db, userId, todayHistory]
  );

  /**
   * Spend one Chai Scroll to recover a habit's `recoverableDate` (see
   * getHabitsWithStreaks) — freezes that gap so the streak survives it.
   */
  const recoverStreak = useCallback(
    async (habitId: number) => {
      if (!userId) return;
      const habit = habits.find((h) => h.id === habitId);
      if (!habit?.recoverableDate) return;
      try {
        await recoverHabitStreak(db, habitId, userId, habit.recoverableDate);
        const [updated, freshUser] = await Promise.all([
          getHabitsWithStreaks(db, userId),
          getUserById(db, userId)
        ]);
        if (!isMounted.current) return;
        setHabits(updated);
        setUser(freshUser);
      } catch (err) {
        if (!isReleasedDbError(err)) throw err;
      }
    },
    [db, userId, habits]
  );

  /**
   * Mark a missed habit from yesterday as completed or skipped.
   */
  const markMissedHabit = useCallback(
    async (habitId: number, status: 'completed' | 'skipped') => {
      if (!userId) return;
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        await upsertHabitHistory(db, {
          habit_id: habitId,
          user_id: userId,
          date: yesterdayStr,
          status,
          completion_count: status === 'completed' ? 1 : 0
        });

        // Mark as handled in the UI — keep the habit in the list (so the
        // layout doesn't shift and cause mis-taps during rapid marking)
        // but track it as "done" via markedMissedIds.
        if (!isMounted.current) return;
        setMarkedMissedIds((prev) => {
          const next = new Set(prev);
          next.add(habitId);
          return next;
        });

        // Refresh streaks
        const updated = await getHabitsWithStreaks(db, userId);
        if (!isMounted.current) return;
        setHabits(updated);

        // Recompute account streak
        const streak = await computeAccountStreak(db, userId);
        if (!isMounted.current) return;
        setAccountStreak(streak.currentStreak);
        setAccountLongestStreak(streak.longestStreak);
      } catch (err) {
        if (!isReleasedDbError(err)) throw err;
      }
    },
    [db, userId]
  );

  const dismissMissedDialog = useCallback(() => {
    setShowMissedDialog(false);
  }, []);

  const getHabitStatus = useCallback(
    (habitId: number): HabitStatus => {
      const h = todayHistory[habitId];
      if (!h) return 'unmarked';
      return h.status as HabitStatus;
    },
    [todayHistory]
  );

  const isCompleted = useCallback(
    (habitId: number) => todayHistory[habitId]?.status === 'completed',
    [todayHistory]
  );

  const completedCount = Object.values(todayHistory).filter((h) => h.status === 'completed').length;
  const completionRate = habits.length > 0 ? completedCount / habits.length : 0;

  // Only habits actually scheduled for today count toward the badge, and a
  // habit counts as "handled" the moment it has ANY status recorded for
  // today — completed *or* skipped/failed — not just completed. That's the
  // distinction between "done for today" (badge-relevant) and "completed"
  // (a separate, stricter stat shown elsewhere in the UI).
  const dueTodayHabits = habits.filter((h) => isHabitDueToday(h));
  const dueTodayMarkedCount = dueTodayHabits.filter((h) => !!todayHistory[h.id]).length;
  const pendingCount = Math.max(0, dueTodayHabits.length - dueTodayMarkedCount);

  // This is the ONLY place in the app that touches the OS badge. Because
  // HabitsProvider is mounted exactly once (in the root layout), there's no
  // other instance around to race with and stomp this value.
  //
  // We use a stable string key derived from the actual pending state so the
  // effect fires reliably whenever the count changes, regardless of array
  // reference identity.
  const badgeKey = `${userId}:${pendingCount}`;
  useEffect(() => {
    if (!userId) return;
    Notifications.setBadgeCountAsync(pendingCount).catch(() => {});
    if (pendingCount === 0) {
      // dismissAllNotificationsAsync clears anything sitting in the system
      // notification tray. On several Android launchers (Samsung One UI,
      // MIUI, etc.) the home-screen badge is driven by the actual tray
      // notification count rather than by setBadgeCountAsync, so a stray
      // already-delivered reminder notification can keep the badge showing
      // even after setBadgeCountAsync(0) — clearing the tray is what
      // actually resets it on those devices.
      Notifications.dismissAllNotificationsAsync().catch(() => {});
    }
  }, [badgeKey, pendingCount, userId]);

  const reorderHabits = useCallback(
    async (habitIds: number[]) => {
      // Optimistically update habits state in memory
      setHabits((prev) => {
        const habitMap = new Map(prev.map((h) => [h.id, h]));
        const reordered: HabitWithStreak[] = [];
        for (let i = 0; i < habitIds.length; i++) {
          const h = habitMap.get(habitIds[i]);
          if (h) {
            reordered.push({ ...h, sort_order: i });
          }
        }
        for (const h of prev) {
          if (!habitIds.includes(h.id)) {
            reordered.push(h);
          }
        }
        return reordered;
      });

      try {
        await reorderHabitsInDb(db, habitIds);
      } catch (err) {
        if (!isReleasedDbError(err)) throw err;
      }
    },
    [db]
  );

  // Auto-close the missed dialog once every missed habit has been marked.
  // This runs as a derived effect rather than inside markMissedHabit so it
  // reacts to the final committed state (no stale-closure issues).
  useEffect(() => {
    if (
      showMissedDialog &&
      missedYesterdayHabits.length > 0 &&
      missedYesterdayHabits.every((h) => markedMissedIds.has(h.id))
    ) {
      setShowMissedDialog(false);
    }
  }, [showMissedDialog, missedYesterdayHabits, markedMissedIds]);

  const value: HabitsContextValue = {
    habits,
    userId,
    user,
    loading,
    refresh,
    reorderHabits,
    toggleHabit,
    getHabitStatus,
    isCompleted,
    completedCount,
    completionRate,
    chaiScrolls: user?.chai_scrolls ?? 0,
    scrollsAwarded,
    clearScrollsAwarded: () => setScrollsAwarded(0),
    recoverStreak,
    accountStreak,
    accountLongestStreak,
    missedYesterdayHabits,
    markedMissedIds,
    showMissedDialog,
    dismissMissedDialog,
    markMissedHabit
  };

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

/**
 * Read the shared habits state. Must be called from within <HabitsProvider>
 * (mounted once in the root layout) — every screen that calls this gets the
 * SAME state, not a fresh independent copy.
 */
export function useHabits(): HabitsContextValue {
  const ctx = useContext(HabitsContext);
  if (!ctx) {
    throw new Error('useHabits() must be called within a <HabitsProvider>');
  }
  return ctx;
}
