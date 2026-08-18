import { useState, useCallback, useEffect, useMemo } from 'react';
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
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '../../contexts/ThemeContext';
import { useStats } from '../../hooks/useStats';
import { useHabits } from '../../hooks/useHabits';
import { SPACING, TYPOGRAPHY, RADII } from '../../constants';
import { computeChaiScore, habitsToChaiScoreInputs } from '../../utils/chaiScore';
import { getDailyTimeTotals, getActiveHabits, getAllHabitsHistoryForDate } from '../../db';
import { toDateString } from '../../db/utils';
import { getLast7Days, getLast30Days } from '../../utils/dateHelpers';
import ChaiScoreBanner from '../../components/progress/ChaiScoreBanner';
import PeriodTabSwitcher from '../../components/progress/PeriodTabSwitcher';
import BarChart from '../../components/progress/BarChart';
import BigStatCard from '../../components/progress/BigStatCard';
import CompletionSummary from '../../components/progress/CompletionSummary';
import ScreenHeader from '../../components/progress/ScreenHeader';
import HeatmapCalendar from '../../components/progress/HeatmapCalendar';

export default function ProgressScreen() {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const [tab, setTab] = useState<'7' | '30'>('7');
  const { bars7, bars30, loading, refresh } = useStats();
  const { habits, userId, accountStreak, accountLongestStreak } = useHabits();

  // Time tracking data
  const [timeBars7, setTimeBars7] = useState<Record<string, number>>({});
  const [timeBars30, setTimeBars30] = useState<Record<string, number>>({});

  // Heatmap data
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      refresh();
      loadTimeData();
      loadHeatmapData();
    }, [refresh])
  );

  const loadTimeData = useCallback(async () => {
    if (!userId) return;
    try {
      const [totals7, totals30] = await Promise.all([
        getDailyTimeTotals(db, userId, getLast7Days()),
        getDailyTimeTotals(db, userId, getLast30Days())
      ]);
      setTimeBars7(totals7);
      setTimeBars30(totals30);
    } catch {
      // ignore
    }
  }, [db, userId]);

  const loadHeatmapData = useCallback(async () => {
    if (!userId) return;
    try {
      const habits = await getActiveHabits(db, userId);
      if (habits.length === 0) return;

      // Build heatmap for last 84 days (12 weeks)
      const days: string[] = [];
      for (let i = 83; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(toDateString(d));
      }

      const data: Record<string, number> = {};
      await Promise.all(
        days.map(async (date) => {
          const hist = await getAllHabitsHistoryForDate(db, userId, date);
          const completed = hist.filter((h) => h.status === 'completed').length;
          const frozen = hist.filter((h) => h.status === 'frozen').length;
          const activeOnDate = habits.filter((h) => h.created_at.slice(0, 10) <= date).length;
          const total = Math.max(0, activeOnDate - frozen);
          if (total > 0) {
            data[date] = completed / total;
          }
        })
      );
      setHeatmapData(data);
    } catch {
      // ignore
    }
  }, [db, userId]);

  const bars = tab === '7' ? bars7 : bars30;
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

  // Time tracking bars
  const timeBars = tab === '7' ? timeBars7 : timeBars30;
  const timeDays = tab === '7' ? getLast7Days() : getLast30Days();
  const maxTimeSeconds = Math.max(0, ...Object.values(timeBars));

  const formatHours = (seconds: number): string => {
    const h = seconds / 3600;
    if (h >= 1) return `${h.toFixed(1)}h`;
    const m = Math.round(seconds / 60);
    return `${m}m`;
  };

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

        {/* Time Tracking Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Time Tracked</Text>
        <View
          style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Hours per Day</Text>
            <Text style={[styles.chartSub, { color: colors.textSecondary }]}>
              {tab === '7' ? 'Past 7 days' : 'Past 30 days'}
            </Text>
          </View>
          {maxTimeSeconds > 0 ? (
            <View style={styles.timeBarsContainer}>
              {timeDays.map((day) => {
                const seconds = timeBars[day] ?? 0;
                const heightPct = maxTimeSeconds > 0 ? (seconds / maxTimeSeconds) * 100 : 0;
                const dayLabel = new Date(day + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short'
                });
                return (
                  <View key={day} style={styles.timeBarCol}>
                    <Text style={[styles.timeBarValue, { color: colors.textSecondary }]}>
                      {seconds > 0 ? formatHours(seconds) : ''}
                    </Text>
                    <View
                      style={[
                        styles.timeBarTrack,
                        { backgroundColor: colors.border + '55' }
                      ]}
                    >
                      <View
                        style={[
                          styles.timeBarFill,
                          {
                            height: `${Math.max(2, heightPct)}%`,
                            backgroundColor: seconds > 0 ? colors.primary : 'transparent'
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.timeBarLabel, { color: colors.textMuted }]}>
                      {tab === '7' ? dayLabel : day.slice(8)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No time tracked yet. Start a timer from the Home tab!
              </Text>
            </View>
          )}
        </View>

        {/* Heatmap Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Activity Heatmap</Text>
        <View
          style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Last 12 Weeks</Text>
            <Text style={[styles.chartSub, { color: colors.textSecondary }]}>
              Daily completion rate
            </Text>
          </View>
          <HeatmapCalendar data={heatmapData} weeks={12} />
        </View>

        {/* Stats grid */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>All Time Stats</Text>
        <View style={styles.statsGrid}>
          <BigStatCard emoji="🔥" label="Current Streak" value={`${accountStreak}d`} color="#EF4444" />
          <BigStatCard
            emoji="🏆"
            label="Longest Streak"
            value={`${accountLongestStreak}d`}
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
  },

  timeBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    gap: 2
  },

  timeBarCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%'
  },

  timeBarValue: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.semibold,
    marginBottom: 2
  },

  timeBarTrack: {
    width: '100%',
    flex: 1,
    borderRadius: RADII.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end'
  },

  timeBarFill: {
    width: '100%',
    borderTopLeftRadius: RADII.sm,
    borderTopRightRadius: RADII.sm
  },

  timeBarLabel: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.medium,
    marginTop: 4
  },

  emptyText: {
    fontSize: TYPOGRAPHY.sm,
    textAlign: 'center'
  }
});
