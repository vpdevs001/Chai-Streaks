import type { HabitPriority, HabitWithStreak } from '../db/types';

/**
 * Chai Score v2
 * ─────────────
 * The old score was just `streak*2 + completionRate*50 + habitCount*2` —
 * which meant the single fastest way to raise it was to add more habits,
 * regardless of whether you were actually keeping up with them. This
 * version scores each habit on its own consistency, then combines habits
 * with a priority weight, so:
 *
 *  - Adding habits no longer inflates the score by itself.
 *  - Long streaks matter, but with diminishing returns (no single habit
 *    can carry the score forever).
 *  - Completion rate rewards consistency; failure rate (misses + explicit
 *    skips) actively drags the score down — so the score can go up *and*
 *    down day to day, not just accumulate.
 *  - A missed/skipped "high" priority habit hurts more than a "low"
 *    priority one, and a well-kept "high" priority habit helps more too.
 */

export interface ChaiScoreHabitInput {
  /** Current consecutive-day streak for this habit. */
  currentStreak: number;
  /** 0–1, completions over the trailing rate window (see HabitWithStreak). */
  completionRate: number;
  /** 0–1, misses + explicit skips over the same window. */
  failureRate: number;
  priority: HabitPriority;
}

const PRIORITY_WEIGHT: Record<HabitPriority, number> = {
  low: 1,
  medium: 1.6,
  high: 2.4
};

// Diminishing-returns streak curve — asymptotically approaches 1 so a habit
// you've kept for a year doesn't count infinitely more than one at 60 days.
//   3-day streak  → 0.26   7-day  → 0.50   14-day → 0.75   30-day → 0.95
function streakFactor(streak: number): number {
  if (streak <= 0) return 0;
  return 1 - Math.exp(-streak / 10);
}

/** 0–100 score for a single habit, before priority weighting. */
function singleHabitScore(h: ChaiScoreHabitInput): number {
  const streakComponent = streakFactor(h.currentStreak) * 40; // up to 40 pts
  const consistencyComponent = h.completionRate * 45; // up to 45 pts
  const failurePenalty = h.failureRate * 35; // up to -35 pts

  const raw = streakComponent + consistencyComponent - failurePenalty;
  return Math.min(100, Math.max(0, raw));
}

/**
 * Combines every active habit into one 0–100 score, weighted by priority.
 * Empty habit list → 0 (nothing to score yet, not "perfect").
 */
export function computeChaiScore(habits: ChaiScoreHabitInput[]): number {
  if (habits.length === 0) return 0;

  let weightedSum = 0;
  let weightTotal = 0;

  for (const h of habits) {
    const weight = PRIORITY_WEIGHT[h.priority];
    weightedSum += singleHabitScore(h) * weight;
    weightTotal += weight;
  }

  const score = weightTotal > 0 ? weightedSum / weightTotal : 0;
  return Math.round(Math.min(100, Math.max(0, score)));
}

/** Small adapter so screens can pass `habits` straight from useHabits/useStats. */
export function habitsToChaiScoreInputs(habits: HabitWithStreak[]): ChaiScoreHabitInput[] {
  return habits.map((h) => ({
    currentStreak: h.current_streak,
    completionRate: h.completion_rate_30d,
    failureRate: h.failure_rate_30d,
    priority: h.priority
  }));
}

export function chaiScoreLabel(score: number): string {
  if (score >= 80) return 'Master Chai';
  if (score >= 60) return 'Chai Expert';
  if (score >= 40) return 'Chai Learner';
  if (score >= 20) return 'First Sip';
  return 'Just Started';
}

export function chaiScoreEmoji(score: number): string {
  if (score >= 80) return '☕☕☕';
  if (score >= 60) return '☕☕';
  if (score >= 40) return '☕';
  if (score >= 20) return '🍵';
  return '💧';
}
