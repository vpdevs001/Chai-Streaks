import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import { HABIT_COLORS } from '../../theme';
import {
  getHabitById,
  updateHabit,
  archiveHabit,
  deleteHabit,
  setHabitNotificationId,
  getHabitCalendarData
} from '../../db';
import { isReleasedDbError } from '../../db/utils';
import type { Habit, FrequencyType } from '../../db/types';
import {
  cancelHabitReminders,
  scheduleHabitReminders,
  encodeIds
} from '../../lib/notifications/schedule';
import ConfirmDialog from '../../components/ConfirmDialog';
import Section from '../../components/Section';
import Label from '../../components/Label';
import CalendarHeatmap from '../../components/CalendarHeatmap';
import HabitFormAppearance from '../../components/HabitFormAppearance';
import HabitFormFrequency from '../../components/HabitFormFrequency';
import HabitDangerZone from '../../components/HabitDangerZone';

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
  const [history, setHistory] = useState<Record<string, 'completed' | 'skipped' | 'partial'>>({});

  useEffect(() => {
    // This screen is a modal that can be dismissed (router.back()) before
    // the fetch resolves — guard against setting state after that happens,
    // and against the native db connection being torn down mid-flight.
    let isActive = true;

    getHabitById(db, habitId)
      .then((h) => {
        if (!isActive) return;
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
      })
      .catch((err) => {
        if (!isActive) return;
        if (!isReleasedDbError(err)) throw err;
      });

    getHabitCalendarData(db, habitId)
      .then((data) => {
        if (isActive) setHistory(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!isActive) return;
        if (!isReleasedDbError(err)) throw err;
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [habitId, db]);

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
      if (habit) {
        await cancelHabitReminders(habit);
      }

      const updated = await updateHabit(db, habitId, {
        title: title.trim(),
        description: description.trim() || undefined,
        icon,
        color,
        frequency_type: frequency,
        frequency_days: JSON.stringify(
          frequency === 'weekly' || frequency === 'custom' ? selectedDays : []
        ),
        target_count: targetCount,
        reminder_status: reminderTime ? 'enabled' : 'disabled',
        reminder_time: reminderTime || null,
        notification_id: null // Reset to empty first, will be set below if enabled
      });

      if (updated.reminder_status === 'enabled') {
        const ids = await scheduleHabitReminders(updated);
        if (ids.length > 0) {
          await setHabitNotificationId(db, updated.id, encodeIds(ids));
        }
      }

      router.back();
    } catch {
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (habit) {
      await cancelHabitReminders(habit);
    }
    await archiveHabit(db, habitId);
    setDialog(null);
    router.back();
  };

  const handleDelete = async () => {
    if (habit) {
      await cancelHabitReminders(habit);
    }
    await deleteHabit(db, habitId);
    setDialog(null);
    router.back();
  };

  if (loading) {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }
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
          { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }
        ]}
      >
        <Text style={{ color: colors.textSecondary }}>Habit not found.</Text>
        <Pressable
          style={({ pressed }) => [{ marginTop: SPACING.lg, opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.back()}
        >
          <Text style={{ color: colors.primary, fontWeight: TYPOGRAPHY.semibold }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.root, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
            </Pressable>
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
                { backgroundColor: color + '22', borderColor: color + '55' }
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
                    color: colors.text
                  }
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
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    color: colors.text
                  }
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

            <HabitFormAppearance
              colors={colors}
              icon={icon}
              color={color}
              onIconChange={setIcon}
              onColorChange={setColor}
            />

            <HabitFormFrequency
              colors={colors}
              color={color}
              frequency={frequency}
              selectedDays={selectedDays}
              targetCount={targetCount}
              onFrequencyChange={setFrequency}
              onToggleDay={toggleDay}
              onTargetCountChange={setTargetCount}
            />

            {/* Reminder */}
            <Section title="Reminder" colors={colors}>
              <Label label="Reminder Time (HH:MM)" colors={colors} />
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    color: colors.text
                  }
                ]}
                placeholder="e.g. 07:30"
                placeholderTextColor={colors.textMuted}
                value={reminderTime}
                onChangeText={setReminderTime}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </Section>

            {/* 90-Day Streak Heatmap View */}
            <CalendarHeatmap habitColor={color} history={history} />

            {/* Danger zone */}
            <Section title="Danger Zone" colors={colors}>
              <HabitDangerZone
                colors={colors}
                onArchive={() => setDialog('archive')}
                onDelete={() => setDialog('delete')}
              />
            </Section>

            {error ? (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: colors.danger + '18', borderColor: colors.danger + '44' }
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
              { backgroundColor: colors.background, borderTopColor: colors.border }
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                {
                  backgroundColor: color,
                  opacity: pressed ? 0.85 : 1
                }
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </Pressable>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.full,
    alignItems: 'center',
    justifyContent: 'center'
  },

  closeText: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.bold
  },

  headerTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold
  },

  scroll: {
    padding: SPACING.base,
    paddingTop: SPACING.lg
  },

  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADII.full,
    borderWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignSelf: 'center',
    marginBottom: SPACING.xl
  },

  previewIcon: {
    fontSize: 22
  },

  previewName: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold
  },

  input: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.medium
  },

  textarea: {
    minHeight: 80,
    textAlignVertical: 'top'
  },

  errorBox: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm
  },

  errorText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium
  },

  stickyBottom: {
    padding: SPACING.base,
    paddingBottom: Platform.OS === 'ios' ? 32 : SPACING.base,
    borderTopWidth: StyleSheet.hairlineWidth
  },

  saveBtn: {
    borderRadius: RADII.full,
    paddingVertical: SPACING.base + 2,
    alignItems: 'center'
  },

  saveBtnText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold
  }
});
