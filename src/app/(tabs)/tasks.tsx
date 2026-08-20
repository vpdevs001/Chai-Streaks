import { useState, useCallback, useEffect, useMemo } from 'react';
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
  RefreshControl,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useHabits } from '../../hooks/useHabits';
import { SPACING, RADII, TYPOGRAPHY, FONTS } from '../../constants';
import { createDailyTask, getDailyTasksForDate, toggleDailyTask, deleteDailyTask } from '../../db';
import { toDateString } from '../../db/utils';
import { todayString, formatDate } from '../../utils/dateHelpers';
import ScreenHeader from '../../components/progress/ScreenHeader';
import type { DailyTask } from '../../db/types';

export default function TasksScreen() {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const { userId, habits } = useHabits();

  const [selectedDate, setSelectedDate] = useState<string>(todayString());
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedHabitFilter, setSelectedHabitFilter] = useState<number | null>(null);

  // Add Task Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskHabitId, setNewTaskHabitId] = useState<number | null>(null);

  const loadTasks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const dateTasks = await getDailyTasksForDate(db, userId, selectedDate);
      setTasks(dateTasks);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [db, userId, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  const handleDateChange = (daysOffset: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const curr = new Date(selectedDate + 'T00:00:00');
    curr.setDate(curr.getDate() + daysOffset);
    setSelectedDate(toDateString(curr));
  };

  const handleSelectPredefinedDate = (type: 'yesterday' | 'today' | 'tomorrow') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const d = new Date();
    if (type === 'yesterday') d.setDate(d.getDate() - 1);
    if (type === 'tomorrow') d.setDate(d.getDate() + 1);
    setSelectedDate(toDateString(d));
  };

  const handleToggle = async (taskId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await toggleDailyTask(db, taskId);
      await loadTasks();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (taskId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await deleteDailyTask(db, taskId);
      await loadTasks();
    } catch {
      // ignore
    }
  };

  const handleAddTask = async () => {
    if (!userId || !newTaskTitle.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await createDailyTask(db, {
        user_id: userId,
        title: newTaskTitle.trim(),
        date: selectedDate,
        habit_id: newTaskHabitId ?? undefined
      });
      setNewTaskTitle('');
      setNewTaskHabitId(null);
      setShowAddModal(false);
      await loadTasks();
    } catch {
      // ignore
    }
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter === 'pending' && t.is_completed === 1) return false;
      if (statusFilter === 'completed' && t.is_completed !== 1) return false;
      if (selectedHabitFilter !== null && t.habit_id !== selectedHabitFilter) return false;
      return true;
    });
  }, [tasks, statusFilter, selectedHabitFilter]);

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.is_completed === 1).length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isToday = selectedDate === todayString();
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const formattedDateTitle = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTasks} tintColor={colors.primary} />
        }
      >
        <ScreenHeader
          title="Daily Tasks"
          subtitle="Organize and conquer your daily goals"
          colors={colors}
          rightAction={
            <Pressable
              style={({ pressed }) => [
                styles.addHeaderBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.85 : 1
                }
              ]}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addHeaderBtnText}>+ Add Task</Text>
            </Pressable>
          }
        />

        {/* Date Selector Navigation Bar */}
        <View
          style={[styles.dateNavCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.quickDateRow}>
            <Pressable
              style={[
                styles.quickDateBtn,
                selectedDate === toDateString(new Date(Date.now() - 86400000)) && {
                  backgroundColor: colors.primary + '22',
                  borderColor: colors.primary
                }
              ]}
              onPress={() => handleSelectPredefinedDate('yesterday')}
            >
              <Text
                style={[
                  styles.quickDateText,
                  {
                    color:
                      selectedDate === toDateString(new Date(Date.now() - 86400000))
                        ? colors.primary
                        : colors.textSecondary
                  }
                ]}
              >
                Yesterday
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.quickDateBtn,
                isToday && {
                  backgroundColor: colors.primary + '22',
                  borderColor: colors.primary
                }
              ]}
              onPress={() => handleSelectPredefinedDate('today')}
            >
              <Text
                style={[
                  styles.quickDateText,
                  { color: isToday ? colors.primary : colors.textSecondary }
                ]}
              >
                Today
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.quickDateBtn,
                selectedDate === toDateString(new Date(Date.now() + 86400000)) && {
                  backgroundColor: colors.primary + '22',
                  borderColor: colors.primary
                }
              ]}
              onPress={() => handleSelectPredefinedDate('tomorrow')}
            >
              <Text
                style={[
                  styles.quickDateText,
                  {
                    color:
                      selectedDate === toDateString(new Date(Date.now() + 86400000))
                        ? colors.primary
                        : colors.textSecondary
                  }
                ]}
              >
                Tomorrow
              </Text>
            </Pressable>
          </View>

          <View style={styles.dateSelectorRow}>
            <Pressable
              style={({ pressed }) => [
                styles.arrowBtn,
                { backgroundColor: colors.inputBg, borderColor: colors.border },
                pressed && { opacity: 0.7 }
              ]}
              onPress={() => handleDateChange(-1)}
            >
              <Text style={[styles.arrowText, { color: colors.text }]}>◀</Text>
            </Pressable>

            <View style={styles.dateTitleBlock}>
              <Text style={[styles.dateTitle, { color: colors.text }]}>{formattedDateTitle}</Text>
              {isToday && (
                <Text style={[styles.todayTag, { color: colors.primary }]}>Active Day</Text>
              )}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.arrowBtn,
                { backgroundColor: colors.inputBg, borderColor: colors.border },
                pressed && { opacity: 0.7 }
              ]}
              onPress={() => handleDateChange(1)}
            >
              <Text style={[styles.arrowText, { color: colors.text }]}>▶</Text>
            </Pressable>
          </View>
        </View>

        {/* Progress Summary Card */}
        <View
          style={[
            styles.progressCard,
            { backgroundColor: colors.card, borderColor: colors.border }
          ]}
        >
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.progressCardTitle, { color: colors.text }]}>
                {totalCount === 0
                  ? 'No tasks scheduled'
                  : completedCount === totalCount
                    ? '🎉 All tasks completed!'
                    : `${completedCount} of ${totalCount} completed`}
              </Text>
              <Text style={[styles.progressCardSub, { color: colors.textSecondary }]}>
                {totalCount === 0
                  ? 'Tap "+ Add Task" to set up your day'
                  : `${progressPct}% completion rate for this date`}
              </Text>
            </View>
            <Text style={[styles.progressCardPct, { color: colors.primary }]}>{progressPct}%</Text>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: colors.border + '55' }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor:
                    completedCount === totalCount && totalCount > 0
                      ? colors.success
                      : colors.primary,
                  width: `${progressPct}%`
                }
              ]}
            />
          </View>
        </View>

        {/* Status Filters */}
        <View style={styles.filtersRow}>
          <Pressable
            style={[
              styles.filterBtn,
              statusFilter === 'all' && {
                backgroundColor: colors.primary + '22',
                borderColor: colors.primary
              },
              { borderColor: colors.border }
            ]}
            onPress={() => setStatusFilter('all')}
          >
            <Text
              style={[
                styles.filterBtnText,
                { color: statusFilter === 'all' ? colors.primary : colors.textSecondary }
              ]}
            >
              All ({tasks.length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterBtn,
              statusFilter === 'pending' && {
                backgroundColor: colors.primary + '22',
                borderColor: colors.primary
              },
              { borderColor: colors.border }
            ]}
            onPress={() => setStatusFilter('pending')}
          >
            <Text
              style={[
                styles.filterBtnText,
                { color: statusFilter === 'pending' ? colors.primary : colors.textSecondary }
              ]}
            >
              Pending ({tasks.filter((t) => t.is_completed !== 1).length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterBtn,
              statusFilter === 'completed' && {
                backgroundColor: colors.primary + '22',
                borderColor: colors.primary
              },
              { borderColor: colors.border }
            ]}
            onPress={() => setStatusFilter('completed')}
          >
            <Text
              style={[
                styles.filterBtnText,
                { color: statusFilter === 'completed' ? colors.primary : colors.textSecondary }
              ]}
            >
              Completed ({completedCount})
            </Text>
          </Pressable>
        </View>

        {/* Habit Link Filter Chips */}
        {habits.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.habitChipsScroll}
          >
            <Pressable
              style={[
                styles.habitFilterChip,
                selectedHabitFilter === null
                  ? { backgroundColor: colors.primary + '22', borderColor: colors.primary }
                  : { backgroundColor: colors.card, borderColor: colors.border }
              ]}
              onPress={() => setSelectedHabitFilter(null)}
            >
              <Text
                style={[
                  styles.habitFilterText,
                  {
                    color: selectedHabitFilter === null ? colors.primary : colors.textSecondary
                  }
                ]}
              >
                All Habits
              </Text>
            </Pressable>

            {habits.map((h) => {
              const isSelected = selectedHabitFilter === h.id;
              return (
                <Pressable
                  key={h.id}
                  style={[
                    styles.habitFilterChip,
                    isSelected
                      ? { backgroundColor: colors.primary + '22', borderColor: colors.primary }
                      : { backgroundColor: colors.card, borderColor: colors.border }
                  ]}
                  onPress={() => setSelectedHabitFilter(isSelected ? null : h.id)}
                >
                  <Text style={styles.habitChipIcon}>{h.icon ?? '✨'}</Text>
                  <Text
                    style={[
                      styles.habitFilterText,
                      { color: isSelected ? colors.primary : colors.textSecondary }
                    ]}
                    numberOfLines={1}
                  >
                    {h.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Task List */}
        {loading ? (
          <View style={{ height: 160, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : filteredTasks.length === 0 ? (
          <View
            style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No tasks found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {tasks.length === 0
                ? 'You have no tasks scheduled for this day.'
                : 'No tasks matching your current filters.'}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.emptyActionBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }
              ]}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyActionText}>+ Add New Task</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.tasksContainer}>
            {filteredTasks.map((task) => {
              const linkedHabit = habits.find((h) => h.id === task.habit_id);
              const isDone = task.is_completed === 1;

              return (
                <View
                  key={task.id}
                  style={[
                    styles.taskCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: isDone ? colors.success + '44' : colors.border
                    }
                  ]}
                >
                  <Pressable
                    style={[
                      styles.taskCheckbox,
                      {
                        backgroundColor: isDone ? colors.success : colors.inputBg,
                        borderColor: isDone ? colors.success : colors.border
                      }
                    ]}
                    onPress={() => handleToggle(task.id)}
                  >
                    {isDone && <Text style={styles.checkmarkText}>✓</Text>}
                  </Pressable>

                  <View style={styles.taskInfo}>
                    <Text
                      style={[
                        styles.taskTitleText,
                        { color: colors.text },
                        isDone && styles.taskTitleDone
                      ]}
                      numberOfLines={2}
                    >
                      {task.title}
                    </Text>

                    <View style={styles.taskMetaRow}>
                      {linkedHabit && (
                        <View
                          style={[
                            styles.linkedHabitBadge,
                            {
                              backgroundColor: (linkedHabit.color ?? colors.primary) + '1A',
                              borderColor: (linkedHabit.color ?? colors.primary) + '44'
                            }
                          ]}
                        >
                          <Text style={styles.linkedHabitEmoji}>{linkedHabit.icon ?? '✨'}</Text>
                          <Text
                            style={[
                              styles.linkedHabitTitle,
                              { color: linkedHabit.color ?? colors.primary }
                            ]}
                            numberOfLines={1}
                          >
                            {linkedHabit.title}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.taskDateTag, { color: colors.textMuted }]}>
                        {selectedDate}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={({ pressed }) => [styles.deleteTaskBtn, pressed && { opacity: 0.6 }]}
                    onPress={() => handleDelete(task.id)}
                    hitSlop={10}
                  >
                    <Text style={[styles.deleteTaskIcon, { color: colors.danger }]}>✕</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Add Task Modal */}
      <Modal transparent visible={showAddModal} animationType="fade">
        <Pressable
          style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
          onPress={() => setShowAddModal(false)}
        >
          <View
            style={[
              styles.modalBox,
              { backgroundColor: colors.surface, borderColor: colors.border }
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Daily Task</Text>

            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }
              ]}
              placeholder="What do you want to accomplish?"
              placeholderTextColor={colors.textMuted}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
              onSubmitEditing={handleAddTask}
            />

            <Text style={[styles.pickerHeader, { color: colors.textSecondary }]}>
              Link to a habit (Optional)
            </Text>

            <FlatList
              data={habits}
              keyExtractor={(h) => String(h.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.modalHabitPicker}
              renderItem={({ item: habit }) => {
                const isSelected = newTaskHabitId === habit.id;
                return (
                  <Pressable
                    style={[
                      styles.modalHabitChip,
                      {
                        backgroundColor: isSelected ? colors.primary + '33' : colors.inputBg,
                        borderColor: isSelected ? colors.primary : colors.border
                      }
                    ]}
                    onPress={() => setNewTaskHabitId(isSelected ? null : habit.id)}
                  >
                    <Text style={styles.modalHabitEmoji}>{habit.icon ?? '✨'}</Text>
                    <Text
                      style={[
                        styles.modalHabitText,
                        { color: isSelected ? colors.primary : colors.textSecondary }
                      ]}
                      numberOfLines={1}
                    >
                      {habit.title}
                    </Text>
                  </Pressable>
                );
              }}
            />

            <View style={styles.modalActionsRow}>
              <Pressable
                style={[
                  styles.modalBtn,
                  { backgroundColor: colors.inputBg, borderColor: colors.border }
                ]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewTaskTitle('');
                  setNewTaskHabitId(null);
                }}
              >
                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor: newTaskTitle.trim() ? colors.primary : colors.border,
                    opacity: newTaskTitle.trim() ? 1 : 0.5
                  }
                ]}
                onPress={handleAddTask}
                disabled={!newTaskTitle.trim()}
              >
                <Text style={[styles.modalBtnText, { color: '#fff', fontWeight: TYPOGRAPHY.bold }]}>
                  Save Task
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
  addHeaderBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADII.full
  },
  addHeaderBtnText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold
  },
  dateNavCard: {
    borderRadius: RADII.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
    marginBottom: SPACING.base,
    gap: SPACING.md
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: SPACING.xs
  },
  quickDateBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickDateText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold
  },
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  arrowBtn: {
    width: 38,
    height: 38,
    borderRadius: RADII.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  arrowText: {
    fontSize: 14
  },
  dateTitleBlock: {
    alignItems: 'center'
  },
  dateTitle: {
    fontFamily: FONTS.wavy,
    fontSize: 17,
    letterSpacing: 0.2
  },
  todayTag: {
    fontFamily: FONTS.sketch,
    fontSize: 12,
    marginTop: 1
  },
  progressCard: {
    borderRadius: RADII.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
    gap: SPACING.md
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  progressCardTitle: {
    fontFamily: FONTS.wavy,
    fontSize: 16
  },
  progressCardSub: {
    fontFamily: FONTS.handwritten,
    fontSize: 13,
    marginTop: 2
  },
  progressCardPct: {
    fontFamily: FONTS.sketch,
    fontSize: 26
  },
  progressTrack: {
    height: 8,
    borderRadius: RADII.full,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: RADII.full
  },
  filtersRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADII.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterBtnText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold
  },
  habitChipsScroll: {
    gap: SPACING.xs,
    marginBottom: SPACING.base,
    paddingBottom: 2
  },
  habitFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADII.full,
    borderWidth: 1
  },
  habitChipIcon: {
    fontSize: 14
  },
  habitFilterText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold
  },
  emptyCard: {
    borderRadius: RADII.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING['2xl'],
    alignItems: 'center',
    gap: SPACING.sm
  },
  emptyEmoji: {
    fontSize: 42
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.xs,
    textAlign: 'center',
    maxWidth: 240
  },
  emptyActionBtn: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADII.lg
  },
  emptyActionText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold
  },
  tasksContainer: {
    gap: SPACING.sm
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.md
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: RADII.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: TYPOGRAPHY.bold
  },
  taskInfo: {
    flex: 1,
    gap: 4
  },
  taskTitleText: {
    fontFamily: FONTS.handwritten,
    fontSize: 16,
    lineHeight: 20
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    opacity: 0.6
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs
  },
  linkedHabitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADII.sm,
    borderWidth: 1
  },
  linkedHabitEmoji: {
    fontSize: 10
  },
  linkedHabitTitle: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold,
    maxWidth: 110
  },
  taskDateTag: {
    fontSize: 10
  },
  deleteTaskBtn: {
    padding: 6
  },
  deleteTaskIcon: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.bold
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
  modalInput: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.base
  },
  pickerHeader: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium
  },
  modalHabitPicker: {
    flexGrow: 0
  },
  modalHabitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.full,
    borderWidth: 1,
    marginRight: SPACING.sm
  },
  modalHabitEmoji: {
    fontSize: 16
  },
  modalHabitText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    maxWidth: 120
  },
  modalActionsRow: {
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
