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

export default function HabitCard({
  habit,
  completed,
  index = 0,
  onToggle,
  onPress
}: {
  habit: HabitWithStreak;
  completed: boolean;
  index?: number;
  onToggle: () => void;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(completed ? 1 : 0.85);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }]
  }));

  const handleToggle = () => {
    scale.value = withSpring(0.93, { damping: 14, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 260 });
    });
    checkScale.value = withSpring(1.15, { damping: 8, stiffness: 300 }, () => {
      checkScale.value = withSpring(1, { damping: 10, stiffness: 260 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  const accentColor = habit.color ?? colors.primary;

  return (
    <Animated.View entering={FadeInDown.duration(380).delay(index * 55)}>
      <Animated.View style={cardStyle}>
        <Pressable
          onPress={onPress}
          style={[
            styles.habitCard,
            {
              backgroundColor: completed ? colors.cardActive : colors.card,
              borderColor: completed ? accentColor : colors.border,
              borderWidth: completed ? 1.5 : StyleSheet.hairlineWidth,
              opacity: completed ? 0.75 : 1
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
                completed && styles.habitTitleDone
              ]}
              numberOfLines={1}
            >
              {habit.title}
            </Text>
            <View style={styles.habitSubRow}>
              {habit.current_streak > 0 && (
                <Text style={[styles.streakBadge, { color: '#EF4444' }]}>
                  🔥 {habit.current_streak}d
                </Text>
              )}
              <Text style={[styles.freqTag, { color: colors.textMuted }]}>
                {habit.frequency_type}
              </Text>
            </View>
          </View>

          {/* done button */}
          <Pressable
            onPress={handleToggle}
            style={({ pressed }) => [
              styles.checkBtn,
              {
                backgroundColor: completed ? accentColor : colors.inputBg,
                borderColor: completed ? accentColor : colors.border,
                opacity: pressed ? 0.8 : 1
              }
            ]}
            hitSlop={8}
          >
            <Animated.Text
              style={[
                styles.checkIcon,
                { color: completed ? '#fff' : colors.textMuted },
                checkStyle
              ]}
            >
              {completed ? '✓' : '○'}
            </Animated.Text>
          </Pressable>
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

  streakBadge: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold
  },

  freqTag: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
    textTransform: 'capitalize'
  },

  checkBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },

  checkIcon: {
    fontSize: 16,
    fontWeight: TYPOGRAPHY.bold
  }
});
