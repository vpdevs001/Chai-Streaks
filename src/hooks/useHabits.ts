// `useHabits` now lives in `HabitsContext` so its state (and, critically,
// its single `setBadgeCountAsync` side effect) is shared across the whole
// app instead of being duplicated per-screen. Re-exported here so existing
// `import { useHabits } from '../../hooks/useHabits'` call sites keep working
// unchanged.
export { useHabits, type HabitStatus } from '../contexts/HabitsContext';
