import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import { HABIT_COLORS, PRESET_ICONS } from '../../theme';
import { getHabitById, updateHabit, archiveHabit, deleteHabit } from '../../db';
import type { Habit, FrequencyType } from '../../db/types';
import { Modal } from 'react-native';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
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
        style={[dS.backdrop, { backgroundColor: colors.overlay }]}
        activeOpacity={1}
        onPress={onCancel}
      >
        <Animated.View
          style={[
            dS.box,
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
              dS.iconRing,
              { backgroundColor: confirmBg + '18', borderColor: confirmBg + '44' },
            ]}
          >
            <Text style={dS.icon}>{destructive ? '⚠️' : '💬'}</Text>
          </View>
          <Text style={[dS.title, { color: colors.text }]}>{title}</Text>
          <Text style={[dS.msg, { color: colors.textSecondary }]}>{message}</Text>
          <View style={[dS.divider, { backgroundColor: colors.border }]} />
          <View style={dS.row}>
            <TouchableOpacity
              style={[dS.btn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              onPress={onCancel}
              activeOpacity={0.75}
            >
              <Text style={[dS.btnTxt, { color: colors.textSecondary }]}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[dS.btn, { backgroundColor: confirmBg }]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={[dS.btnTxt, { color: '#fff', fontWeight: TYPOGRAPHY.bold }]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}
const dS = StyleSheet.create({
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
  row: { flexDirection: 'row', gap: SPACING.sm, width: '100%' },
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

// ─── Edit Screen ──────────────────────────────────────────────────────────────
export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const habitId = parseInt(id, 10);

  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState<'archive' | 'delete' | null>(null);

  // form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [targetCount, setTargetCount] = useState(1);
  const [reminderTime, setReminderTime] = useState('');

  useEffect(() => {
    getHabitById(db, habitId).then((h) => {
      if (h) {
        setHabit(h);
        setTitle(h.title);
        setDescription(h.description ?? '');
        setIcon(h.icon ?? '🎯');
        setColor(h.color ?? HABIT_COLORS[0]);
        setFrequency(h.frequency_type);
        setSelectedDays(JSON.parse(h.frequency_days || '[]'));
        setTargetCount(h.target_count);
        setReminderTime(h.reminder_time ?? '');
      }
      setLoading(false);
    });
  }, [habitId]);

  const toggleDay = (i: number) =>
    setSelectedDays((prev) => (prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]));

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Habit name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateHabit(db, habitId, {
        title: title.trim(),
        description: description.trim() || undefined,
        icon,
        color,
        frequency_type: frequency,
        frequency_days: JSON.stringify(frequency === 'custom' ? selectedDays : []),
        target_count: targetCount,
        reminder_status: reminderTime ? 'enabled' : 'disabled',
        reminder_time: reminderTime || undefined,
      });
      router.back();
    } catch {
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    await archiveHabit(db, habitId);
    setDialog(null);
    router.back();
  };

  const handleDelete = async () => {
    await deleteHabit(db, habitId);
    setDialog(null);
    router.back();
  };

  if (loading) {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!habit) {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Text style={{ color: colors.textSecondary }}>Habit not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: SPACING.lg }}>
          <Text style={{ color: colors.primary, fontWeight: TYPOGRAPHY.semibold }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeBtn}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Habit</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Preview */}
          <View
            style={[
              styles.previewChip,
              { backgroundColor: color + '22', borderColor: color + '55' },
            ]}
          >
            <Text style={styles.previewIcon}>{icon}</Text>
            <Text style={[styles.previewName, { color: colors.text }]} numberOfLines={1}>
              {title || 'Your habit'}
            </Text>
          </View>

          {/* Basic */}
          <Section title="Basic Information" colors={colors}>
            <Label label="Habit Name *" colors={colors} />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: error ? colors.danger : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. Morning meditation"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                setError('');
              }}
              maxLength={60}
            />
            <Label label="Description" colors={colors} />
            <TextInput
              style={[
                styles.input,
                styles.textarea,
                { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text },
              ]}
              placeholder="Optional"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </Section>

          {/* Appearance */}
          <Section title="Appearance" colors={colors}>
            <Label label="Icon" colors={colors} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.iconRow}
            >
              {PRESET_ICONS.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  style={[
                    styles.iconBtn,
                    {
                      backgroundColor: icon === ic ? color + '33' : colors.inputBg,
                      borderColor: icon === ic ? color : colors.border,
                    },
                  ]}
                  onPress={() => setIcon(ic)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.iconBtnText}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Label label="Color" colors={colors} />
            <View style={styles.colorGrid}>
              {HABIT_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    color === c && styles.colorDotSelected,
                  ]}
                  onPress={() => setColor(c)}
                  activeOpacity={0.8}
                >
                  {color === c && <Text style={styles.colorCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </Section>

          {/* Frequency */}
          <Section title="Frequency" colors={colors}>
            <View style={styles.freqRow}>
              {(['daily', 'weekly', 'custom'] as FrequencyType[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.freqBtn,
                    {
                      backgroundColor: frequency === f ? color : colors.inputBg,
                      borderColor: frequency === f ? color : colors.border,
                    },
                  ]}
                  onPress={() => setFrequency(f)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.freqBtnText,
                      { color: frequency === f ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {frequency === 'custom' && (
              <View style={styles.daysRow}>
                {DAYS.map((d, i) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.dayBtn,
                      {
                        backgroundColor: selectedDays.includes(i) ? color : colors.inputBg,
                        borderColor: selectedDays.includes(i) ? color : colors.border,
                      },
                    ]}
                    onPress={() => toggleDay(i)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dayBtnText,
                        { color: selectedDays.includes(i) ? '#fff' : colors.textSecondary },
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Label label="Target Count" colors={colors} />
            <View style={styles.counterRow}>
              <TouchableOpacity
                style={[
                  styles.counterBtn,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                ]}
                onPress={() => setTargetCount(Math.max(1, targetCount - 1))}
                activeOpacity={0.8}
              >
                <Text style={[styles.counterBtnText, { color: colors.text }]}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.counterValue, { color: colors.text }]}>{targetCount}</Text>
              <TouchableOpacity
                style={[
                  styles.counterBtn,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                ]}
                onPress={() => setTargetCount(targetCount + 1)}
                activeOpacity={0.8}
              >
                <Text style={[styles.counterBtnText, { color: colors.text }]}>+</Text>
              </TouchableOpacity>
            </View>
          </Section>

          {/* Reminder */}
          <Section title="Reminder" colors={colors}>
            <Label label="Reminder Time (HH:MM)" colors={colors} />
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text },
              ]}
              placeholder="e.g. 07:30  (notifications coming soon)"
              placeholderTextColor={colors.textMuted}
              value={reminderTime}
              onChangeText={setReminderTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </Section>

          {/* Danger zone */}
          <Section title="Danger Zone" colors={colors}>
            <TouchableOpacity
              style={[
                styles.dangerBtn,
                { backgroundColor: colors.warning + '18', borderColor: colors.warning + '44' },
              ]}
              onPress={() => setDialog('archive')}
              activeOpacity={0.8}
            >
              <Text style={styles.dangerIcon}>📦</Text>
              <View>
                <Text style={[styles.dangerLabel, { color: colors.warning }]}>Archive Habit</Text>
                <Text style={[styles.dangerSub, { color: colors.textMuted }]}>
                  Hide from home, keep history
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dangerBtn,
                { backgroundColor: colors.danger + '18', borderColor: colors.danger + '44' },
              ]}
              onPress={() => setDialog('delete')}
              activeOpacity={0.8}
            >
              <Text style={styles.dangerIcon}>🗑️</Text>
              <View>
                <Text style={[styles.dangerLabel, { color: colors.danger }]}>Delete Habit</Text>
                <Text style={[styles.dangerSub, { color: colors.textMuted }]}>
                  Permanently remove all data
                </Text>
              </View>
            </TouchableOpacity>
          </Section>

          {error ? (
            <View
              style={[
                styles.errorBox,
                { backgroundColor: colors.danger + '18', borderColor: colors.danger + '44' },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.danger }]}>⚠️ {error}</Text>
            </View>
          ) : null}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Sticky save */}
        <View
          style={[
            styles.stickyBottom,
            { backgroundColor: colors.background, borderTopColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: color }]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        <ConfirmDialog
          visible={dialog === 'archive'}
          title="Archive Habit?"
          message="This will hide the habit from your home screen. Your history will be preserved."
          confirmLabel="Archive"
          onConfirm={handleArchive}
          onCancel={() => setDialog(null)}
        />
        <ConfirmDialog
          visible={dialog === 'delete'}
          title="Delete Habit?"
          message="This will permanently delete this habit and all its history. This cannot be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={handleDelete}
          onCancel={() => setDialog(null)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <View style={{ marginBottom: SPACING.lg }}>
      <Text
        style={{
          fontSize: TYPOGRAPHY.xs,
          fontWeight: TYPOGRAPHY.bold,
          letterSpacing: 1,
          color: colors.textMuted,
          marginBottom: SPACING.sm,
          marginLeft: 4,
        }}
      >
        {title.toUpperCase()}
      </Text>
      <View
        style={{
          borderRadius: RADII.xl,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: SPACING.base,
          gap: SPACING.sm,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Label({ label, colors }: { label: string; colors: any }) {
  return (
    <Text
      style={{
        fontSize: TYPOGRAPHY.sm,
        fontWeight: TYPOGRAPHY.medium,
        color: colors.textSecondary,
        marginBottom: 2,
      }}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 18, fontWeight: TYPOGRAPHY.bold },
  headerTitle: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.bold },
  scroll: { padding: SPACING.base, paddingTop: SPACING.lg },
  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADII.full,
    borderWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignSelf: 'center',
    marginBottom: SPACING.xl,
  },
  previewIcon: { fontSize: 22 },
  previewName: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.semibold },
  input: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.medium,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  iconRow: { gap: SPACING.sm, paddingVertical: SPACING.xs },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { fontSize: 22 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: RADII.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: { borderWidth: 2.5, borderColor: '#fff', transform: [{ scale: 1.15 }] },
  colorCheck: { color: '#fff', fontSize: 16, fontWeight: TYPOGRAPHY.bold },
  freqRow: { flexDirection: 'row', gap: SPACING.sm },
  freqBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.lg,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  freqBtnText: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.semibold },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  dayBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
    borderWidth: 1.5,
  },
  dayBtnText: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.semibold },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: { fontSize: 22, fontWeight: TYPOGRAPHY.bold, lineHeight: 28 },
  counterValue: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.heavy,
    minWidth: 40,
    textAlign: 'center',
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: SPACING.md,
  },
  dangerIcon: { fontSize: 24 },
  dangerLabel: { fontSize: TYPOGRAPHY.base, fontWeight: TYPOGRAPHY.semibold },
  dangerSub: { fontSize: TYPOGRAPHY.xs, marginTop: 2 },
  errorBox: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  errorText: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.medium },
  stickyBottom: {
    padding: SPACING.base,
    paddingBottom: Platform.OS === 'ios' ? 32 : SPACING.base,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: { borderRadius: RADII.full, paddingVertical: SPACING.base + 2, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold },
});
