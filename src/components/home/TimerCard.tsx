import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  Animated
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useTimer } from '../../contexts/TimerContext';
import { useHabits } from '../../hooks/useHabits';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import * as Haptics from 'expo-haptics';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function TimerCard() {
  const { colors } = useTheme();
  const { userId, habits } = useHabits();
  const {
    runningEntry,
    elapsedSeconds,
    isRunning,
    startTimer,
    stopTimer,
    recentEntries,
    refreshEntries,
    removeEntry
  } = useTimer();
  const [showStartModal, setShowStartModal] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (userId) refreshEntries(userId);
  }, [userId, refreshEntries]);

  const handleStart = useCallback(async () => {
    if (!userId || !taskName.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await startTimer(userId, taskName.trim(), selectedHabitId ?? undefined);
    setTaskName('');
    setSelectedHabitId(null);
    setShowStartModal(false);
  }, [userId, taskName, selectedHabitId, startTimer]);

  const handleStop = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await stopTimer();
    if (userId) refreshEntries(userId);
  }, [stopTimer, userId, refreshEntries]);

  const selectedHabit = habits.find((h) => h.id === selectedHabitId);

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>⏱️ Time Tracker</Text>
          <Pressable onPress={() => setShowHistory(!showHistory)}>
            <Text style={[styles.historyToggle, { color: colors.primary }]}>
              {showHistory ? 'Hide' : 'History'}
            </Text>
          </Pressable>
        </View>

        {isRunning && runningEntry ? (
          <View style={styles.runningSection}>
            <View style={[styles.runningIndicator, { backgroundColor: colors.success + '22' }]}>
              <View style={[styles.pulseDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.runningTask, { color: colors.text }]} numberOfLines={1}>
                {runningEntry.task_name}
              </Text>
            </View>
            <Text style={[styles.timerDisplay, { color: colors.primary }]}>
              {formatDuration(elapsedSeconds)}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.stopBtn,
                { backgroundColor: colors.danger, opacity: pressed ? 0.85 : 1 }
              ]}
              onPress={handleStop}
            >
              <Text style={styles.stopBtnText}>■ Stop</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.startBtn,
              {
                backgroundColor: colors.primary + '18',
                borderColor: colors.primary + '44',
                opacity: pressed ? 0.7 : 1
              }
            ]}
            onPress={() => setShowStartModal(true)}
          >
            <Text style={[styles.startBtnText, { color: colors.primary }]}>▶ Start Timer</Text>
          </Pressable>
        )}

        {/* Recent entries */}
        {showHistory && recentEntries.length > 0 && (
          <View style={styles.historySection}>
            <Text style={[styles.historyTitle, { color: colors.textSecondary }]}>Recent</Text>
            {recentEntries.slice(0, 5).map((entry) => (
              <View key={entry.id} style={[styles.historyRow, { borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyTask, { color: colors.text }]} numberOfLines={1}>
                    {entry.task_name}
                  </Text>
                  <Text style={[styles.historyDate, { color: colors.textMuted }]}>
                    {new Date(entry.start_time).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                <Text style={[styles.historyDuration, { color: colors.primary }]}>
                  {formatDuration(entry.duration_seconds)}
                </Text>
                <Pressable onPress={() => removeEntry(entry.id)} hitSlop={8}>
                  <Text style={[styles.deleteBtn, { color: colors.danger }]}>✕</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Start Timer Modal */}
      <Modal transparent visible={showStartModal} animationType="fade">
        <Pressable
          style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
          onPress={() => setShowStartModal(false)}
        >
          <View
            style={[
              styles.modalBox,
              { backgroundColor: colors.surface, borderColor: colors.border }
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>Start Timer</Text>

            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }
              ]}
              placeholder="What are you working on?"
              placeholderTextColor={colors.textMuted}
              value={taskName}
              onChangeText={setTaskName}
              autoFocus
            />

            <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>
              Link to habit (optional)
            </Text>
            <FlatList
              data={habits}
              keyExtractor={(h) => String(h.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.habitPicker}
              renderItem={({ item: habit }) => (
                <Pressable
                  style={[
                    styles.habitChip,
                    {
                      backgroundColor:
                        selectedHabitId === habit.id ? colors.primary + '33' : colors.inputBg,
                      borderColor: selectedHabitId === habit.id ? colors.primary : colors.border
                    }
                  ]}
                  onPress={() => setSelectedHabitId(selectedHabitId === habit.id ? null : habit.id)}
                >
                  <Text style={styles.habitChipEmoji}>{habit.icon ?? '✨'}</Text>
                  <Text
                    style={[
                      styles.habitChipText,
                      {
                        color: selectedHabitId === habit.id ? colors.primary : colors.textSecondary
                      }
                    ]}
                    numberOfLines={1}
                  >
                    {habit.title}
                  </Text>
                </Pressable>
              )}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[
                  styles.modalBtn,
                  { backgroundColor: colors.inputBg, borderColor: colors.border }
                ]}
                onPress={() => setShowStartModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: taskName.trim() ? colors.primary : colors.border,
                    opacity: taskName.trim() ? 1 : 0.5
                  }
                ]}
                onPress={handleStart}
                disabled={!taskName.trim()}
              >
                <Text style={[styles.modalBtnText, { color: '#fff', fontWeight: TYPOGRAPHY.bold }]}>
                  Start
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    marginBottom: SPACING.base
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  title: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold
  },
  historyToggle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold
  },
  runningSection: {
    alignItems: 'center',
    gap: SPACING.md
  },
  runningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.full
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  runningTask: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: TYPOGRAPHY.heavy,
    fontVariant: ['tabular-nums']
  },
  stopBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADII.lg
  },
  stopBtnText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold
  },
  startBtn: {
    paddingVertical: SPACING.md,
    borderRadius: RADII.lg,
    borderWidth: 1,
    alignItems: 'center'
  },
  startBtnText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold
  },
  historySection: {
    marginTop: SPACING.md,
    gap: SPACING.xs
  },
  historyTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    marginBottom: SPACING.xs
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm
  },
  historyTask: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold
  },
  historyDate: {
    fontSize: TYPOGRAPHY.xs
  },
  historyDuration: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    fontVariant: ['tabular-nums']
  },
  deleteBtn: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.bold,
    padding: 4
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['2xl']
  },
  modalBox: {
    width: '100%',
    maxWidth: 380,
    borderRadius: RADII['2xl'],
    borderWidth: 1,
    padding: SPACING.xl,
    gap: SPACING.md
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    textAlign: 'center'
  },
  input: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.base
  },
  pickerLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium
  },
  habitPicker: {
    flexGrow: 0
  },
  habitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.full,
    borderWidth: 1,
    marginRight: SPACING.sm
  },
  habitChipEmoji: {
    fontSize: 16
  },
  habitChipText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    maxWidth: 100
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm
  },
  modalBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADII.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent'
  },
  modalBtnText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold
  }
});
