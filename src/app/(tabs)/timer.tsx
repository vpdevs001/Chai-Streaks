import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useHabits } from '../../hooks/useHabits';
import { useTimer } from '../../contexts/TimerContext';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import { getDailyTimeTotals, getTimeEntriesForDate } from '../../db';
import { getLast7Days, getLast30Days, todayString } from '../../utils/dateHelpers';
import { toDateString } from '../../db/utils';
import ScreenHeader from '../../components/progress/ScreenHeader';
import HeatmapCalendar from '../../components/progress/HeatmapCalendar';
import TimeBarChart from '../../components/progress/TimeBarChart';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatHoursMinutes(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function TimerScreen() {
  const { colors } = useTheme();
  const db = useSQLiteContext();
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
  const [tab, setTab] = useState<'7' | '30'>('7');
  const [timeBars7, setTimeBars7] = useState<Record<string, number>>({});
  const [timeBars30, setTimeBars30] = useState<Record<string, number>>({});
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateEntries, setSelectedDateEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        refreshEntries(userId);
        loadTimeData();
        loadHeatmapData();
      }
    }, [userId, refreshEntries])
  );

  const loadTimeData = useCallback(async () => {
    if (!userId) return;
    try {
      const [totals7, totals30] = await Promise.all([
        getDailyTimeTotals(db, userId, getLast7Days()),
        getDailyTimeTotals(db, userId, getLast30Days())
      ]);
      setTimeBars7(totals7);
      setTimeBars30(totals30);
    } catch {
      // ignore
    }
  }, [db, userId]);

  const loadHeatmapData = useCallback(async () => {
    if (!userId) return;
    try {
      const days: string[] = [];
      for (let i = 83; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(toDateString(d));
      }

      const data: Record<string, number> = {};
      await Promise.all(
        days.map(async (date) => {
          const entries = await getTimeEntriesForDate(db, userId, date);
          const totalSeconds = entries
            .filter((e) => e.end_time)
            .reduce((sum, e) => sum + e.duration_seconds, 0);
          if (totalSeconds > 0) {
            // Normalize to 0-1 scale (cap at 8 hours = 28800 seconds)
            data[date] = Math.min(1, totalSeconds / 28800);
          }
        })
      );
      setHeatmapData(data);
    } catch {
      // ignore
    }
  }, [db, userId]);

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
    if (userId) {
      refreshEntries(userId);
      loadTimeData();
      loadHeatmapData();
    }
  }, [stopTimer, userId, refreshEntries, loadTimeData, loadHeatmapData]);

  const handleDatePress = useCallback(
    async (date: string) => {
      if (!userId) return;
      setSelectedDate(date);
      try {
        const entries = await getTimeEntriesForDate(db, userId, date);
        setSelectedDateEntries(entries.filter((e) => e.end_time));
      } catch {
        setSelectedDateEntries([]);
      }
    },
    [db, userId]
  );

  const timeBars = tab === '7' ? timeBars7 : timeBars30;
  const timeDays = tab === '7' ? getLast7Days() : getLast30Days();
  const maxTimeSeconds = Math.max(0, ...Object.values(timeBars));
  const totalSeconds = Object.values(timeBars).reduce((a, b) => a + b, 0);

  const selectedHabit = habits.find((h) => h.id === selectedHabitId);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              if (userId) {
                refreshEntries(userId);
                loadTimeData();
                loadHeatmapData();
              }
            }}
            tintColor={colors.primary}
          />
        }
      >
        <ScreenHeader title="Timer" subtitle="Track your time" colors={colors} />

        {/* Active Timer Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
        </View>

        {/* Period Stats */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statsHeader}>
            <Text style={[styles.statsTitle, { color: colors.text }]}>Time Tracked</Text>
            <View style={styles.tabSwitcher}>
              <Pressable
                style={[styles.tabBtn, tab === '7' && { backgroundColor: colors.primary + '22' }]}
                onPress={() => setTab('7')}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: tab === '7' ? colors.primary : colors.textSecondary }
                  ]}
                >
                  7D
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tabBtn, tab === '30' && { backgroundColor: colors.primary + '22' }]}
                onPress={() => setTab('30')}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: tab === '30' ? colors.primary : colors.textSecondary }
                  ]}
                >
                  30D
                </Text>
              </Pressable>
            </View>
          </View>

          <Text style={[styles.totalTime, { color: colors.primary }]}>
            {formatHoursMinutes(totalSeconds)} total
          </Text>

          {totalSeconds > 0 ? (
            <TimeBarChart
              timeBars={timeBars}
              mode={tab}
              days={timeDays}
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                if (date) {
                  handleDatePress(date);
                } else {
                  setSelectedDate(null);
                }
              }}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>⏱️</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No time tracked yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Start a timer to see your daily breakdown
              </Text>
            </View>
          )}
        </View>

        {/* Selected Day Breakdown */}
        {selectedDate && selectedDateEntries.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.breakdownTitle, { color: colors.text }]}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
            {selectedDateEntries.map((entry) => (
              <View key={entry.id} style={[styles.entryRow, { borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.entryTask, { color: colors.text }]}>{entry.task_name}</Text>
                  <Text style={[styles.entryTime, { color: colors.textMuted }]}>
                    {new Date(entry.start_time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}{' '}
                    -{' '}
                    {new Date(entry.end_time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                <Text style={[styles.entryDuration, { color: colors.primary }]}>
                  {formatHoursMinutes(entry.duration_seconds)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Heatmap */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Activity Heatmap</Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
            Last 12 weeks · Tap a day for details
          </Text>
          <HeatmapCalendar data={heatmapData} weeks={12} onDayPress={handleDatePress} />
        </View>

        {/* Recent History */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.historyHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Entries</Text>
            <Pressable onPress={() => setShowHistory(!showHistory)}>
              <Text style={[styles.historyToggle, { color: colors.primary }]}>
                {showHistory ? 'Hide' : 'Show'}
              </Text>
            </Pressable>
          </View>

          {showHistory && (
            <View style={styles.historyList}>
              {recentEntries.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No entries yet. Start a timer!
                </Text>
              ) : (
                recentEntries.slice(0, 10).map((entry) => (
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
                ))
              )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

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
  card: {
    borderRadius: RADII.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    marginBottom: SPACING.base
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
    paddingVertical: SPACING.lg,
    borderRadius: RADII.lg,
    borderWidth: 1,
    alignItems: 'center'
  },
  startBtnText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm
  },
  statsTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold
  },
  tabSwitcher: {
    flexDirection: 'row',
    gap: SPACING.xs
  },
  tabBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.md
  },
  tabText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold
  },
  totalTime: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.heavy,
    marginBottom: SPACING.md
  },
  timeBarsScroll: {
    gap: 4,
    paddingBottom: SPACING.sm
  },
  timeBarCol: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 40,
    height: 120
  },
  timeBarValue: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.semibold,
    marginBottom: 2
  },
  timeBarTrack: {
    width: '100%',
    flex: 1,
    borderRadius: RADII.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end'
  },
  timeBarFill: {
    width: '100%',
    borderTopLeftRadius: RADII.sm,
    borderTopRightRadius: RADII.sm
  },
  timeBarLabel: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.medium,
    marginTop: 4
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm
  },
  emptyEmoji: {
    fontSize: 48
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sm,
    textAlign: 'center'
  },
  breakdownTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: SPACING.md
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm
  },
  entryTask: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold
  },
  entryTime: {
    fontSize: TYPOGRAPHY.xs
  },
  entryDuration: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    fontVariant: ['tabular-nums']
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: 2
  },
  sectionSub: {
    fontSize: TYPOGRAPHY.xs,
    marginBottom: SPACING.md
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm
  },
  historyToggle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold
  },
  historyList: {
    gap: SPACING.xs
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
