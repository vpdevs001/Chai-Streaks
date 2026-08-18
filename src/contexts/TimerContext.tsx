import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { AppState, type AppStateStatus } from 'react-native';
import {
  startTimeEntry,
  stopTimeEntry,
  getRunningTimeEntry,
  getRecentTimeEntries,
  deleteTimeEntry
} from '../db';
import { isReleasedDbError } from '../db/utils';
import type { TimeEntry } from '../db/types';

interface TimerContextValue {
  /** The currently running time entry, if any. */
  runningEntry: TimeEntry | null;
  /** Elapsed seconds for the running entry (updates every second). */
  elapsedSeconds: number;
  /** Recent completed time entries. */
  recentEntries: TimeEntry[];
  /** Start a new timer. */
  startTimer: (userId: number, taskName: string, habitId?: number) => Promise<void>;
  /** Stop the currently running timer. */
  stopTimer: () => Promise<void>;
  /** Delete a time entry. */
  removeEntry: (entryId: number) => Promise<void>;
  /** Refresh the recent entries list. */
  refreshEntries: (userId: number) => Promise<void>;
  /** Whether the timer is currently running. */
  isRunning: boolean;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [runningEntry, setRunningEntry] = useState<TimeEntry | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Tick every second while a timer is running
  useEffect(() => {
    if (runningEntry) {
      const startMs = new Date(runningEntry.start_time).getTime();
      const update = () => {
        if (!isMounted.current) return;
        setElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));
      };
      update();
      intervalRef.current = setInterval(update, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      setElapsedSeconds(0);
    }
  }, [runningEntry]);

  // Check for a running timer when app comes to foreground
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active' && runningEntry) {
        // Recalculate elapsed time from the stored start_time
        const startMs = new Date(runningEntry.start_time).getTime();
        setElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [runningEntry]);

  const startTimer = useCallback(
    async (userId: number, taskName: string, habitId?: number) => {
      try {
        // Stop any existing running timer first
        const existing = await getRunningTimeEntry(db, userId);
        if (existing) {
          await stopTimeEntry(db, existing.id);
        }

        const entry = await startTimeEntry(db, {
          user_id: userId,
          task_name: taskName,
          habit_id: habitId ?? null,
          start_time: new Date().toISOString()
        });
        if (!isMounted.current) return;
        setRunningEntry(entry);
      } catch (err) {
        if (!isReleasedDbError(err)) throw err;
      }
    },
    [db]
  );

  const stopTimer = useCallback(async () => {
    if (!runningEntry) return;
    try {
      await stopTimeEntry(db, runningEntry.id);
      if (!isMounted.current) return;
      setRunningEntry(null);
      setElapsedSeconds(0);
    } catch (err) {
      if (!isReleasedDbError(err)) throw err;
    }
  }, [db, runningEntry]);

  const removeEntry = useCallback(
    async (entryId: number) => {
      try {
        await deleteTimeEntry(db, entryId);
        if (!isMounted.current) return;
        setRecentEntries((prev) => prev.filter((e) => e.id !== entryId));
      } catch (err) {
        if (!isReleasedDbError(err)) throw err;
      }
    },
    [db]
  );

  const refreshEntries = useCallback(
    async (userId: number) => {
      try {
        // Check for running entry
        const running = await getRunningTimeEntry(db, userId);
        if (!isMounted.current) return;
        setRunningEntry(running);

        // Load recent entries
        const entries = await getRecentTimeEntries(db, userId, 50);
        if (!isMounted.current) return;
        setRecentEntries(entries);
      } catch (err) {
        if (!isReleasedDbError(err)) throw err;
      }
    },
    [db]
  );

  const value: TimerContextValue = {
    runningEntry,
    elapsedSeconds,
    recentEntries,
    startTimer,
    stopTimer,
    removeEntry,
    refreshEntries,
    isRunning: !!runningEntry
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) {
    throw new Error('useTimer() must be called within a <TimerProvider>');
  }
  return ctx;
}
