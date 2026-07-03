import { useState, useEffect, useCallback, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import {
  getHabitsWithStreaks,
  markHabitCompleted,
  deleteHistoryForDate,
  getHistoryForDate,
  ensureActiveUser
} from '../db';
import { isReleasedDbError } from '../db/utils';
import type { HabitWithStreak, HabitHistory } from '../db/types';
import { todayString } from '../utils/dateHelpers';

export function useHabits() {
  const db = useSQLiteContext();
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [todayHistory, setTodayHistory] = useState<Record<number, HabitHistory>>({});
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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

  const toggleHabit = useCallback(
    async (habitId: number) => {
      if (!userId) return;
      try {
        const today = todayString();
        const existing = todayHistory[habitId];
        if (existing && existing.status === 'completed') {
          // un-complete
          await deleteHistoryForDate(db, habitId, today);
          if (!isMounted.current) return;
          setTodayHistory((prev) => {
            const next = { ...prev };
            delete next[habitId];
            return next;
          });
        } else {
          const hist = await markHabitCompleted(db, habitId, userId);
          if (!isMounted.current) return;
          setTodayHistory((prev) => ({ ...prev, [habitId]: hist }));
        }
        // refresh streaks
        const updated = await getHabitsWithStreaks(db, userId);
        if (!isMounted.current) return;
        setHabits(updated);
      } catch (err) {
        if (!isReleasedDbError(err)) throw err;
      }
    },
    [db, userId, todayHistory]
  );

  const isCompleted = useCallback(
    (habitId: number) => todayHistory[habitId]?.status === 'completed',
    [todayHistory]
  );

  const completedCount = Object.values(todayHistory).filter((h) => h.status === 'completed').length;
  const completionRate = habits.length > 0 ? completedCount / habits.length : 0;

  return {
    habits,
    userId,
    loading,
    refresh,
    toggleHabit,
    isCompleted,
    completedCount,
    completionRate
  };
}
