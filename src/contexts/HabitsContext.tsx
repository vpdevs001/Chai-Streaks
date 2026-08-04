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
  recoverHabitStreak
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
  toggleHabit: (habitId: number, targetStatus?: 'completed' | 'skipped') => Promise<void>;
  getHabitStatus: (habitId: number) => HabitStatus;
  isCompleted: (habitId: number) => boolean;
  completedCount: number;
  completionRate: number;
  chaiScrolls: number;
  scrollsAwarded: number;
  clearScrollsAwarded: () => void;
  recoverStreak: (habitId: number) => Promise<void>;
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
    if (isMounted.current) setLoading(true);
    try {
      const uid = await ensureActiveUser(db);
      if (!isMounted.current) return;
      setUserId(uid);

      const u = await getUserById(db, uid);
      if (!isMounted.current) return;
      setUser(u);

      const h = await getHabitsWithStreaks(db, uid);
      if (!isMounted.current) return;
      setHabits(h);

      // load today's history for each habit
      const today = todayString();
      const histMap: Record<number, HabitHistory> = {};
      await Promise.all(
        h.map(async (habit) => {
          const hist = await getHistoryForDate(db, habit.id, today);
          if (hist) histMap[habit.id] = hist;
        })
      );
      if (!isMounted.current) return;
      setTodayHistory(histMap);
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
  }, [dueTodayHabits.length, pendingCount, userId]);

  const value: HabitsContextValue = {
    habits,
    userId,
    user,
    loading,
    refresh,
    toggleHabit,
    getHabitStatus,
    isCompleted,
    completedCount,
    completionRate,
    chaiScrolls: user?.chai_scrolls ?? 0,
    scrollsAwarded,
    clearScrollsAwarded: () => setScrollsAwarded(0),
    recoverStreak
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
