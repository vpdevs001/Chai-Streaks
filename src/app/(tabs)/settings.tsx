import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  Switch,
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../../contexts/ThemeContext';

let Clipboard: any = null;
try {
  Clipboard = require('expo-clipboard');
} catch (e) {
  // Safe fallback if native module is not built/linked
}
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import {
  resetOnboarding,
  resetAllData,
  clearActiveUserId,
  ensureActiveUser,
  getUserById,
  getPreference,
  setPreference
} from '../../db';
import type { User } from '../../db/types';
import ConfirmDialog from '../../components/ConfirmDialog';
import SettingsSectionHeader from '../../components/SettingsSectionHeader';
import SettingsRow from '../../components/SettingsRow';
import ThemePicker from '../../components/ThemePicker';
import ProfileCard from '../../components/ProfileCard';
import { useNotifications } from '../../hooks/useNotifications';
import { reconcileHabitReminders } from '../../lib/notifications/schedule';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const [user, setUser] = useState<User | null>(null);
  const [dialog, setDialog] = useState<{
    key: string;
    title: string;
    message: string;
    label: string;
    destructive?: boolean;
  } | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [resetting, setResetting] = useState(false);

  const {
    permission,
    pushToken,
    requestPermission,
    openNotificationSettings,
    registerPush,
    refreshPermission
  } = useNotifications();
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  const [copiedToken, setCopiedToken] = useState(false);

  const loadUser = useCallback(async () => {
    const uid = await ensureActiveUser(db);
    const u = await getUserById(db, uid);
    setUser(u);

    const qEnabled = await getPreference('@habit_tracker/quiet_hours_enabled');
    const qStart = await getPreference('@habit_tracker/quiet_hours_start');
    const qEnd = await getPreference('@habit_tracker/quiet_hours_end');
    setQuietHoursEnabled(qEnabled === 'true');
    if (qStart) setQuietHoursStart(qStart);
    if (qEnd) setQuietHoursEnd(qEnd);
    await refreshPermission();
  }, [db, refreshPermission]);

  const toggleQuietHours = async (val: boolean) => {
    setQuietHoursEnabled(val);
    await setPreference('@habit_tracker/quiet_hours_enabled', val ? 'true' : 'false');
  };

  const saveQuietHoursStart = async (val: string) => {
    setQuietHoursStart(val);
    await setPreference('@habit_tracker/quiet_hours_start', val);
  };

  const saveQuietHoursEnd = async (val: string) => {
    setQuietHoursEnd(val);
    await setPreference('@habit_tracker/quiet_hours_end', val);
  };

  const handleEnableReminders = async () => {
    const status = await requestPermission();
    // Permission was just granted — reschedule any habit whose reminder
    // couldn't be scheduled earlier (created/edited while permission was
    // still undetermined/denied), instead of leaving it silently un-set.
    if (status === 'granted' && user) {
      await reconcileHabitReminders(db, user.id);
    }
  };

  // Dev-only debug helper: dump exactly what expo-notifications currently
  // has registered with the OS. Use this to tell apart "it never got
  // scheduled" (a bug in our code) from "it was scheduled but the OS never
  // delivered it" (permissions/battery-optimization/OEM issue) — the two
  // look identical from the outside otherwise.
  const handleDebugScheduled = async () => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    if (scheduled.length === 0) {
      Alert.alert('No scheduled notifications', 'expo-notifications has nothing registered.');
      return;
    }
    const lines = scheduled.map((n) => {
      const trigger: any = n.trigger;
      const when =
        trigger?.type === 'daily' || trigger?.hour != null
          ? `daily @ ${String(trigger.hour).padStart(2, '0')}:${String(trigger.minute).padStart(2, '0')}`
          : trigger?.type === 'weekly'
            ? `weekly day ${trigger.weekday} @ ${String(trigger.hour).padStart(2, '0')}:${String(trigger.minute).padStart(2, '0')}`
            : JSON.stringify(trigger);
      return `• ${n.content.title} — ${when}`;
    });
    Alert.alert(`${scheduled.length} scheduled`, lines.join('\n'));
  };

  const handleCopyToken = async () => {
    if (pushToken) {
      if (Clipboard?.setStringAsync) {
        await Clipboard.setStringAsync(pushToken);
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
      } else {
        console.warn('Clipboard is not available');
      }
    }
  };

  // Refresh user data each time the settings tab gains focus
  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  const handleConfirm = async () => {
    if (!dialog) return;
    if (dialog.key === 'reset') {
      setResetting(true);
      try {
        // Wipe the actual SQLite data (users → cascades to habits + history),
        // then clear the AsyncStorage-backed preferences that point at the
        // now-deleted user, so nothing tries to keep using a stale id.
        await resetAllData(db);
        await clearActiveUserId();
        await resetOnboarding();
        setDialog(null);
        router.replace('/onboarding');
        return;
      } finally {
        setResetting(false);
      }
    }
    setDialog(null);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>ChaiStreaks</Text>
        </View>

        {/* ── Profile section ────────────────────────────────────────────── */}
        <SettingsSectionHeader title="Profile" />
        {user && <ProfileCard user={user} onUserUpdated={setUser} />}

        {/* Appearance */}
        <SettingsSectionHeader title="Appearance" />
        <View style={styles.group}>
          <Pressable
            style={({ pressed }) => [
              styles.themeRow,
              { backgroundColor: colors.card, borderColor: colors.border },
              { opacity: pressed ? 0.8 : 1 }
            ]}
            onPress={() => setShowThemePicker(!showThemePicker)}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.primary + '18' }]}>
              <Text style={styles.rowEmoji}>🎨</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Theme</Text>
              <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                Choose your colour mode
              </Text>
            </View>
          </Pressable>
          {showThemePicker && (
            <View
              style={[
                styles.themePickerWrap,
                { borderColor: colors.border, backgroundColor: colors.card }
              ]}
            >
              <ThemePicker />
            </View>
          )}
        </View>

        {/* Notifications */}
        <SettingsSectionHeader title="Notifications" />
        <View style={styles.group}>
          <SettingsRow
            emoji="🔔"
            label="Local Reminders"
            sublabel={
              permission === 'granted'
                ? 'On'
                : permission === 'denied'
                  ? 'Off · Tap to open Settings'
                  : 'Tap to enable'
            }
            onPress={
              permission === 'denied'
                ? openNotificationSettings
                : permission === 'undetermined'
                  ? handleEnableReminders
                  : undefined
            }
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={[styles.switchRow, { backgroundColor: colors.card }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primary + '18' }]}>
              <Text style={styles.rowEmoji}>🌙</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Quiet Hours</Text>
              <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                Shift notifications during quiet times
              </Text>
            </View>
            <Switch
              value={quietHoursEnabled}
              onValueChange={toggleQuietHours}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          {quietHoursEnabled && (
            <View style={[styles.timeRowContainer, { backgroundColor: colors.card }]}>
              <View style={styles.timeInputGroup}>
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Start</Text>
                <TextInput
                  style={[
                    styles.timeInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.inputBg
                    }
                  ]}
                  value={quietHoursStart}
                  onChangeText={saveQuietHoursStart}
                  placeholder="22:00"
                  placeholderTextColor={colors.textMuted}
                  maxLength={5}
                />
              </View>
              <View style={styles.timeInputGroup}>
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>End</Text>
                <TextInput
                  style={[
                    styles.timeInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.inputBg
                    }
                  ]}
                  value={quietHoursEnd}
                  onChangeText={saveQuietHoursEnd}
                  placeholder="07:00"
                  placeholderTextColor={colors.textMuted}
                  maxLength={5}
                />
              </View>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <SettingsRow
            emoji="💬"
            label="Push Token"
            sublabel={
              pushToken
                ? copiedToken
                  ? 'Copied to clipboard! ✅'
                  : 'Tap to copy token'
                : 'Tap to register push token'
            }
            onPress={pushToken ? handleCopyToken : registerPush}
          />

          {__DEV__ && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <SettingsRow
                emoji="🛠️"
                label="Debug: Scheduled Reminders"
                sublabel="Dev only — see what's actually registered with the OS"
                onPress={handleDebugScheduled}
              />
            </>
          )}
        </View>

        {/* Data */}
        <SettingsSectionHeader title="Data" />
        <View style={styles.group}>
          <SettingsRow
            emoji="🗑️"
            label="Reset All Data"
            sublabel={resetting ? 'Resetting…' : 'Delete all habits and history'}
            danger
            onPress={
              resetting
                ? undefined
                : () =>
                    setDialog({
                      key: 'reset',
                      title: 'Reset Everything?',
                      message:
                        'This will delete all your habits, streaks, and history. This action cannot be undone.',
                      label: 'Yes, reset',
                      destructive: true
                    })
            }
          />
        </View>

        {/* About */}
        <SettingsSectionHeader title="About" />
        <View style={styles.group}>
          <SettingsRow emoji="ℹ️" label="Version" sublabel="1.0.0 (MVP)" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingsRow emoji="🐙" label="GitHub" sublabel="View source code" onPress={() => {}} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingsRow
            emoji="🔒"
            label="Privacy Policy"
            sublabel="We don't collect any data"
            onPress={() => {}}
          />
        </View>

        {/* Tagline */}
        <View style={styles.tagline}>
          <Text style={[styles.taglineText, { color: colors.textMuted }]}>
            ☕ Build habits one cup of chai at a time.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ConfirmDialog
        visible={!!dialog}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        confirmLabel={dialog?.label}
        destructive={dialog?.destructive}
        onConfirm={handleConfirm}
        onCancel={() => setDialog(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },

  scroll: {
    padding: SPACING.base,
    paddingTop: Platform.OS === 'ios' ? 60 : 40
  },

  header: {
    marginBottom: SPACING.xl
  },

  title: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.heavy
  },

  sub: {
    fontSize: TYPOGRAPHY.sm,
    marginTop: 2
  },

  group: {
    borderRadius: RADII.xl,
    overflow: 'hidden',
    marginBottom: SPACING.sm
  },

  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 0
  },

  themePickerWrap: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth
  },

  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center'
  },

  rowEmoji: {
    fontSize: 18
  },

  rowLabel: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold
  },

  rowSub: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: 1
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: SPACING.md + 38 + SPACING.md
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 0
  },

  timeRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth
  },

  timeInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm
  },

  timeLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium
  },

  timeInput: {
    borderRadius: RADII.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    fontSize: TYPOGRAPHY.sm,
    textAlign: 'center',
    width: 70
  },

  tagline: {
    alignItems: 'center',
    paddingVertical: SPACING.xl
  },

  taglineText: {
    fontSize: TYPOGRAPHY.sm,
    fontStyle: 'italic'
  }
});
