import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useHabits } from '../../hooks/useHabits';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import { computeChaiScore, habitsToChaiScoreInputs } from '../../utils/chaiScore';
import HomeHeader from '../../components/home/HomeHeader';
import TodayProgressCard from '../../components/home/TodayProgressCard';
import StatCard from '../../components/home/StatCard';
import EmptyHabits from '../../components/home/EmptyHabits';
import MissedHabitsDialog from '../../components/home/MissedHabitsDialog';
import DailyTasksCard from '../../components/home/DailyTasksCard';
import DraggableHabitList from '../../components/home/DraggableHabitList';

export default function HomeScreen() {
  const { colors } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const {
    habits,
    user,
    loading,
    refresh,
    reorderHabits,
    toggleHabit,
    getHabitStatus,
    completedCount,
    completionRate,
    chaiScrolls,
    scrollsAwarded,
    clearScrollsAwarded,
    recoverStreak,
    accountStreak,
    accountLongestStreak,
    missedYesterdayHabits,
    showMissedDialog,
    dismissMissedDialog,
    markMissedHabit
  } = useHabits();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Celebrate a freshly-minted Chai Scroll with a success haptic — the new
  // balance is already visible via the badge in HomeHeader.
  useEffect(() => {
    if (scrollsAwarded > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearScrollsAwarded();
    }
  }, [scrollsAwarded, clearScrollsAwarded]);

  const chaiScore = computeChaiScore(habitsToChaiScoreInputs(habits));
  const fabAnim = useRef(new Animated.Value(1)).current;

  const handleFabPress = () => {
    Animated.sequence([
      Animated.timing(fabAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(fabAnim, { toValue: 1, useNativeDriver: true })
    ]).start(() => router.push('/habit/create'));
  };

  if (loading) {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }
        ]}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const listHeader = (
    <>
      <HomeHeader colors={colors} user={user} />

      <TodayProgressCard
        colors={colors}
        completedCount={completedCount}
        totalCount={habits.length}
        completionRate={completionRate}
      />

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatCard
          emoji="🔥"
          label="Streak"
          value={`${accountStreak}d`}
          color="#EF4444"
          bg={colors.card}
        />
        <StatCard
          emoji="🏆"
          label="Best"
          value={`${accountLongestStreak}d`}
          color={colors.primary}
          bg={colors.card}
        />
        <StatCard
          emoji="☕"
          label="Chai Score"
          value={chaiScore}
          color="#F59E0B"
          bg={colors.card}
        />
      </View>

      {/* Daily Tasks */}
      <DailyTasksCard />

      {/* Habits section header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Habits</Text>
        <Pressable
          onPress={() => router.push('/habit/create')}
          style={({ pressed }) => [
            styles.addBtn,
            {
              backgroundColor: colors.primary + '22',
              borderColor: colors.primary + '44',
              opacity: pressed ? 0.7 : 1
            }
          ]}
        >
          <Text style={[styles.addBtnText, { color: colors.primary }]}>+ Add</Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={[{ key: 'header' }, { key: 'habits' }, { key: 'footer' }]}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDragging}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => {
          if (item.key === 'header') return <>{listHeader}</>;
          if (item.key === 'habits') {
            if (habits.length === 0) {
              return <EmptyHabits onAdd={() => router.push('/habit/create')} />;
            }
            return (
              <DraggableHabitList
                habits={habits}
                getHabitStatus={getHabitStatus}
                onComplete={(id) => toggleHabit(id, 'completed')}
                onSkip={(id) => toggleHabit(id, 'skipped')}
                onPress={(id) => router.push(`/habit/${id}`)}
                canRecover={(id) => {
                  const habit = habits.find((h) => h.id === id);
                  return !!habit?.recoverableDate && chaiScrolls > 0;
                }}
                onRecover={(id) => recoverStreak(id)}
                onReorder={reorderHabits}
                onDragStateChange={setIsDragging}
              />
            );
          }
          return <View style={{ height: 100 }} />;
        }}
      />

      {/* FAB */}
      <Animated.View style={[styles.fab, { transform: [{ scale: fabAnim }] }]}>
        <Pressable
          style={({ pressed }) => [
            styles.fabBtn,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              opacity: pressed ? 0.9 : 1
            }
          ]}
          onPress={handleFabPress}
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      </Animated.View>

      {/* Missed habits verification dialog */}
      <MissedHabitsDialog
        visible={showMissedDialog}
        habits={missedYesterdayHabits}
        onMark={markMissedHabit}
        onDismiss={dismissMissedDialog}
      />
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

  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md
  },

  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold
  },

  addBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.full,
    borderWidth: 1
  },

  addBtnText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold
  },

  fab: {
    position: 'absolute',
    bottom: 90,
    right: SPACING.lg
  },

  fabBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8
  },

  fabIcon: {
    color: '#fff',
    fontSize: 28,
    fontWeight: TYPOGRAPHY.heavy,
    lineHeight: 32
  }
});
