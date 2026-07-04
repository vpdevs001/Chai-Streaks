import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { setPreference, getPreference } from '../../db/preferences';

/**
 * Register for Expo Push Notifications.
 * Generates the push token, saves it in storage, and returns it.
 */
export async function registerForPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token: permission not granted');
      return null;
    }

    // Get the projectId from app config (app.json)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn('Failed to get push token: EAS Project ID not found in app.json config');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId
    });

    const token = tokenData.data;
    await setPreference('@habit_tracker/push_token', token);
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Retrieves the stored push token if it exists.
 */
export async function getStoredPushToken(): Promise<string | null> {
  return getPreference('@habit_tracker/push_token');
}
