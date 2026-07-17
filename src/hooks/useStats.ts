import { useState, useEffect, useCallback, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getActiveUserId, getAllHabitsHistoryForDate, getActiveHabits, getUserById } from '../db';
import { isReleasedDbError } from '../db/utils';
import { getLast7Days, getLast30Days } from '../utils/dateHelpers';

export interface DayBar {
  date: string;
  count: number; // completed
  skipped: number; // explicitly skipped
  total: number;
}

export function useStats() {
  const db = useSQLiteContext();
  const [bars7, setBars7] = useState<DayBar[]>([]);
  const [bars30, setBars30] = useState<DayBar[]>([]);
  const [loading, setLoading] = useState(true);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (isMounted.current) setLoading(true);
    try {
      const uid = await getActiveUserId();
      if (!uid) return;

      // Get user so we can filter by account creation date
      const user = await getUserById(db, uid);
      const accountCreatedDate = user?.created_at
        ? user.created_at.slice(0, 10) // Extract YYYY-MM-DD
        : '2000-01-01';

      const habits = await getActiveHabits(db, uid);

      const buildBars = async (days: string[]): Promise<DayBar[]> => {
        // Filter out days before account creation
        const filteredDays = days.filter((d) => d >= accountCreatedDate);
        return Promise.all(
          filteredDays.map(async (date) => {
            const hist = await getAllHabitsHistoryForDate(db, uid, date);
            const count = hist.filter((h) => h.status === 'completed').length;
            const skipped = hist.filter((h) => h.status === 'skipped').length;
            // A day recovered with a Chai Scroll ('frozen') isn't a genuine
            // completion, but it shouldn't drag the percentage down as a
            // miss either — exclude it from the denominator entirely, same
            // as it's treated in the per-habit rate calc (habitMethods.ts).
            const frozen = hist.filter((h) => h.status === 'frozen').length;
            // Only count habits that existed on this day — a habit added
            // later shouldn't inflate the denominator for earlier days
            // (and drag down their completion %) before it existed.
            const activeOnDate = habits.filter((h) => h.created_at.slice(0, 10) <= date).length;
            const total = Math.max(0, activeOnDate - frozen);
            return { date, count, skipped, total };
          })
        );
      };

      const [b7, b30] = await Promise.all([buildBars(getLast7Days()), buildBars(getLast30Days())]);
      if (!isMounted.current) return;
      setBars7(b7);
      setBars30(b30);
    } catch (err) {
      if (!isReleasedDbError(err)) throw err;
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    load();
  }, [load]);

  return { bars7, bars30, loading, refresh: load };
}
