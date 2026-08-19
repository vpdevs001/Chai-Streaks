import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import type { HabitWithStreak } from '../../db/types';
import HabitCard from './HabitCard';

interface DraggableHabitListProps {
  habits: HabitWithStreak[];
  getHabitStatus: (id: number) => 'completed' | 'skipped' | 'unmarked';
  onComplete: (id: number) => void;
  onSkip: (id: number) => void;
  onPress: (id: number) => void;
  canRecover: (id: number) => boolean;
  onRecover: (id: number) => void;
  onReorder: (habitIds: number[]) => void;
}

export default function DraggableHabitList({
  habits,
  getHabitStatus,
  onComplete,
  onSkip,
  onPress,
  canRecover,
  onRecover,
  onReorder
}: DraggableHabitListProps) {
  const { colors } = useTheme();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [order, setOrder] = useState<number[]>(habits.map((h) => h.id));

  // Sync order when habits change externally
  useState(() => {
    setOrder(habits.map((h) => h.id));
  });

  const handleDragStart = useCallback((id: number) => {
    setActiveId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleDragEnd = useCallback(
    (id: number, newIndex: number) => {
      setActiveId(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const oldIndex = order.indexOf(id);
      if (oldIndex === newIndex) return;

      const newOrder = [...order];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, id);
      setOrder(newOrder);
      onReorder(newOrder);
    },
    [order, onReorder]
  );

  const orderedHabits = order
    .map((id) => habits.find((h) => h.id === id))
    .filter((h): h is HabitWithStreak => !!h);

  return (
    <View style={styles.container}>
      {orderedHabits.map((habit, index) => (
        <DraggableHabitItem
          key={habit.id}
          habit={habit}
          index={index}
          isActive={activeId === habit.id}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          getHabitStatus={getHabitStatus}
          onComplete={onComplete}
          onSkip={onSkip}
          onPress={onPress}
          canRecover={canRecover}
          onRecover={onRecover}
        />
      ))}
    </View>
  );
}

interface DraggableHabitItemProps {
  habit: HabitWithStreak;
  index: number;
  isActive: boolean;
  onDragStart: (id: number) => void;
  onDragEnd: (id: number, newIndex: number) => void;
  getHabitStatus: (id: number) => 'completed' | 'skipped' | 'unmarked';
  onComplete: (id: number) => void;
  onSkip: (id: number) => void;
  onPress: (id: number) => void;
  canRecover: (id: number) => boolean;
  onRecover: (id: number) => void;
}

function DraggableHabitItem({
  habit,
  index,
  isActive,
  onDragStart,
  onDragEnd,
  getHabitStatus,
  onComplete,
  onSkip,
  onPress,
  canRecover,
  onRecover
}: DraggableHabitItemProps) {
  const { colors } = useTheme();
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(onDragStart)(habit.id);
      scale.value = withSpring(1.02);
      zIndex.value = 100;
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      // Calculate new index based on translation
      const itemHeight = 80; // approximate height of a habit card
      const offset = Math.round(event.translationY / itemHeight);
      const newIndex = Math.max(0, index + offset);

      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;

      runOnJS(onDragEnd)(habit.id, newIndex);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    zIndex: zIndex.value,
    shadowOpacity: isActive ? 0.3 : 0,
    shadowRadius: isActive ? 8 : 0,
    shadowOffset: { width: 0, height: 4 },
    elevation: isActive ? 8 : 0
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.itemWrapper, animatedStyle]}>
        <View style={[styles.dragHandle, { backgroundColor: colors.border }]}>
          <Text style={[styles.dragHandleText, { color: colors.textMuted }]}>⠿</Text>
        </View>
        <View style={styles.cardWrapper}>
          <HabitCard
            habit={habit}
            status={getHabitStatus(habit.id)}
            index={index}
            onComplete={() => onComplete(habit.id)}
            onSkip={() => onSkip(habit.id)}
            onPress={() => onPress(habit.id)}
            canRecover={canRecover(habit.id)}
            onRecover={() => onRecover(habit.id)}
          />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm
  },
  itemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs
  },
  dragHandle: {
    width: 24,
    height: 40,
    borderRadius: RADII.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dragHandleText: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.bold
  },
  cardWrapper: {
    flex: 1
  }
});
