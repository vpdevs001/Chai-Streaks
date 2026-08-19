import { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SharedValue
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { SPACING } from '../../constants';
import type { HabitWithStreak } from '../../db/types';
import HabitCard from './HabitCard';

const DEFAULT_ITEM_HEIGHT = 88;
const ITEM_GAP = SPACING.sm;

interface DraggableHabitListProps {
  habits: HabitWithStreak[];
  getHabitStatus: (id: number) => 'completed' | 'skipped' | 'unmarked';
  onComplete: (id: number) => void;
  onSkip: (id: number) => void;
  onPress: (id: number) => void;
  canRecover: (id: number) => boolean;
  onRecover: (id: number) => void;
  onReorder: (habitIds: number[]) => void;
  onDragStateChange?: (isDragging: boolean) => void;
}

export default function DraggableHabitList({
  habits,
  getHabitStatus,
  onComplete,
  onSkip,
  onPress,
  canRecover,
  onRecover,
  onReorder,
  onDragStateChange
}: DraggableHabitListProps) {
  const [order, setOrder] = useState<number[]>(() => habits.map((h) => h.id));
  const [itemHeight, setItemHeight] = useState(DEFAULT_ITEM_HEIGHT + ITEM_GAP);

  const activeId = useSharedValue<number>(-1);
  const activeStartIndex = useSharedValue<number>(-1);
  const hoverIndex = useSharedValue<number>(-1);
  const draggedTranslateY = useSharedValue<number>(0);

  // Sync order when habits change from external operations (e.g. create/delete)
  useEffect(() => {
    const habitIds = habits.map((h) => h.id);
    setOrder((prev) => {
      if (
        prev.length === habitIds.length &&
        prev.every((id, i) => id === habitIds[i])
      ) {
        return prev;
      }
      return habitIds;
    });
  }, [habits]);

  const handleDragStart = useCallback(
    (id: number) => {
      onDragStateChange?.(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    },
    [onDragStateChange]
  );

  const handleHoverChange = useCallback(() => {
    Haptics.selectionAsync();
  }, []);

  const handleDragEnd = useCallback(
    (id: number, fromIndex: number, toIndex: number) => {
      onDragStateChange?.(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;

      const newOrder = [...order];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      setOrder(newOrder);
      onReorder(newOrder);
    },
    [order, onReorder, onDragStateChange]
  );

  const handleDragCancel = useCallback(() => {
    onDragStateChange?.(false);
  }, [onDragStateChange]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const height = e.nativeEvent.layout.height;
    if (height > 40) {
      setItemHeight(height + ITEM_GAP);
    }
  }, []);

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
          totalItems={orderedHabits.length}
          itemSlotHeight={itemHeight}
          activeId={activeId}
          activeStartIndex={activeStartIndex}
          hoverIndex={hoverIndex}
          draggedTranslateY={draggedTranslateY}
          onDragStart={handleDragStart}
          onHoverChange={handleHoverChange}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          onLayoutFirstItem={index === 0 ? handleLayout : undefined}
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
  totalItems: number;
  itemSlotHeight: number;
  activeId: SharedValue<number>;
  activeStartIndex: SharedValue<number>;
  hoverIndex: SharedValue<number>;
  draggedTranslateY: SharedValue<number>;
  onDragStart: (id: number) => void;
  onHoverChange: () => void;
  onDragEnd: (id: number, fromIndex: number, toIndex: number) => void;
  onDragCancel: () => void;
  onLayoutFirstItem?: (e: LayoutChangeEvent) => void;
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
  totalItems,
  itemSlotHeight,
  activeId,
  activeStartIndex,
  hoverIndex,
  draggedTranslateY,
  onDragStart,
  onHoverChange,
  onDragEnd,
  onDragCancel,
  onLayoutFirstItem,
  getHabitStatus,
  onComplete,
  onSkip,
  onPress,
  canRecover,
  onRecover
}: DraggableHabitItemProps) {
  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .activateAfterLongPress(250)
    .onStart(() => {
      activeId.value = habit.id;
      activeStartIndex.value = index;
      hoverIndex.value = index;
      draggedTranslateY.value = 0;
      onDragStart(habit.id);
    })
    .onUpdate((event) => {
      draggedTranslateY.value = event.translationY;
      const targetIdx = Math.min(
        Math.max(0, Math.round(activeStartIndex.value + event.translationY / itemSlotHeight)),
        totalItems - 1
      );
      if (targetIdx !== hoverIndex.value) {
        hoverIndex.value = targetIdx;
        onHoverChange();
      }
    })
    .onEnd((event) => {
      const targetIdx = Math.min(
        Math.max(0, Math.round(activeStartIndex.value + event.translationY / itemSlotHeight)),
        totalItems - 1
      );
      const fromIdx = activeStartIndex.value;
      activeId.value = -1;
      activeStartIndex.value = -1;
      hoverIndex.value = -1;
      draggedTranslateY.value = 0;
      onDragEnd(habit.id, fromIdx, targetIdx);
    })
    .onFinalize(() => {
      if (activeId.value === habit.id) {
        activeId.value = -1;
        activeStartIndex.value = -1;
        hoverIndex.value = -1;
        draggedTranslateY.value = 0;
        onDragCancel();
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const isThisActive = activeId.value === habit.id;
    if (isThisActive) {
      return {
        transform: [
          { translateY: draggedTranslateY.value },
          { scale: withSpring(1.03, { damping: 14, stiffness: 260 }) }
        ],
        zIndex: 999,
        elevation: 12,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 }
      };
    }

    if (
      activeId.value !== -1 &&
      activeStartIndex.value !== -1 &&
      hoverIndex.value !== -1
    ) {
      const fromIdx = activeStartIndex.value;
      const toIdx = hoverIndex.value;
      let offset = 0;

      if (toIdx > fromIdx) {
        if (index > fromIdx && index <= toIdx) {
          offset = -itemSlotHeight;
        }
      } else if (toIdx < fromIdx) {
        if (index >= toIdx && index < fromIdx) {
          offset = itemSlotHeight;
        }
      }

      return {
        transform: [
          {
            translateY: withSpring(offset, {
              damping: 18,
              stiffness: 240,
              mass: 0.8
            })
          },
          { scale: withSpring(1) }
        ],
        zIndex: 0,
        elevation: 0,
        shadowOpacity: 0
      };
    }

    return {
      transform: [
        { translateY: withSpring(0, { damping: 18, stiffness: 240 }) },
        { scale: withSpring(1) }
      ],
      zIndex: 0,
      elevation: 0,
      shadowOpacity: 0
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[styles.itemWrapper, animatedStyle]}
        onLayout={onLayoutFirstItem}
      >
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
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm
  },
  itemWrapper: {
    width: '100%'
  }
});
