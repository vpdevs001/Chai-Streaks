import React, { useState } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import { HABIT_COLORS, PRESET_ICONS } from '../../theme';
import { createHabit, getActiveUserId, createUser, getAllUsers, setActiveUserId } from '../../db';
import type { FrequencyType } from '../../db/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CreateHabitScreen() {
  const { colors } = useTheme();
  const db = useSQLiteContext();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [targetCount, setTargetCount] = useState(1);
  const [reminderTime, setReminderTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleDay = (i: number) => {
    setSelectedDays((prev) => (prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]));
  };

  const ensureUser = async () => {
    let uid = await getActiveUserId();
    if (uid !== null) return uid;
    const users = await getAllUsers(db);
    if (users.length > 0) {
      await setActiveUserId(users[0].id);
      return users[0].id;
    }
    const u = await createUser(db, { name: 'You' });
    await setActiveUserId(u.id);
    return u.id;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter a habit name');
      return;
    }
    if (frequency === 'custom' && selectedDays.length === 0) {
      setError('Pick at least one day');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const uid = await ensureUser();
      await createHabit(db, {
        user_id: uid,
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
    } catch (e) {
      setError('Failed to save habit. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>New Habit</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Preview chip */}
          <View
            style={[
              styles.previewChip,
              { backgroundColor: color + '22', borderColor: color + '55' },
            ]}
          >
            <Text style={styles.previewIcon}>{icon}</Text>
            <Text style={[styles.previewName, { color: colors.text }]} numberOfLines={1}>
              {title || 'Your new habit'}
            </Text>
          </View>

          {/* Basic info */}
          <Section title="Basic Information" colors={colors}>
            <Label label="Habit Name *" colors={colors} />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: error && !title ? colors.danger : colors.border,
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
              placeholder="Optional — what's this habit about?"
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

            <Label label="Target Count (per period)" colors={colors} />
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
            <Label label="Reminder Time (HH:MM — optional)" colors={colors} />
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

        {/* Sticky save button */}
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
              <Text style={styles.saveBtnText}>Save Habit ☕</Text>
            )}
          </TouchableOpacity>
        </View>
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
    <View style={secStyles.wrap}>
      <Text style={[secStyles.title, { color: colors.textMuted }]}>{title.toUpperCase()}</Text>
      <View style={[secStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function Label({ label, colors }: { label: string; colors: any }) {
  return <Text style={[labStyles.label, { color: colors.textSecondary }]}>{label}</Text>;
}

const secStyles = StyleSheet.create({
  wrap: { marginBottom: SPACING.lg },
  title: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  card: {
    borderRadius: RADII.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.base,
    gap: SPACING.sm,
  },
});
const labStyles = StyleSheet.create({
  label: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.medium, marginBottom: 2 },
});

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
