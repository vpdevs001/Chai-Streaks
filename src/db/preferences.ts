// ─────────────────────────────────────────────────────────────────────────────
//  db/preferences.ts  –  Key-value preferences using expo-sqlite/kv-store
//
//  expo-sqlite (SDK 55) ships `expo-sqlite/kv-store` as a zero-dependency
//  drop-in replacement for @react-native-async-storage/async-storage.
//  Import it as the default export (works exactly like AsyncStorage).
// ─────────────────────────────────────────────────────────────────────────────

import Storage from 'expo-sqlite/kv-store';
import { STORAGE_KEYS } from './types';

// ─── Onboarding ──────────────────────────────────────────────────────────────

/**
 * Returns true if the user has already completed onboarding.
 * Call this in your root navigator to decide which screen to show first.
 */
export async function hasOnboarded(): Promise<boolean> {
  const value = await Storage.getItem(STORAGE_KEYS.HAS_ONBOARDED);
  return value === 'true';
}

/**
 * Mark onboarding as complete. Call this on the last onboarding screen.
 */
export async function setOnboarded(): Promise<void> {
  await Storage.setItem(STORAGE_KEYS.HAS_ONBOARDED, 'true');
}

/**
 * Reset the onboarding flag (useful for development / "reset app" feature).
 */
export async function resetOnboarding(): Promise<void> {
  await Storage.removeItem(STORAGE_KEYS.HAS_ONBOARDED);
}

// ─── Active user ──────────────────────────────────────────────────────────────

/**
 * Persist which user profile is currently active.
 */
export async function setActiveUserId(userId: number): Promise<void> {
  await Storage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, String(userId));
}

/**
 * Retrieve the active user's ID. Returns null if none is set.
 */
export async function getActiveUserId(): Promise<number | null> {
  const value = await Storage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
  if (value === null) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

/** Clear the stored active user (e.g. on logout / profile deletion). */
export async function clearActiveUserId(): Promise<void> {
  await Storage.removeItem(STORAGE_KEYS.ACTIVE_USER_ID);
}

// ─── Theme ────────────────────────────────────────────────────────────────────

export type AppTheme =
  | 'light'
  | 'dark'
  | 'system'
  | 'forest_dark'
  | 'forest_light'
  | 'ocean_dark'
  | 'ocean_light'
  | 'lavender_dark'
  | 'lavender_light'
  | 'sunset_dark'
  | 'sunset_light'
  | 'midnight_sky'
  | 'nord';

const VALID_THEMES: AppTheme[] = [
  'light',
  'dark',
  'system',
  'forest_dark',
  'forest_light',
  'ocean_dark',
  'ocean_light',
  'lavender_dark',
  'lavender_light',
  'sunset_dark',
  'sunset_light',
  'midnight_sky',
  'nord'
];

export async function getTheme(): Promise<AppTheme> {
  const value = await Storage.getItem(STORAGE_KEYS.THEME);
  if (VALID_THEMES.includes(value as AppTheme)) return value as AppTheme;
  return 'system'; // default
}

export async function setTheme(theme: AppTheme): Promise<void> {
  await Storage.setItem(STORAGE_KEYS.THEME, theme);
}

// ─── Notification permission ──────────────────────────────────────────────────

export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

export async function getNotificationPermission(): Promise<NotificationPermission> {
  const value = await Storage.getItem(STORAGE_KEYS.NOTIFICATION_PERMISSION);
  if (value === 'granted' || value === 'denied') return value;
  return 'undetermined';
}

export async function setNotificationPermission(status: NotificationPermission): Promise<void> {
  await Storage.setItem(STORAGE_KEYS.NOTIFICATION_PERMISSION, status);
}

// ─── Generic helpers (escape hatch for any other key) ────────────────────────

export async function getPreference(key: string): Promise<string | null> {
  return Storage.getItem(key);
}

export async function setPreference(key: string, value: string): Promise<void> {
  await Storage.setItem(key, value);
}

export async function removePreference(key: string): Promise<void> {
  await Storage.removeItem(key);
}
