import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { migrateDatabase, hasOnboarded, getActiveUserId } from '../db';
import { configureNotificationHandler, ensureAndroidChannel } from '../lib/notifications/setup';
import { resolveNotificationRoute } from '../lib/notifications/deepLink';
import { reconcileHabitReminders } from '../lib/notifications/schedule';

function AppGate() {
  const { colors, scheme } = useTheme();
  const db = useSQLiteContext();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isActive = true;

    // 1. Initialise notification settings. The channel must exist before
    // anything schedules a notification against it (e.g. reconciliation
    // below, or a habit save that fires milliseconds after boot) — on
    // Android, scheduling before the channel exists can silently drop the
    // notification, so we await it instead of firing-and-forgetting.
    async function initAndroidChannel() {
      configureNotificationHandler();
      await ensureAndroidChannel();
    }
    initAndroidChannel().then(() => {
      if (!isActive) return;

      // 5. Defensive reconciliation: if the user granted notification
      // permission from system Settings while the app was closed (or after
      // an app update), any habit reminders that couldn't be scheduled at
      // creation/edit time are still sitting unset. Catch those up here too,
      // not just right after the in-app permission prompt.
      getActiveUserId().then((userId) => {
        if (userId != null) {
          reconcileHabitReminders(db, userId).catch(() => {});
        }
      });
    });

    // 2. Tap handler for notifications when app is running
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const route = resolveNotificationRoute(data);
      if (route) {
        setTimeout(() => {
          router.push(route as any);
        }, 100);
      }
    });

    // 3. Tap handler for notification cold-starts (app was closed)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        const route = resolveNotificationRoute(data);
        if (route) {
          setTimeout(() => {
            router.push(route as any);
          }, 500);
        }
      }
    });

    // 4. Check onboarding
    hasOnboarded().then((done) => {
      if (!done) router.replace('/onboarding');
      setChecking(false);
    });

    return () => {
      isActive = false;
      subscription.remove();
    };
  }, []);

  if (checking) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="habit/create"
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
        <Stack.Screen
          name="habit/[id]"
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="chaistreaks.db" onInit={migrateDatabase}>
        <ThemeProvider>
          <AppGate />
        </ThemeProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
