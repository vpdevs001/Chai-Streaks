import type { HabitPriority, HabitWithStreak } from '../db/types';

/**
 * Chai Score v3
 * ─────────────
 * Scoring philosophy:
 *  • Completions earn points  (+ve signal).
 *  • Failures (explicit skips) lose points  (-ve signal).
 *  • Missed days are *neutral* — they don't help but don't hurt either.
 *    This prevents the score cratering just because a habit wasn't yet
 *    created, or the user hadn't onboarded.
 *  • Streaks add a bonus with diminishing returns so a single long-running
 *    habit can't carry the entire score forever.
 *  • Priority weight scales both reward and penalty — neglecting a high-
 *    priority habit hurts more; keeping it up helps more.
 */

export interface ChaiScoreHabitInput {
  /** Current consecutive-day streak for this habit. */
  currentStreak: number;
  /** 0–1  completions / (completions + skipped + missed) over trailing 30 d. */
  completionRate: number;
  /** 0–1  explicit skips / (completions + skipped + missed) over trailing 30 d. */
  failureRate: number;
  priority: HabitPriority;
}

const PRIORITY_WEIGHT: Record<HabitPriority, number> = {
  low: 1,
  medium: 1.6,
  high: 2.4
};

/**
 * Diminishing-returns streak bonus.
 * 3 d → 0.26 | 7 d → 0.50 | 14 d → 0.75 | 30 d → 0.95
 */
function streakBonus(streak: number): number {
  if (streak <= 0) return 0;
  return 1 - Math.exp(-streak / 10);
}

/**
 * 0–100 score for a single habit, before priority weighting.
 *
 * Breakdown (max possible = 100):
 *   completionScore  up to 50 pts  (+ve signal: completions)
 *   streakBonus      up to 30 pts  (momentum reward)
 *   failurePenalty   up to -40 pts (-ve signal: skips only)
 *   Missed days contribute 0 — they are neutral.
 */
function singleHabitScore(h: ChaiScoreHabitInput): number {
  const completionScore = h.completionRate * 50;   // 0–50
  const streakScore     = streakBonus(h.currentStreak) * 30; // 0–30
  const failurePenalty  = h.failureRate * 40;       // 0–40

  const raw = completionScore + streakScore - failurePenalty;
  return Math.min(100, Math.max(0, raw));
}

/**
 * Combines every active habit into one 0–100 score, weighted by priority.
 * Empty habit list → 0 (nothing to score yet).
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

/** Adapter so screens can pass `habits` straight from useHabits/useStats. */
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
