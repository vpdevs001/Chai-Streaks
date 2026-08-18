import { useEffect, useRef } from 'react';
import { Modal, Animated, StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import type { HabitWithStreak } from '../../db/types';

export default function MissedHabitsDialog({
  visible,
  habits,
  onMark,
  onDismiss
}: {
  visible: boolean;
  habits: HabitWithStreak[];
  onMark: (habitId: number, status: 'completed' | 'skipped') => void;
  onDismiss: () => void;
}) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 260 }),
        Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true })
      ]).start();
    } else {
      scale.setValue(0.88);
      opacity.setValue(0);
    }
  }, [visible, scale, opacity]);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayLabel = yesterday.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onDismiss}>
        <Animated.View
          style={[
            styles.box,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              transform: [{ scale }],
              opacity
            }
          ]}
        >
          <View
            style={[
              styles.iconRing,
              { backgroundColor: colors.warning + '18', borderColor: colors.warning + '44' }
            ]}
          >
            <Text style={styles.icon}>📋</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Missed Habits</Text>
          <Text style={[styles.msg, { color: colors.textSecondary }]}>
            You have {habits.length} unmarked habit{habits.length !== 1 ? 's' : ''} from{' '}
            {yesterdayLabel}. How did it go?
          </Text>

          <ScrollView style={styles.habitList} showsVerticalScrollIndicator={false}>
            {habits.map((habit) => (
              <View
                key={habit.id}
                style={[styles.habitRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.habitInfo}>
                  <Text style={styles.habitEmoji}>{habit.icon ?? '✨'}</Text>
                  <Text style={[styles.habitName, { color: colors.text }]} numberOfLines={1}>
                    {habit.title}
                  </Text>
                </View>
                <View style={styles.habitActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      {
                        backgroundColor: colors.success + '22',
                        borderColor: colors.success + '44',
                        opacity: pressed ? 0.7 : 1
                      }
                    ]}
                    onPress={() => onMark(habit.id, 'completed')}
                  >
                    <Text style={[styles.actionText, { color: colors.success }]}>✓ Done</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      {
                        backgroundColor: colors.danger + '22',
                        borderColor: colors.danger + '44',
                        opacity: pressed ? 0.7 : 1
                      }
                    ]}
                    onPress={() => onMark(habit.id, 'skipped')}
                  >
                    <Text style={[styles.actionText, { color: colors.danger }]}>✕ Failed</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable
            style={({ pressed }) => [
              styles.dismissBtn,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                opacity: pressed ? 0.75 : 1
              }
            ]}
            onPress={onDismiss}
          >
            <Text style={[styles.dismissText, { color: colors.textSecondary }]}>
              Dismiss (leave unmarked)
            </Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['2xl']
  },
  box: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    borderRadius: RADII['2xl'],
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md
  },
  iconRing: {
    width: 56,
    height: 56,
    borderRadius: RADII.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    fontSize: 24
  },
  title: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    textAlign: 'center'
  },
  msg: {
    fontSize: TYPOGRAPHY.base,
    textAlign: 'center',
    lineHeight: 22
  },
  habitList: {
    width: '100%',
    maxHeight: 300
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADII.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: SPACING.sm
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1
  },
  habitEmoji: {
    fontSize: 22
  },
  habitName: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    flex: 1
  },
  habitActions: {
    flexDirection: 'row',
    gap: SPACING.xs
  },
  actionBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.md,
    borderWidth: 1
  },
  actionText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold
  },
  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth
  },
  dismissBtn: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADII.lg,
    alignItems: 'center',
    borderWidth: 1
  },
  dismissText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold
  }
});
