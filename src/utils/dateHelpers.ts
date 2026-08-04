export function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  const suffix = name ? `, ${name} ☕` : ' ☕';
  if (hour < 12) return `Good Morning${suffix}`;
  if (hour < 17) return `Good Afternoon${suffix}`;
  return `Good Evening${suffix}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${day}`);
  }
  return days;
}

export function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${day}`);
  }
  return days;
}

export function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function shortDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
}

export function shortMonthDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()}`;
}

/**
 * Returns true if a habit is scheduled for the given reference date (defaults
 * to today). Handles all FrequencyType values:
 *  - 'daily'  → always due
 *  - 'weekly' | 'custom' → due on specific JS weekday indices (0=Sun … 6=Sat)
 *    stored as a JSON number[] in habit.frequency_days. Empty array → treated
 *    as daily (due every day) to avoid zero-day habits disappearing.
 */
export function isHabitDueToday(
  habit: { frequency_type: string; frequency_days: string },
  referenceDate: Date = new Date()
): boolean {
  if (habit.frequency_type === 'daily') return true;

  let days: number[] = [];
  try {
    const parsed = JSON.parse(habit.frequency_days);
    if (Array.isArray(parsed)) days = parsed as number[];
  } catch {
    // malformed JSON — treat as daily
    return true;
  }

  if (days.length === 0) return true; // no days specified → daily

  const todayDow = referenceDate.getDay(); // 0=Sun … 6=Sat
  return days.includes(todayDow);
}
