import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import { resetOnboarding } from '../../db';
import type { AppTheme } from '../../db/preferences';

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
import { Modal, Animated } from 'react-native';

function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { colors } = useTheme();
  const scale = React.useRef(new Animated.Value(0.88)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 260 }),
        Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.88);
      opacity.setValue(0);
    }
  }, [visible]);

  const confirmBg = destructive ? colors.danger : colors.primary;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <TouchableOpacity
        style={[dStyles.backdrop, { backgroundColor: colors.overlay }]}
        activeOpacity={1}
        onPress={onCancel}
      >
        <Animated.View
          style={[
            dStyles.box,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          <View
            style={[
              dStyles.iconRing,
              { backgroundColor: confirmBg + '18', borderColor: confirmBg + '44' },
            ]}
          >
            <Text style={dStyles.icon}>{destructive ? '⚠️' : '💬'}</Text>
          </View>
          <Text style={[dStyles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[dStyles.msg, { color: colors.textSecondary }]}>{message}</Text>
          <View style={[dStyles.divider, { backgroundColor: colors.border }]} />
          <View style={dStyles.btnRow}>
            <TouchableOpacity
              style={[dStyles.btn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              onPress={onCancel}
              activeOpacity={0.75}
            >
              <Text style={[dStyles.btnTxt, { color: colors.textSecondary }]}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[dStyles.btn, { backgroundColor: confirmBg }]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={[dStyles.btnTxt, { color: '#fff', fontWeight: TYPOGRAPHY.bold }]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const dStyles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING['2xl'] },
  box: {
    width: '100%',
    maxWidth: 340,
    borderRadius: RADII['2xl'],
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconRing: {
    width: 56,
    height: 56,
    borderRadius: RADII.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 24 },
  title: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.bold, textAlign: 'center' },
  msg: { fontSize: TYPOGRAPHY.base, textAlign: 'center', lineHeight: 22 },
  divider: { width: '100%', height: StyleSheet.hairlineWidth },
  btnRow: { flexDirection: 'row', gap: SPACING.sm, width: '100%' },
  btn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADII.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  btnTxt: { fontSize: TYPOGRAPHY.base, fontWeight: TYPOGRAPHY.semibold },
});

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[sStyles.sectionTitle, { color: colors.textMuted }]}>{title.toUpperCase()}</Text>
  );
}

// ─── Settings Row ─────────────────────────────────────────────────────────────
function SettingsRow({
  emoji,
  label,
  sublabel,
  onPress,
  rightEl,
  danger = false,
}: {
  emoji: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  rightEl?: React.ReactNode;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[sStyles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View
        style={[
          sStyles.rowIcon,
          { backgroundColor: (danger ? colors.danger : colors.primary) + '18' },
        ]}
      >
        <Text style={sStyles.rowEmoji}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[sStyles.rowLabel, { color: danger ? colors.danger : colors.text }]}>
          {label}
        </Text>
        {sublabel && <Text style={[sStyles.rowSub, { color: colors.textMuted }]}>{sublabel}</Text>}
      </View>
      {rightEl ?? (onPress && <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>)}
    </TouchableOpacity>
  );
}

// ─── Theme Picker ─────────────────────────────────────────────────────────────
function ThemePicker() {
  const { colors, preference, setPreference } = useTheme();
  const options: { label: string; value: AppTheme; emoji: string }[] = [
    { label: 'System', value: 'system', emoji: '⚙️' },
    { label: 'Light', value: 'light', emoji: '☀️' },
    { label: 'Dark', value: 'dark', emoji: '🌙' },
  ];

  return (
    <View style={[tStyles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {options.map((opt) => {
        const active = preference === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[tStyles.opt, active && { backgroundColor: colors.primary }]}
            onPress={() => setPreference(opt.value)}
            activeOpacity={0.8}
          >
            <Text style={tStyles.optEmoji}>{opt.emoji}</Text>
            <Text style={[tStyles.optLabel, { color: active ? '#fff' : colors.textSecondary }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: RADII.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    gap: 4,
  },
  opt: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
    gap: 3,
  },
  optEmoji: { fontSize: 18 },
  optLabel: { fontSize: TYPOGRAPHY.xs, fontWeight: TYPOGRAPHY.semibold },
});

// ─── Settings Screen ──────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { colors } = useTheme();
  const [dialog, setDialog] = useState<{
    key: string;
    title: string;
    message: string;
    label: string;
    destructive?: boolean;
  } | null>(null);

  const handleConfirm = async () => {
    if (!dialog) return;
    if (dialog.key === 'reset') {
      await resetOnboarding();
      setDialog(null);
    } else {
      setDialog(null);
    }
  };

  return (
    <View style={[sStyles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={sStyles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={sStyles.header}>
          <Text style={[sStyles.title, { color: colors.text }]}>Settings</Text>
          <Text style={[sStyles.sub, { color: colors.textSecondary }]}>ChaiStreaks</Text>
        </View>

        {/* Appearance */}
        <SectionHeader title="Appearance" />
        <View style={sStyles.group}>
          <View style={[sStyles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[sStyles.rowIcon, { backgroundColor: colors.primary + '18' }]}>
              <Text style={sStyles.rowEmoji}>🎨</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[sStyles.rowLabel, { color: colors.text }]}>Theme</Text>
              <Text style={[sStyles.rowSub, { color: colors.textMuted }]}>
                Choose your colour mode
              </Text>
            </View>
          </View>
          <View style={[sStyles.themePickerWrap, { borderColor: colors.border }]}>
            <ThemePicker />
          </View>
        </View>

        {/* Notifications (placeholder) */}
        <SectionHeader title="Notifications" />
        <View style={sStyles.group}>
          <SettingsRow emoji="🔔" label="Habit Reminders" sublabel="Coming soon" />
        </View>

        {/* Data */}
        <SectionHeader title="Data" />
        <View style={sStyles.group}>
          <SettingsRow
            emoji="📤"
            label="Export Data"
            sublabel="Save your habits as JSON"
            onPress={() =>
              setDialog({
                key: 'export',
                title: 'Export Data',
                message: 'Data export is coming in a future update.',
                label: 'Got it',
              })
            }
          />
          <View style={[sStyles.divider, { backgroundColor: colors.border }]} />
          <SettingsRow
            emoji="📥"
            label="Import Data"
            sublabel="Restore from a backup"
            onPress={() =>
              setDialog({
                key: 'import',
                title: 'Import Data',
                message: 'Data import is coming in a future update.',
                label: 'Got it',
              })
            }
          />
          <View style={[sStyles.divider, { backgroundColor: colors.border }]} />
          <SettingsRow
            emoji="🗑️"
            label="Reset All Data"
            sublabel="Delete all habits and history"
            danger
            onPress={() =>
              setDialog({
                key: 'reset',
                title: 'Reset Everything?',
                message:
                  'This will delete all your habits, streaks, and history. This action cannot be undone.',
                label: 'Yes, reset',
                destructive: true,
              })
            }
          />
        </View>

        {/* About */}
        <SectionHeader title="About" />
        <View style={sStyles.group}>
          <SettingsRow emoji="ℹ️" label="Version" sublabel="1.0.0 (MVP)" />
          <View style={[sStyles.divider, { backgroundColor: colors.border }]} />
          <SettingsRow emoji="🐙" label="GitHub" sublabel="View source code" onPress={() => {}} />
          <View style={[sStyles.divider, { backgroundColor: colors.border }]} />
          <SettingsRow
            emoji="🔒"
            label="Privacy Policy"
            sublabel="We don't collect any data"
            onPress={() => {}}
          />
        </View>

        {/* Tagline */}
        <View style={sStyles.tagline}>
          <Text style={[sStyles.taglineText, { color: colors.textMuted }]}>
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
    </View>
  );
}

const sStyles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: SPACING.base, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header: { marginBottom: SPACING.xl },
  title: { fontSize: TYPOGRAPHY['2xl'], fontWeight: TYPOGRAPHY.heavy },
  sub: { fontSize: TYPOGRAPHY.sm, marginTop: 2 },
  sectionTitle: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
    marginLeft: 4,
  },
  group: { borderRadius: RADII.xl, overflow: 'hidden', marginBottom: SPACING.sm },
  themePickerWrap: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 0,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowEmoji: { fontSize: 18 },
  rowLabel: { fontSize: TYPOGRAPHY.base, fontWeight: TYPOGRAPHY.semibold },
  rowSub: { fontSize: TYPOGRAPHY.xs, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: SPACING.md + 38 + SPACING.md },
  tagline: { alignItems: 'center', paddingVertical: SPACING.xl },
  taglineText: { fontSize: TYPOGRAPHY.sm, fontStyle: 'italic' },
});
