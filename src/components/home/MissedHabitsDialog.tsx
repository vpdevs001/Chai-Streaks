import { useEffect, useRef } from 'react';
import { Modal, Animated, StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import type { HabitWithStreak } from '../../db/types';

export default function MissedHabitsDialog({
  visible,
  habits,
  markedIds,
  onMark,
  onDismiss
}: {
  visible: boolean;
  habits: HabitWithStreak[];
  /** IDs of habits already marked in this session — shown greyed-out. */
  markedIds: Set<number>;
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

  const unmarkedCount = habits.filter((h) => !markedIds.has(h.id)).length;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onDismiss}>
        {/* Inner Pressable stops taps inside the dialog box from propagating
            to the backdrop and accidentally dismissing the modal. */}
        <Pressable onPress={(e) => e.stopPropagation()}>
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
              {unmarkedCount > 0
                ? `You have ${unmarkedCount} unmarked habit${unmarkedCount !== 1 ? 's' : ''} from ${yesterdayLabel}. How did it go?`
                : `All done! Great job catching up on ${yesterdayLabel}.`}
            </Text>

            <ScrollView style={styles.habitList} showsVerticalScrollIndicator={false}>
              {habits.map((habit) => {
                const isMarked = markedIds.has(habit.id);
                return (
                  <View
                    key={habit.id}
                    style={[
                      styles.habitRow,
                      {
                        backgroundColor: isMarked ? colors.card + '88' : colors.card,
                        borderColor: colors.border,
                        opacity: isMarked ? 0.55 : 1
                      }
                    ]}
                  >
                    <View style={styles.habitInfo}>
                      <Text style={styles.habitEmoji}>{habit.icon ?? '✨'}</Text>
                      <Text
                        style={[
                          styles.habitName,
                          { color: colors.text },
                          isMarked && styles.habitNameDone
                        ]}
                        numberOfLines={1}
                      >
                        {habit.title}
                      </Text>
                    </View>
                    {isMarked ? (
                      <View style={[styles.doneBadge, { backgroundColor: colors.success + '22' }]}>
                        <Text style={[styles.doneBadgeText, { color: colors.success }]}>✓</Text>
                      </View>
                    ) : (
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
                          <Text style={[styles.actionText, { color: colors.danger }]}>
                            ✕ Failed
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
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
  habitNameDone: {
    textDecorationLine: 'line-through'
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
  doneBadge: {
    width: 28,
    height: 28,
    borderRadius: RADII.full,
    alignItems: 'center',
    justifyContent: 'center'
  },
  doneBadgeText: {
    fontSize: 16,
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
