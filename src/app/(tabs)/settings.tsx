import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import { resetOnboarding, resetAllData, clearActiveUserId, ensureActiveUser, getUserById } from '../../db';
import type { User } from '../../db/types';
import ConfirmDialog from '../../components/ConfirmDialog';
import SettingsSectionHeader from '../../components/SettingsSectionHeader';
import SettingsRow from '../../components/SettingsRow';
import ThemePicker from '../../components/ThemePicker';
import ProfileCard from '../../components/ProfileCard';

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

  const loadUser = useCallback(async () => {
    const uid = await ensureActiveUser(db);
    const u = await getUserById(db, uid);
    setUser(u);
  }, [db]);

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
            <View style={[styles.themePickerWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <ThemePicker />
            </View>
          )}
        </View>

        {/* Notifications */}
        <SettingsSectionHeader title="Notifications" />
        <View style={styles.group}>
          <SettingsRow emoji="🔔" label="Habit Reminders" sublabel="Coming soon" />
        </View>

        {/* Data */}
        <SettingsSectionHeader title="Data" />
        <View style={styles.group}>
          <SettingsRow
            emoji="📤"
            label="Export Data"
            sublabel="Save your habits as JSON"
            onPress={() =>
              setDialog({
                key: 'export',
                title: 'Export Data',
                message: 'Data export is coming in a future update.',
                label: 'Got it'
              })
            }
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingsRow
            emoji="📥"
            label="Import Data"
            sublabel="Restore from a backup"
            onPress={() =>
              setDialog({
                key: 'import',
                title: 'Import Data',
                message: 'Data import is coming in a future update.',
                label: 'Got it'
              })
            }
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

  tagline: {
    alignItems: 'center',
    paddingVertical: SPACING.xl
  },

  taglineText: {
    fontSize: TYPOGRAPHY.sm,
    fontStyle: 'italic'
  }
});
