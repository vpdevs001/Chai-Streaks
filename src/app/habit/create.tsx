import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import { HABIT_COLORS } from '../../theme';
import { createHabit, ensureActiveUser, setHabitNotificationId } from '../../db';
import type { FrequencyType, HabitPriority } from '../../db/types';
import { scheduleHabitReminders, encodeIds } from '../../lib/notifications/schedule';
import Section from '../../components/Section';
import Label from '../../components/Label';
import HabitFormAppearance from '../../components/HabitFormAppearance';
import HabitFormFrequency from '../../components/HabitFormFrequency';
import HabitFormPriority from '../../components/HabitFormPriority';
import ReminderPicker from '../../components/ReminderPicker';

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
  const [priority, setPriority] = useState<HabitPriority>('medium');
  const [reminderTime, setReminderTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleDay = (i: number) => {
    setSelectedDays((prev) => (prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter a habit name');
      return;
    }
    if ((frequency === 'weekly' || frequency === 'custom') && selectedDays.length === 0) {
      setError('Pick at least one day');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const uid = await ensureActiveUser(db);
      const habit = await createHabit(db, {
        user_id: uid,
        title: title.trim(),
        description: description.trim() || undefined,
        icon,
        color,
        frequency_type: frequency,
        frequency_days: JSON.stringify(
          frequency === 'weekly' || frequency === 'custom' ? selectedDays : []
        ),
        target_count: targetCount,
        priority,
        reminder_status: reminderTime ? 'enabled' : 'disabled',
        reminder_time: reminderTime || undefined
      });

      if (habit.reminder_status === 'enabled') {
        const ids = await scheduleHabitReminders(habit);
        if (ids.length > 0) {
          await setHabitNotificationId(db, habit.id, encodeIds(ids));
        }
      }

      router.back();
    } catch (e) {
      setError('Failed to save habit. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
                { backgroundColor: color + '22', borderColor: color + '55' }
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
                placeholder="Optional — what's this habit about?"
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

            <HabitFormPriority colors={colors} priority={priority} onChange={setPriority} />

            {/* Reminder */}
            <Section title="Reminder" colors={colors}>
              <ReminderPicker value={reminderTime} onChange={setReminderTime} />
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

          {/* Sticky save button */}
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
                <Text style={styles.saveBtnText}>Save Habit ☕</Text>
              )}
            </Pressable>
          </View>
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
