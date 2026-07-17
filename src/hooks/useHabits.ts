import { useState, useEffect, useCallback, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import * as Notifications from 'expo-notifications';
import {
  getHabitsWithStreaks,
  upsertHabitHistory,
  deleteHistoryForDate,
  getHistoryForDate,
  ensureActiveUser,
  getUserById,
  maybeAwardChaiScroll,
  recoverHabitStreak
} from '../db';
import { isReleasedDbError } from '../db/utils';
import type { HabitWithStreak, HabitHistory, User } from '../db/types';
import { todayString } from '../utils/dateHelpers';

export type HabitStatus = 'completed' | 'skipped' | 'unmarked';

export function useHabits() {
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
  // this screen went away — in which case it's safe to just ignore it,
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

        // A completion (not a skip, and not an unmark) may have just pushed
        // this habit's streak past a new 7-day milestone — mint the scroll(s)
        // and refresh the user so the new balance shows up immediately.
        const wasCompletion = !(existing && existing.status === targetStatus);
        if (wasCompletion && targetStatus === 'completed') {
          const habitNow = updated.find((h) => h.id === habitId);
          if (habitNow) {
            const awarded = await maybeAwardChaiScroll(
              db,
              habitId,
              userId,
              habitNow.current_streak
            );
            if (awarded > 0) {
              if (!isMounted.current) return;
              setScrollsAwarded((prev) => prev + awarded);
              const freshUser = await getUserById(db, userId);
              if (!isMounted.current) return;
              setUser(freshUser);
            }
          }
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

  useEffect(() => {
    if (!userId) return;
    const pendingCount = habits.length > 0 ? habits.length - completedCount : 0;
    Notifications.setBadgeCountAsync(pendingCount).catch(() => {});
  }, [habits.length, completedCount, userId]);

  return {
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
}
