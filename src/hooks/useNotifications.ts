import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { type NotificationPermission } from '../db/preferences';
import {
  requestPermission as reqPerm,
  openNotificationSettings as openSettings,
  syncPermissionStatus
} from '../lib/notifications/setup';
import { registerForPushToken } from '../lib/notifications/push';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('undetermined');
  const [pushToken, setPushToken] = useState<string | null>(null);

  const refreshPermission = useCallback(async () => {
    // Re-checks the real OS permission (not just our cached copy), so status
    // reflects changes made outside the app (e.g. via system Settings).
    const status = await syncPermissionStatus();
    setPermission(status);
  }, []);

  useEffect(() => {
    refreshPermission();
  }, [refreshPermission]);

  const requestPermission = useCallback(async () => {
    const status = await reqPerm();
    setPermission(status);
    return status;
  }, []);

  const openNotificationSettings = useCallback(() => {
    openSettings();
  }, []);

  const registerPush = useCallback(async () => {
    const token = await registerForPushToken();
    if (token) {
      setPushToken(token);
    }
    await refreshPermission();
    return token;
  }, [refreshPermission]);

  return {
    permission,
    pushToken,
    requestPermission,
    openNotificationSettings,
    registerPush,
    refreshPermission
  };
}
