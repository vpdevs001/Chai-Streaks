import * as Notifications from 'expo-notifications';
import { type SQLiteDatabase } from 'expo-sqlite';
import { type Habit } from '../../db/types';
import { parseReminderTime } from '../../db/utils';
import { getPreference, getNotificationPermission } from '../../db/preferences';
import { getHabitsWithReminders, setHabitNotificationId } from '../../db/habitMethods';

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

export function getReminderTimes(reminderTimeStr: string | null | undefined): string[] {
  if (!reminderTimeStr || !reminderTimeStr.trim()) return [];

  if (reminderTimeStr.startsWith('{')) {
    try {
      const parsed = JSON.parse(reminderTimeStr);
      if (parsed.type === 'specific' && Array.isArray(parsed.times)) {
        return parsed.times;
      }
      if (parsed.type === 'hourly' && parsed.hourly) {
        const { start, end, interval } = parsed.hourly;
        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);
        const times: string[] = [];

        if (!isNaN(startHour) && !isNaN(endHour)) {
          const startTotal = startHour * 60 + (startMin || 0);
          const endTotal = endHour * 60 + (endMin || 0);
          const stepMinutes = (interval || 1) * 60;

          if (startTotal <= endTotal) {
            for (let m = startTotal; m <= endTotal; m += stepMinutes) {
              const h = Math.floor(m / 60);
              const min = m % 60;
              times.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
            }
          } else {
            // Wraps midnight (e.g. 22:00 to 06:00)
            for (let m = startTotal; m < 1440; m += stepMinutes) {
              const h = Math.floor(m / 60);
              const min = m % 60;
              times.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
            }
            const midnightOffset = (1440 - startTotal) % stepMinutes;
            const nextStart = midnightOffset === 0 ? 0 : stepMinutes - midnightOffset;
            for (let m = nextStart; m <= endTotal; m += stepMinutes) {
              const h = Math.floor(m / 60);
              const min = m % 60;
              times.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
            }
          }
        }
        return times;
      }
    } catch (e) {
      console.warn('Error parsing reminder_time JSON', e);
    }
  }

  // Legacy HH:MM format
  return [reminderTimeStr];
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

  const reminderTimes = getReminderTimes(habit.reminder_time);
  if (reminderTimes.length === 0) {
    return [];
  }

  // 3. Apply Quiet Hours if enabled (Bonus Feature)
  const quietHoursEnabled = (await getPreference('@habit_tracker/quiet_hours_enabled')) === 'true';
  const qStart = (await getPreference('@habit_tracker/quiet_hours_start')) || '22:00';
  const qEnd = (await getPreference('@habit_tracker/quiet_hours_end')) || '07:00';

  const [sH, sM] = qStart.split(':').map(Number);
  const [eH, eM] = qEnd.split(':').map(Number);
  const startMin = sH * 60 + sM;
  const endMin = eH * 60 + eM;

  const uniqueTriggers = new Set<string>();
  const triggers: { hour: number; minute: number }[] = [];

  for (const rTime of reminderTimes) {
    const parsedTime = parseReminderTime(rTime);
    if (!parsedTime) continue;

    let triggerHour = parsedTime.hour;
    let triggerMinute = parsedTime.minute;

    if (quietHoursEnabled) {
      const checkMin = triggerHour * 60 + triggerMinute;
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

    const key = `${triggerHour}:${triggerMinute}`;
    if (!uniqueTriggers.has(key)) {
      uniqueTriggers.add(key);
      triggers.push({ hour: triggerHour, minute: triggerMinute });
    }
  }

  const ids: string[] = [];

  for (const trigger of triggers) {
    // 4. Schedule based on frequency
    if (habit.frequency_type === 'daily') {
      // Schedule daily repeating notification
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: habit.title,
          body: habit.description || 'Time to complete your habit! ☕',
          data: { screen: '/habit', habitId: habit.id }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: trigger.hour,
          minute: trigger.minute
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
            hour: trigger.hour,
            minute: trigger.minute
          }
        });
        ids.push(id);
      }
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

/**
 * Re-schedules reminders for every habit that has `reminder_status = 'enabled'`
 * but doesn't have anything on the OS calendar yet (e.g. permission was
 * granted after those habits were created/edited, so `scheduleHabitReminders`
 * silently no-op'd at the time). Call this right after permission flips to
 * 'granted' (see `useNotifications().requestPermission`) and, defensively,
 * once on app boot in case the user granted permission from system Settings
 * while the app was closed.
 */
export async function reconcileHabitReminders(db: SQLiteDatabase, userId: number): Promise<void> {
  const permission = await getNotificationPermission();
  if (permission !== 'granted') return;

  const habits = await getHabitsWithReminders(db, userId);

  for (const habit of habits) {
    const existingIds = decodeIds(habit.notification_id);
    if (existingIds.length > 0) continue; // already scheduled, nothing to reconcile

    const ids = await scheduleHabitReminders(habit);
    if (ids.length > 0) {
      await setHabitNotificationId(db, habit.id, encodeIds(ids));
    }
  }
}
