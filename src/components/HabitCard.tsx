import React from 'react';
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

export default function HabitCard({
  habit,
  status = 'unmarked',
  index = 0,
  onComplete,
  onSkip,
  onPress
}: {
  habit: HabitWithStreak;
  status?: HabitStatus;
  index?: number;
  onComplete: () => void;
  onSkip: () => void;
  onPress: () => void;
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

  const animateBounce = (target: typeof checkScale) => {
    target.value = withSpring(1.2, { damping: 8, stiffness: 350 }, () => {
      target.value = withSpring(1, { damping: 10, stiffness: 280 });
    });
    scale.value = withSpring(0.95, { damping: 14, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 260 });
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
            styles.habitCard,
            {
              backgroundColor: cardBg,
              borderColor: cardBorderColor,
              borderWidth: isCompleted || isSkipped ? 1.5 : StyleSheet.hairlineWidth,
              opacity: isCompleted ? 0.78 : isSkipped ? 0.72 : 1
            }
          ]}
        >
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
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADII.lg,
    padding: SPACING.md,
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
  }
});
