import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Pressable,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useHabits } from '../../hooks/useHabits';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import { getGreeting, formatDate } from '../../utils/dateHelpers';
import { computeChaiScore, chaiScoreLabel, chaiScoreEmoji } from '../../utils/chaiScore';
import type { HabitWithStreak } from '../../db/types';

// ─── Progress Ring ────────────────────────────────────────────────────────────
function ProgressRing({
  rate,
  size = 120,
  stroke = 10,
  color,
}: {
  rate: number;
  size?: number;
  stroke?: number;
  color: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - rate * circ;
  // Simple SVG-free ring using borders
  const { colors } = useTheme();
  const pct = Math.round(rate * 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Track */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: colors.border,
        }}
      />
      {/* Progress arc — use rotation trick */}
      {pct > 0 && (
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: stroke,
            borderColor: color,
            borderTopColor: pct > 75 ? color : 'transparent',
            borderRightColor: pct > 25 ? color : 'transparent',
            borderBottomColor: pct > 50 ? color : 'transparent',
            borderLeftColor: color,
            transform: [{ rotate: `${-90 + rate * 360}deg` }],
          }}
        />
      )}
      <Text
        style={{ fontSize: TYPOGRAPHY['2xl'], fontWeight: TYPOGRAPHY.heavy, color: colors.text }}
      >
        {pct}%
      </Text>
      <Text
        style={{
          fontSize: TYPOGRAPHY.xs,
          color: colors.textSecondary,
          fontWeight: TYPOGRAPHY.medium,
        }}
      >
        Today
      </Text>
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  emoji,
  label,
  value,
  color,
  bg,
}: {
  emoji: string;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ─── Habit Row Card ───────────────────────────────────────────────────────────
function HabitCard({
  habit,
  completed,
  onToggle,
  onPress,
}: {
  habit: HabitWithStreak;
  completed: boolean;
  onToggle: () => void;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 300,
      }),
    ]).start();
    onToggle();
  };

  const accentColor = habit.color ?? colors.primary;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        style={[
          styles.habitCard,
          {
            backgroundColor: completed ? colors.cardActive : colors.card,
            borderColor: completed ? accentColor : colors.border,
            borderWidth: completed ? 1.5 : StyleSheet.hairlineWidth,
            opacity: completed ? 0.75 : 1,
          },
        ]}
      >
        {/* icon + name */}
        <View style={[styles.habitIconWrap, { backgroundColor: accentColor + '22' }]}>
          <Text style={styles.habitIcon}>{habit.icon ?? '✨'}</Text>
        </View>
        <View style={styles.habitMeta}>
          <Text
            style={[styles.habitTitle, { color: colors.text }, completed && styles.habitTitleDone]}
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
        <TouchableOpacity
          onPress={handleToggle}
          style={[
            styles.checkBtn,
            {
              backgroundColor: completed ? accentColor : colors.inputBg,
              borderColor: completed ? accentColor : colors.border,
            },
          ]}
          activeOpacity={0.8}
          hitSlop={8}
        >
          <Text style={[styles.checkIcon, { color: completed ? '#fff' : colors.textMuted }]}>
            {completed ? '✓' : '○'}
          </Text>
        </TouchableOpacity>
      </Pressable>
    </Animated.View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyHabits({ onAdd, colors }: { onAdd: () => void; colors: any }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🌱</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No habits yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Start small. One habit changes everything.
      </Text>
      <TouchableOpacity
        style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
        onPress={onAdd}
        activeOpacity={0.85}
      >
        <Text style={styles.emptyBtnText}>Create your first habit</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { colors } = useTheme();
  const { habits, loading, refresh, toggleHabit, isCompleted, completedCount, completionRate } =
    useHabits();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const maxStreak = habits.reduce((m, h) => Math.max(m, h.current_streak), 0);
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.longest_streak), 0);
  const chaiScore = computeChaiScore(maxStreak, completionRate, habits.length);
  const fabAnim = useRef(new Animated.Value(1)).current;

  const handleFabPress = () => {
    Animated.sequence([
      Animated.timing(fabAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(fabAnim, { toValue: 1, useNativeDriver: true }),
    ]).start(() => router.push('/habit/create'));
  };

  if (loading) {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>{getGreeting()}</Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {formatDate(new Date())}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.avatarBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/settings')}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 24 }}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Progress card */}
        <View
          style={[
            styles.progressCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.progressLeft}>
            <Text style={[styles.progressTitle, { color: colors.text }]}>Today's Progress</Text>
            <Text style={[styles.progressSub, { color: colors.textSecondary }]}>
              {completedCount} of {habits.length} habits done
            </Text>
            <View style={[styles.progressBarTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { backgroundColor: colors.primary, width: `${completionRate * 100}%` },
                ]}
              />
            </View>
            <Text style={[styles.progressHint, { color: colors.textMuted }]}>
              {habits.length - completedCount} remaining
            </Text>
          </View>
          <ProgressRing rate={completionRate} color={colors.primary} />
        </View>

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

        {/* Habits section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Habits</Text>
          <TouchableOpacity onPress={() => router.push('/habit/create')} activeOpacity={0.7}>
            <View
              style={[
                styles.addBtn,
                { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' },
              ]}
            >
              <Text style={[styles.addBtnText, { color: colors.primary }]}>+ Add</Text>
            </View>
          </TouchableOpacity>
        </View>

        {habits.length === 0 ? (
          <EmptyHabits onAdd={() => router.push('/habit/create')} colors={colors} />
        ) : (
          <View style={styles.habitList}>
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                completed={isCompleted(habit.id)}
                onToggle={() => toggleHabit(habit.id)}
                onPress={() => router.push(`/habit/${habit.id}`)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <Animated.View style={[styles.fab, { transform: [{ scale: fabAnim }] }]}>
        <TouchableOpacity
          style={[styles.fabBtn, { backgroundColor: colors.primary }]}
          onPress={handleFabPress}
          activeOpacity={0.9}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: SPACING.base, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  greeting: { fontSize: TYPOGRAPHY.xl, fontWeight: TYPOGRAPHY.heavy, lineHeight: 28 },
  date: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.medium, marginTop: 2 },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: RADII.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressCard: {
    borderRadius: RADII.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.base,
    gap: SPACING.md,
  },
  progressLeft: { flex: 1, gap: SPACING.xs },
  progressTitle: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold },
  progressSub: { fontSize: TYPOGRAPHY.sm },
  progressBarTrack: { height: 6, borderRadius: 3, marginVertical: SPACING.xs },
  progressBarFill: { height: 6, borderRadius: 3 },
  progressHint: { fontSize: TYPOGRAPHY.xs },

  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: {
    flex: 1,
    borderRadius: RADII.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 2,
  },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.heavy },
  statLabel: { fontSize: TYPOGRAPHY.xs, fontWeight: TYPOGRAPHY.medium },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.bold },
  addBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.full,
    borderWidth: 1,
  },
  addBtnText: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.semibold },

  habitList: { gap: SPACING.sm },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADII.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  habitIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitIcon: { fontSize: 22 },
  habitMeta: { flex: 1, gap: 3 },
  habitTitle: { fontSize: TYPOGRAPHY.base, fontWeight: TYPOGRAPHY.semibold },
  habitTitleDone: { textDecorationLine: 'line-through' },
  habitSubRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  streakBadge: { fontSize: TYPOGRAPHY.xs, fontWeight: TYPOGRAPHY.bold },
  freqTag: { fontSize: TYPOGRAPHY.xs, fontWeight: TYPOGRAPHY.medium, textTransform: 'capitalize' },
  checkBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: { fontSize: 16, fontWeight: TYPOGRAPHY.bold },

  empty: { alignItems: 'center', paddingVertical: SPACING['3xl'], gap: SPACING.md },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: TYPOGRAPHY.xl, fontWeight: TYPOGRAPHY.bold },
  emptySubtitle: { fontSize: TYPOGRAPHY.base, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING['2xl'],
    borderRadius: RADII.full,
  },
  emptyBtnText: { color: '#fff', fontWeight: TYPOGRAPHY.bold, fontSize: TYPOGRAPHY.base },

  fab: { position: 'absolute', bottom: 90, right: SPACING.lg },
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
    shadowRadius: 8,
  },
  fabIcon: { color: '#fff', fontSize: 28, fontWeight: TYPOGRAPHY.heavy, lineHeight: 32 },
});
