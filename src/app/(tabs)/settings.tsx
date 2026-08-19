import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  Switch,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '../../contexts/ThemeContext';
import { THEME_REGISTRY } from '../../theme';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';

import {
  resetOnboarding,
  resetAllData,
  clearActiveUserId,
  ensureActiveUser,
  getUserById,
  getPreference,
  setPreference,
  getActiveHabits,
  getAllHabitsHistoryForDate,
  getUserBadges,
  getRecentTimeEntries,
  BADGE_DEFINITIONS
} from '../../db';
import type { User } from '../../db/types';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import SettingsSectionHeader from '../../components/settings/SettingsSectionHeader';
import SettingsRow from '../../components/settings/SettingsRow';
import ThemePicker from '../../components/settings/ThemePicker';
import ProfileCard from '../../components/settings/ProfileCard';
import { useNotifications } from '../../hooks/useNotifications';
import { TimePicker } from '../../components/shared/TimePicker';
import { reconcileHabitReminders } from '../../lib/notifications/schedule';

export default function SettingsScreen() {
  const { colors, preference } = useTheme();
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
  const [exporting, setExporting] = useState(false);

  const { permission, requestPermission, openNotificationSettings, refreshPermission } =
    useNotifications();
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');

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

  // Refresh user data each time the settings tab gains focus
  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const habits = await getActiveHabits(db, user.id);
      const badges = await getUserBadges(db, user.id);
      const timeEntries = await getRecentTimeEntries(db, user.id, 1000);

      // Gather all history for the user (query directly for all dates)
      const allHistory = await db.getAllAsync(
        `SELECT * FROM habit_history WHERE user_id = ? ORDER BY date DESC`,
        [user.id]
      );

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          name: user.name,
          created_at: user.created_at,
          chai_scrolls: user.chai_scrolls
        },
        habits: habits.map((h) => ({
          title: h.title,
          description: h.description,
          icon: h.icon,
          color: h.color,
          category: h.category,
          frequency_type: h.frequency_type,
          frequency_days: h.frequency_days,
          target_count: h.target_count,
          priority: h.priority,
          created_at: h.created_at
        })),
        badges: badges.map((b) => ({
          badge_key: b.badge_key,
          earned_at: b.earned_at
        })),
        timeEntries: timeEntries.map((t) => ({
          task_name: t.task_name,
          start_time: t.start_time,
          end_time: t.end_time,
          duration_seconds: t.duration_seconds
        })),
        history: allHistory
      };

      // Copy to clipboard as the primary export method
      const Clipboard = await import('expo-clipboard');
      await Clipboard.default.setStringAsync(JSON.stringify(exportData, null, 2));
      alert('Data copied to clipboard! Paste it into a file to save.');
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleImportData = async () => {
    if (!user) return;
    try {
      const Clipboard = await import('expo-clipboard');
      const json = await Clipboard.default.getStringAsync();
      if (!json) {
        alert('Clipboard is empty. Copy your export data first.');
        return;
      }

      const data = JSON.parse(json);
      if (!data.habits || !Array.isArray(data.habits)) {
        alert('Invalid data format. Make sure you copied the full export.');
        return;
      }

      // Confirm before overwriting
      const confirmed = await new Promise<boolean>((resolve) => {
        const { Alert } = require('react-native');
        Alert.alert(
          'Import Data',
          `Import ${data.habits.length} habits? This will add to your existing data.`,
          [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Import', onPress: () => resolve(true) }
          ]
        );
      });

      if (!confirmed) return;

      // Import habits
      const { createHabit } = await import('../../db');
      for (const h of data.habits) {
        await createHabit(db, {
          user_id: user.id,
          title: h.title,
          description: h.description,
          icon: h.icon,
          color: h.color,
          category: h.category ?? 'general',
          frequency_type: h.frequency_type ?? 'daily',
          frequency_days: h.frequency_days ?? '[]',
          target_count: h.target_count ?? 1,
          priority: h.priority ?? 'medium'
        });
      }

      alert(`Successfully imported ${data.habits.length} habits!`);
      loadUser();
    } catch (e) {
      console.error('Import failed:', e);
      alert('Import failed. Make sure the data is valid JSON.');
    }
  };

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
    // For non-destructive dialogs (like privacy policy), just close
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
                {THEME_REGISTRY[preference].emoji} {THEME_REGISTRY[preference].label}
              </Text>
            </View>
            <Text style={[styles.chevron, { color: colors.textMuted }]}>
              {showThemePicker ? '▲' : '▼'}
            </Text>
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
              <TimePicker
                label="Start"
                value={quietHoursStart}
                onChange={saveQuietHoursStart}
                placeholder="10:00 PM"
              />
              <TimePicker
                label="End"
                value={quietHoursEnd}
                onChange={saveQuietHoursEnd}
                placeholder="07:00 AM"
              />
            </View>
          )}
        </View>

        {/* Data */}
        <SettingsSectionHeader title="Data" />
        <View style={styles.group}>
          <SettingsRow
            emoji="📤"
            label="Export Data"
            sublabel={exporting ? 'Exporting…' : 'Download your data as JSON'}
            onPress={exporting ? undefined : handleExportData}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingsRow
            emoji="📥"
            label="Import Data"
            sublabel="Restore from clipboard JSON"
            onPress={handleImportData}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
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
          <SettingsRow
            emoji="🔒"
            label="Privacy Policy"
            sublabel="We don't collect any data"
            onPress={() =>
              setDialog({
                key: 'privacy',
                title: 'Privacy Policy',
                message:
                  'Chai Streaks stores all your data locally on your device. We do not collect, transmit, or share any personal information, habit data, or usage statistics with any third parties. Your data never leaves your phone unless you explicitly export it.',
                label: 'Got it'
              })
            }
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

  chevron: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold,
    marginLeft: SPACING.xs
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

  tagline: {
    alignItems: 'center',
    paddingVertical: SPACING.xl
  },

  taglineText: {
    fontSize: TYPOGRAPHY.sm,
    fontStyle: 'italic'
  }
});
