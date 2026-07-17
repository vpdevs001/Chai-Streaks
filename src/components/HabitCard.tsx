import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import type { HabitWithStreak } from '../db/types';
import type { HabitStatus } from '../hooks/useHabits';
import { priorityColor } from './HabitFormPriority';

export default function HabitCard({
  habit,
  status = 'unmarked',
  index = 0,
  onComplete,
  onSkip,
  onPress,
  canRecover = false,
  onRecover
}: {
  habit: HabitWithStreak;
  status?: HabitStatus;
  index?: number;
  onComplete: () => void;
  onSkip: () => void;
  onPress: () => void;
  /** True when this habit has a recoverable gap AND the user has a Chai Scroll to spend on it. */
  canRecover?: boolean;
  onRecover?: () => void;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(1);
  const crossScale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }]
  }));

  const crossAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: crossScale.value }]
  }));

  // NOTE: this project has `experiments.reactCompiler: true` enabled (app.json),
  // and Expo SDK 57 ships React Compiler as stable/recommended. React Compiler
  // hoists inline callbacks (like the 3rd arg below) out of their original
  // call site into a module-level `_temp` function *before* the Worklets Babel
  // plugin gets a chance to auto-workletize them by position. The result is a
  // callback that runs on the UI thread but was never converted into a
  // worklet — which throws `Tried to synchronously call a non-worklet
  // function on the UI thread` and crashes the app the instant the spring
  // animation finishes (see reanimated#6826). Adding an explicit 'worklet'
  // directive makes the Worklets plugin workletize the function based on the
  // directive itself, regardless of where the compiler moves it — so this
  // stays safe even with React Compiler on.
  const animateBounce = (target: typeof checkScale) => {
    target.value = withSpring(1.2, { damping: 8, stiffness: 350 }, (finished) => {
      'worklet';
      if (finished) {
        target.value = withSpring(1, { damping: 10, stiffness: 280 });
      }
    });
    scale.value = withSpring(0.95, { damping: 14, stiffness: 300 }, (finished) => {
      'worklet';
      if (finished) {
        scale.value = withSpring(1, { damping: 12, stiffness: 260 });
      }
    });
  };

  const handleComplete = () => {
    animateBounce(checkScale);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete();
  };

  const handleSkip = () => {
    animateBounce(crossScale);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip();
  };

  const handleRecover = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRecover?.();
  };

  const accentColor = habit.color ?? colors.primary;
  const isCompleted = status === 'completed';
  const isSkipped = status === 'skipped';

  // Card background/border based on status
  const cardBg = isCompleted ? colors.cardActive : isSkipped ? colors.danger + '14' : colors.card;

  const cardBorderColor = isCompleted
    ? accentColor
    : isSkipped
      ? colors.danger + '66'
      : colors.border;

  return (
    <Animated.View entering={FadeInDown.duration(380).delay(index * 55)}>
      <Animated.View style={cardStyle}>
        <Pressable
          onPress={onPress}
          style={[
            styles.habitCardOuter,
            {
              backgroundColor: cardBg,
              borderColor: cardBorderColor,
              borderWidth: isCompleted || isSkipped ? 1.5 : StyleSheet.hairlineWidth,
              opacity: isCompleted ? 0.78 : isSkipped ? 0.72 : 1
            }
          ]}
        >
          <View style={styles.habitCardRow}>
            {/* icon + name */}
            <View style={[styles.habitIconWrap, { backgroundColor: accentColor + '22' }]}>
              <Text style={styles.habitIcon}>{habit.icon ?? '✨'}</Text>
            </View>
            <View style={styles.habitMeta}>
              <Text
                style={[
                  styles.habitTitle,
                  { color: colors.text },
                  isCompleted && styles.habitTitleDone,
                  isSkipped && { color: colors.textSecondary }
                ]}
                numberOfLines={1}
              >
                {habit.title}
              </Text>
              <View style={styles.habitSubRow}>
                {isSkipped && (
                  <Text style={[styles.statusBadge, { color: colors.danger }]}>✕ Skipped</Text>
                )}
                {!isSkipped && habit.current_streak > 0 && (
                  <Text style={[styles.streakBadge, { color: '#EF4444' }]}>
                    🔥 {habit.current_streak}d
                  </Text>
                )}
                {habit.priority !== 'medium' && (
                  <Text
                    style={[styles.priorityBadge, { color: priorityColor(habit.priority, colors) }]}
                  >
                    {habit.priority === 'high' ? '⬆ High' : '⬇ Low'}
                  </Text>
                )}
                <Text style={[styles.freqTag, { color: colors.textMuted }]}>
                  {habit.frequency_type}
                </Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.actions}>
              {/* Check / Complete button */}
              <Pressable
                onPress={handleComplete}
                style={({ pressed }) => [
                  styles.actionBtn,
                  {
                    backgroundColor: isCompleted ? accentColor : colors.inputBg,
                    borderColor: isCompleted ? accentColor : colors.border,
                    opacity: pressed ? 0.75 : 1
                  }
                ]}
                hitSlop={6}
              >
                <Animated.Text
                  style={[
                    styles.actionIcon,
                    { color: isCompleted ? '#fff' : colors.textMuted },
                    checkAnimStyle
                  ]}
                >
                  ✓
                </Animated.Text>
              </Pressable>

              {/* Cross / Skip button — hidden when completed */}
              {!isCompleted && (
                <Pressable
                  onPress={handleSkip}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    {
                      backgroundColor: isSkipped ? colors.danger : colors.inputBg,
                      borderColor: isSkipped ? colors.danger : colors.border,
                      opacity: pressed ? 0.75 : 1
                    }
                  ]}
                  hitSlop={6}
                >
                  <Animated.Text
                    style={[
                      styles.actionIcon,
                      { color: isSkipped ? '#fff' : colors.textMuted },
                      crossAnimStyle
                    ]}
                  >
                    ✕
                  </Animated.Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Chai Scroll recovery — only shown when yesterday was missed and a scroll is available */}
          {canRecover && (
            <Pressable
              onPress={handleRecover}
              style={({ pressed }) => [
                styles.recoverBanner,
                {
                  backgroundColor: colors.warning + '1A',
                  borderColor: colors.warning + '55',
                  opacity: pressed ? 0.7 : 1
                }
              ]}
              hitSlop={4}
            >
              <Text style={[styles.recoverText, { color: colors.warning }]}>
                📜 Missed yesterday — tap to recover your streak with a Chai Scroll
              </Text>
            </Pressable>
          )}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  habitCardOuter: {
    borderRadius: RADII.lg,
    padding: SPACING.md,
    gap: SPACING.sm
  },

  habitCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md
  },

  habitIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center'
  },

  habitIcon: {
    fontSize: 22
  },

  habitMeta: {
    flex: 1,
    gap: 3
  },

  habitTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold
  },

  habitTitleDone: {
    textDecorationLine: 'line-through'
  },

  habitSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm
  },

  statusBadge: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold
  },

  streakBadge: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold
  },

  priorityBadge: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold
  },

  freqTag: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
    textTransform: 'capitalize'
  },

  actions: {
    flexDirection: 'row',
    gap: SPACING.xs
  },

  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: RADII.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },

  actionIcon: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.bold
  },

  recoverBanner: {
    borderRadius: RADII.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm
  },

  recoverText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    textAlign: 'center'
  }
});
