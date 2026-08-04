import { useState, useCallback } from 'react';
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
import { computeChaiScore, habitsToChaiScoreInputs } from '../../utils/chaiScore';
import ChaiScoreBanner from '../../components/progress/ChaiScoreBanner';
import PeriodTabSwitcher from '../../components/progress/PeriodTabSwitcher';
import BarChart from '../../components/progress/BarChart';
import BigStatCard from '../../components/progress/BigStatCard';
import CompletionSummary from '../../components/progress/CompletionSummary';
import ScreenHeader from '../../components/progress/ScreenHeader';

export default function ProgressScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<'7' | '30'>('7');
  const { bars7, bars30, loading, refresh } = useStats();
  const { habits } = useHabits();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const bars = tab === '7' ? bars7 : bars30;
  const maxStreak = habits.reduce((m, h) => Math.max(m, h.current_streak), 0);
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.longest_streak), 0);
  const totalCompletions = habits.reduce((s, h) => s + h.total_completions, 0);
  const chaiScore = computeChaiScore(habitsToChaiScoreInputs(habits));

  // Use bars from the active period for period-specific rates
  const barsCurrent = tab === '7' ? bars7 : bars30;
  const totalPossible = barsCurrent.reduce((s, b) => s + b.total, 0);
  const totalDone = barsCurrent.reduce((s, b) => s + b.count, 0);
  const totalFailures = barsCurrent.reduce((s, b) => s + b.skipped, 0);
  const totalMissed = Math.max(0, totalPossible - totalDone - totalFailures);
  const periodRate = totalPossible > 0 ? totalDone / totalPossible : 0;
  const failureRate = totalPossible > 0 ? totalFailures / totalPossible : 0;
  const missedRate = totalPossible > 0 ? totalMissed / totalPossible : 0;
  const periodLabel = `${tab}-day period`;

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
            emoji="📈"
            label="Success Rate"
            value={`${Math.round(periodRate * 100)}%`}
            sub={periodLabel}
            color="#8B5CF6"
          />
          <BigStatCard
            emoji="📉"
            label="Failure Rate"
            value={`${Math.round(failureRate * 100)}%`}
            sub={periodLabel}
            color={colors.danger}
          />
          <BigStatCard
            emoji="💨"
            label="Missed Rate"
            value={`${Math.round(missedRate * 100)}%`}
            sub={periodLabel}
            color={colors.textMuted}
          />
          <BigStatCard
            emoji="✅"
            label="Total Completions"
            value={totalCompletions}
            color={colors.success}
          />
          <BigStatCard
            emoji="❌"
            label="Total Failures"
            value={totalFailures}
            color={colors.danger}
          />
          <BigStatCard
            emoji="🕳️"
            label="Total Missed"
            value={totalMissed}
            color={colors.textMuted}
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
