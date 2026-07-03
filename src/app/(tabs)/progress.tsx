import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useStats } from '../../hooks/useStats';
import { useHabits } from '../../hooks/useHabits';
import { SPACING, TYPOGRAPHY } from '../../constants';
import { computeChaiScore } from '../../utils/chaiScore';
import ChaiScoreBanner from '../../components/ChaiScoreBanner';
import PeriodTabSwitcher from '../../components/PeriodTabSwitcher';
import BarChart from '../../components/BarChart';
import BigStatCard from '../../components/BigStatCard';
import CompletionSummary from '../../components/CompletionSummary';
import ScreenHeader from '../../components/ScreenHeader';

export default function ProgressScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<'7' | '30'>('7');
  const { bars7, bars30, loading, refresh } = useStats();
  const { habits, completionRate } = useHabits();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const bars = tab === '7' ? bars7 : bars30;
  const maxStreak = habits.reduce((m, h) => Math.max(m, h.current_streak), 0);
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.longest_streak), 0);
  const totalCompletions = habits.reduce((s, h) => s + h.total_completions, 0);
  const chaiScore = computeChaiScore(maxStreak, completionRate, habits.length);
  const barsCurrent = tab === '7' ? bars7 : bars30;
  const totalPossible = barsCurrent.reduce((s, b) => s + b.total, 0);
  const totalDone = barsCurrent.reduce((s, b) => s + b.count, 0);
  const periodRate = totalPossible > 0 ? totalDone / totalPossible : 0;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        <ScreenHeader title="Progress" subtitle="Your consistency over time" colors={colors} />

        <ChaiScoreBanner colors={colors} chaiScore={chaiScore} />

        <PeriodTabSwitcher colors={colors} tab={tab} onTabChange={setTab} />

        {/* Bar Chart card */}
        <View
          style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Habits Completed</Text>
            <Text style={[styles.chartSub, { color: colors.textSecondary }]}>
              {tab === '7' ? 'Past 7 days' : 'Past 30 days'}
            </Text>
          </View>
          {loading ? (
            <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <BarChart bars={bars} mode={tab} />
          )}
        </View>

        <CompletionSummary bars={bars} />

        {/* Stats grid */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>All Time Stats</Text>
        <View style={styles.statsGrid}>
          <BigStatCard emoji="🔥" label="Current Streak" value={`${maxStreak}d`} color="#EF4444" />
          <BigStatCard
            emoji="🏆"
            label="Longest Streak"
            value={`${bestStreak}d`}
            color={colors.primary}
          />
          <BigStatCard
            emoji="✅"
            label="Total Completions"
            value={totalCompletions}
            color={colors.success}
          />
          <BigStatCard
            emoji="📈"
            label="Success Rate"
            value={`${Math.round(periodRate * 100)}%`}
            sub={`${tab === '7' ? '7' : '30'}-day period`}
            color="#8B5CF6"
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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

  chartCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    marginBottom: SPACING.base
  },

  chartHeader: {
    marginBottom: SPACING.md
  },

  chartTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold
  },

  chartSub: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: 2
  },

  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: SPACING.md
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm
  }
});
