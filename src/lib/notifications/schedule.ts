import * as Notifications from 'expo-notifications';
import { type Habit } from '../../db/types';
import { parseReminderTime } from '../../db/utils';
import { getPreference } from '../../db/preferences';
import { getNotificationPermission } from '../../db/preferences';

// JSON-encode scheduled notification IDs
export function encodeIds(ids: string[]): string {
  return JSON.stringify(ids);
}

// Decode scheduled notification IDs
export function decodeIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [raw];
  } catch {
    return raw ? [raw] : [];
  }
}

/**
 * Schedule notifications for a habit.
 * Returns an array of newly scheduled notification IDs.
 */
export async function scheduleHabitReminders(habit: Habit): Promise<string[]> {
  // 1. Check permissions first
  const permission = await getNotificationPermission();
  if (permission !== 'granted') {
    return [];
  }

  // 2. Check if reminders are enabled and time is set
  if (habit.reminder_status !== 'enabled' || !habit.reminder_time) {
    return [];
  }

  const parsedTime = parseReminderTime(habit.reminder_time);
  if (!parsedTime) {
    return [];
  }

  let triggerHour = parsedTime.hour;
  let triggerMinute = parsedTime.minute;

  // 3. Apply Quiet Hours if enabled (Bonus Feature)
  const quietHoursEnabled = (await getPreference('@habit_tracker/quiet_hours_enabled')) === 'true';
  if (quietHoursEnabled) {
    const qStart = (await getPreference('@habit_tracker/quiet_hours_start')) || '22:00';
    const qEnd = (await getPreference('@habit_tracker/quiet_hours_end')) || '07:00';

    const checkMin = triggerHour * 60 + triggerMinute;
    const [sH, sM] = qStart.split(':').map(Number);
    const [eH, eM] = qEnd.split(':').map(Number);
    const startMin = sH * 60 + sM;
    const endMin = eH * 60 + eM;

    let isInside = false;
    if (startMin > endMin) {
      // quiet hours span midnight, e.g. 22:00 to 07:00
      isInside = checkMin >= startMin || checkMin <= endMin;
    } else {
      isInside = checkMin >= startMin && checkMin <= endMin;
    }

    if (isInside) {
      // Shift trigger to the end of quiet hours
      triggerHour = eH;
      triggerMinute = eM;
    }
  }

  const ids: string[] = [];

  // 4. Schedule based on frequency
  if (habit.frequency_type === 'daily') {
    // Schedule one daily repeating notification
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: habit.title,
        body: habit.description || 'Time to complete your habit! ☕',
        data: { screen: '/habit', habitId: habit.id }
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: triggerHour,
        minute: triggerMinute
      }
    });
    ids.push(id);
  } else {
    // For weekly or custom, schedule on specific days
    let days: number[] = [];
    try {
      days = JSON.parse(habit.frequency_days || '[]');
    } catch {
      days = [];
    }

    // Default to Monday (JS 1) if weekly frequency has no days
    if (days.length === 0) {
      days = [1];
    }

    for (const jsDay of days) {
      // JS day is 0-6 (0 is Sunday, 1 is Monday, etc.)
      // Expo weekday is 1-7 (1 is Sunday, 2 is Monday, etc.)
      const expoWeekday = jsDay + 1;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: habit.title,
          body: habit.description || 'Time to complete your habit! ☕',
          data: { screen: '/habit', habitId: habit.id }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: expoWeekday,
          hour: triggerHour,
          minute: triggerMinute
        }
      });
      ids.push(id);
    }
  }

  return ids;
}

/**
 * Cancel all scheduled notifications for a habit.
 */
export async function cancelHabitReminders(habit: Habit): Promise<void> {
  const ids = decodeIds(habit.notification_id);
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      // Ignore errors if notification is already canceled/missing
    }
  }
}

/**
 * Reschedule reminders: cancel existing ones and schedule new ones.
 * Returns the new notification IDs.
 */
export async function rescheduleHabitReminders(habit: Habit): Promise<string[]> {
  await cancelHabitReminders(habit);
  return scheduleHabitReminders(habit);
}
