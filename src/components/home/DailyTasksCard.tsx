import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  Keyboard
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useHabits } from '../../hooks/useHabits';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import {
  createDailyTask,
  getTodayTasks,
  toggleDailyTask,
  deleteDailyTask
} from '../../db';
import { todayString } from '../../utils/dateHelpers';
import type { DailyTask } from '../../db/types';

export default function DailyTasksCard() {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const { userId, habits } = useHabits();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!userId) return;
    try {
      const todayTasks = await getTodayTasks(db, userId);
      setTasks(todayTasks);
    } catch {
      // ignore
    }
  }, [db, userId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleAddTask = useCallback(async () => {
    if (!userId || !newTaskTitle.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await createDailyTask(db, {
        user_id: userId,
        title: newTaskTitle.trim(),
        date: todayString(),
        habit_id: selectedHabitId ?? undefined
      });
      setNewTaskTitle('');
      setSelectedHabitId(null);
      setShowInput(false);
      Keyboard.dismiss();
      await loadTasks();
    } catch {
      // ignore
    }
  }, [db, userId, newTaskTitle, selectedHabitId, loadTasks]);

  const handleToggleTask = useCallback(
    async (taskId: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        await toggleDailyTask(db, taskId);
        await loadTasks();
      } catch {
        // ignore
      }
    },
    [db, loadTasks]
  );

  const handleDeleteTask = useCallback(
    async (taskId: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        await deleteDailyTask(db, taskId);
        await loadTasks();
      } catch {
        // ignore
      }
    },
    [db, loadTasks]
  );

  const completedCount = tasks.filter((t) => t.is_completed === 1).length;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>📋 Today's Tasks</Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {completedCount}/{tasks.length}
        </Text>
      </View>

      {tasks.length > 0 && (
        <View style={styles.taskList}>
          {tasks.map((task) => (
            <View key={task.id} style={[styles.taskRow, { borderColor: colors.border }]}>
              <Pressable
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: task.is_completed ? colors.success : colors.inputBg,
                    borderColor: task.is_completed ? colors.success : colors.border
                  }
                ]}
                onPress={() => handleToggleTask(task.id)}
              >
                {task.is_completed === 1 && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
              <Text
                style={[
                  styles.taskTitle,
                  { color: colors.text },
                  task.is_completed === 1 && styles.taskDone
                ]}
                numberOfLines={1}
              >
                {task.title}
              </Text>
              {task.habit_id && (
                <Text style={[styles.habitTag, { color: colors.textMuted }]}>
                  {habits.find((h) => h.id === task.habit_id)?.icon ?? '🔗'}
                </Text>
              )}
              <Pressable onPress={() => handleDeleteTask(task.id)} hitSlop={8}>
                <Text style={[styles.deleteBtn, { color: colors.danger }]}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {showInput ? (
        <View style={styles.inputSection}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }
            ]}
            placeholder="Add a task..."
            placeholderTextColor={colors.textMuted}
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            autoFocus
            onSubmitEditing={handleAddTask}
          />
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
              </Pressable>
            )}
          />
          <View style={styles.inputActions}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.inputBg }]}
              onPress={() => {
                setShowInput(false);
                setNewTaskTitle('');
                setSelectedHabitId(null);
              }}
            >
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.actionBtn,
                {
                  backgroundColor: newTaskTitle.trim() ? colors.primary : colors.border,
                  opacity: newTaskTitle.trim() ? 1 : 0.5
                }
              ]}
              onPress={handleAddTask}
              disabled={!newTaskTitle.trim()}
            >
              <Text style={[styles.actionText, { color: '#fff' }]}>Add</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            {
              backgroundColor: colors.primary + '18',
              borderColor: colors.primary + '44',
              opacity: pressed ? 0.7 : 1
            }
          ]}
          onPress={() => setShowInput(true)}
        >
          <Text style={[styles.addBtnText, { color: colors.primary }]}>+ Add Task</Text>
        </Pressable>
      )}
    </View>
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
  count: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold
  },
  taskList: {
    gap: SPACING.xs,
    marginBottom: SPACING.md
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: RADII.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: TYPOGRAPHY.bold
  },
  taskTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.medium
  },
  taskDone: {
    textDecorationLine: 'line-through',
    opacity: 0.6
  },
  habitTag: {
    fontSize: 14
  },
  deleteBtn: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.bold,
    padding: 4
  },
  inputSection: {
    gap: SPACING.sm
  },
  input: {
    borderRadius: RADII.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.base
  },
  habitPicker: {
    flexGrow: 0
  },
  habitChip: {
    width: 36,
    height: 36,
    borderRadius: RADII.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm
  },
  habitChipEmoji: {
    fontSize: 16
  },
  inputActions: {
    flexDirection: 'row',
    gap: SPACING.sm
  },
  actionBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.lg,
    alignItems: 'center'
  },
  actionText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold
  },
  addBtn: {
    paddingVertical: SPACING.md,
    borderRadius: RADII.lg,
    borderWidth: 1,
    alignItems: 'center'
  },
  addBtnText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold
  }
});
