import { useCallback, useRef } from 'react';
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
import { useTheme } from '../../contexts/ThemeContext';
import { useHabits } from '../../hooks/useHabits';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import { computeChaiScore } from '../../utils/chaiScore';
import HomeHeader from '../../components/HomeHeader';
import TodayProgressCard from '../../components/TodayProgressCard';
import StatCard from '../../components/StatCard';
import HabitCard from '../../components/HabitCard';
import EmptyHabits from '../../components/EmptyHabits';

export default function HomeScreen() {
  const { colors } = useTheme();
  const {
    habits,
    user,
    loading,
    refresh,
    toggleHabit,
    getHabitStatus,
    completedCount,
    completionRate
  } = useHabits();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const maxStreak = habits.reduce((m, h) => Math.max(m, h.current_streak), 0);
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.longest_streak), 0);
  const chaiScore = computeChaiScore(maxStreak, completionRate, habits.length);
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
          value={`${maxStreak}d`}
          color="#EF4444"
          bg={colors.card}
        />
        <StatCard
          emoji="🏆"
          label="Best"
          value={`${bestStreak}d`}
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
        data={habits}
        keyExtractor={(habit) => String(habit.id)}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={listHeader}
        ListEmptyComponent={<EmptyHabits onAdd={() => router.push('/habit/create')} />}
        renderItem={({ item: habit, index }) => (
          <HabitCard
            habit={habit}
            status={getHabitStatus(habit.id)}
            index={index}
            onComplete={() => toggleHabit(habit.id, 'completed')}
            onSkip={() => toggleHabit(habit.id, 'skipped')}
            onPress={() => router.push(`/habit/${habit.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      {/* FAB */}
      <Animated.View style={[styles.fab, { transform: [{ scale: fabAnim }] }]}>
        <Pressable
          style={({ pressed }) => [
            styles.fabBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1
            }
          ]}
          onPress={handleFabPress}
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      </Animated.View>
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
    shadowColor: '#FF8A3D',
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
