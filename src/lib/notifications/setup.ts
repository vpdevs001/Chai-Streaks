import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { setNotificationPermission, type NotificationPermission } from '../../db/preferences';

/**
 * Configure the foreground notification handler.
 * This determines how notifications are shown when the app is in the foreground.
 */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true
    })
  });
}

/**
 * Create the Android notification channel for habit reminders.
 * This must run BEFORE asking for permissions.
 */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('habit-reminders', {
    name: 'Habit Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#208AEF'
  });
}

/**
 * Request notification permissions and save the result.
 */
export async function requestPermission(): Promise<NotificationPermission> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  const mappedStatus: NotificationPermission =
    finalStatus === 'granted' ? 'granted' : finalStatus === 'denied' ? 'denied' : 'undetermined';

  await setNotificationPermission(mappedStatus);
  return mappedStatus;
}

/**
 * Check permission status from system and sync it to database preferences.
 */
export async function syncPermissionStatus(): Promise<NotificationPermission> {
  const { status } = await Notifications.getPermissionsAsync();
  const mappedStatus: NotificationPermission =
    status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
  await setNotificationPermission(mappedStatus);
  return mappedStatus;
}

/**
 * Open the system notification settings.
 */
export function openNotificationSettings() {
  Linking.openSettings();
}
