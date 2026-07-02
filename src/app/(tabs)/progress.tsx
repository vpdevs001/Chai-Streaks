import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useStats } from '../../hooks/useStats';
import { useHabits } from '../../hooks/useHabits';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import { shortDayLabel, shortMonthDay } from '../../utils/dateHelpers';
import { computeChaiScore, chaiScoreLabel, chaiScoreEmoji } from '../../utils/chaiScore';
import type { DayBar } from '../../hooks/useStats';

const { width } = Dimensions.get('window');
const CHART_H = 160;
const BAR_GAP = 4;

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function BarChart({ bars, mode }: { bars: DayBar[]; mode: '7' | '30' }) {
  const { colors } = useTheme();
  const maxCount = Math.max(...bars.map((b) => b.total), 1);
  const barW =
    mode === '7'
      ? (width - SPACING.base * 2 - SPACING.lg * 2 - BAR_GAP * 6) / 7
      : Math.max(6, (width - SPACING.base * 2 - SPACING.lg * 2 - BAR_GAP * 29) / 30);

  return (
    <View style={styles.chartWrap}>
      {/* grid lines */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <View
          key={f}
          style={[styles.gridLine, { bottom: f * CHART_H, borderColor: colors.border }]}
        />
      ))}

      <View style={styles.barsRow}>
        {bars.map((bar, i) => {
          const fillH = bar.total > 0 ? (bar.count / bar.total) * CHART_H : 0;
          const isToday = i === bars.length - 1;
          const isEmpty = bar.count === 0;

          return (
            <View key={bar.date} style={[styles.barCol, { width: barW, gap: BAR_GAP / 2 }]}>
              {/* count label on top for 7-day */}
              {mode === '7' && bar.count > 0 && (
                <Text style={[styles.barCountLabel, { color: colors.textSecondary }]}>
                  {bar.count}
                </Text>
              )}
              <View
                style={[
                  styles.barTrack,
                  { height: CHART_H, backgroundColor: colors.border + '55' },
                ]}
              >
                <View
                  style={[
                    styles.barFill,
                    {
                      height: fillH,
                      backgroundColor: isEmpty
                        ? colors.border
                        : isToday
                          ? colors.primary
                          : colors.primary + 'AA',
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4,
                    },
                  ]}
                />
              </View>
              {mode === '7' ? (
                <Text
                  style={[styles.barLabel, { color: isToday ? colors.primary : colors.textMuted }]}
                >
                  {shortDayLabel(bar.date)}
                </Text>
              ) : i % 5 === 0 || i === bars.length - 1 ? (
                <Text
                  style={[
                    styles.barLabel,
                    {
                      color: isToday ? colors.primary : colors.textMuted,
                      fontSize: TYPOGRAPHY.xs - 1,
                    },
                  ]}
                >
                  {shortMonthDay(bar.date)}
                </Text>
              ) : (
                <View style={{ height: 12 }} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function BigStatCard({
  emoji,
  label,
  value,
  sub,
  color,
}: {
  emoji: string;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.bigStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={styles.bigStatEmoji}>{emoji}</Text>
      <Text style={[styles.bigStatValue, { color }]}>{value}</Text>
      <Text style={[styles.bigStatLabel, { color: colors.textSecondary }]}>{label}</Text>
      {sub && <Text style={[styles.bigStatSub, { color: colors.textMuted }]}>{sub}</Text>}
    </View>
  );
}

// ─── Pie-like completion summary ──────────────────────────────────────────────
function CompletionSummary({ bars }: { bars: DayBar[] }) {
  const { colors } = useTheme();
  const totalPossible = bars.reduce((s, b) => s + b.total, 0);
  const totalDone = bars.reduce((s, b) => s + b.count, 0);
  const totalMissed = totalPossible - totalDone;
  const rate = totalPossible > 0 ? totalDone / totalPossible : 0;

  return (
    <View
      style={[styles.completionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Text style={[styles.completionTitle, { color: colors.text }]}>Completion Breakdown</Text>
      <View style={styles.completionRow}>
        {/* Bar */}
        <View style={[styles.completionTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.completionFill,
              { width: `${rate * 100}%`, backgroundColor: colors.success },
            ]}
          />
        </View>
        <Text style={[styles.completionPct, { color: colors.primary }]}>
          {Math.round(rate * 100)}%
        </Text>
      </View>
      <View style={styles.completionLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Completed: {totalDone}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Missed: {totalMissed}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Progress Screen ──────────────────────────────────────────────────────────
export default function ProgressScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<'7' | '30'>('7');
  const { bars7, bars30, loading, refresh } = useStats();
  const { habits, completionRate } = useHabits();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Progress</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Your consistency over time
          </Text>
        </View>

        {/* Chai Score Banner */}
        <View
          style={[
            styles.chaiBanner,
            { backgroundColor: colors.primary + '15', borderColor: colors.primary + '33' },
          ]}
        >
          <Text style={styles.chaiBannerEmoji}>{chaiScoreEmoji(chaiScore)}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.chaiScoreNum, { color: colors.primary }]}>{chaiScore}/100</Text>
            <Text style={[styles.chaiScoreLabel, { color: colors.text }]}>
              {chaiScoreLabel(chaiScore)}
            </Text>
            <Text style={[styles.chaiScoreSub, { color: colors.textSecondary }]}>
              Your Chai Score
            </Text>
          </View>
          {/* mini bar */}
          <View style={[styles.chaiTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.chaiFill,
                { height: `${chaiScore}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
        </View>

        {/* Tab switcher */}
        <View style={[styles.tabRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(['7', '30'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && { backgroundColor: colors.primary }]}
              onPress={() => setTab(t)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.tabBtnText, { color: tab === t ? '#fff' : colors.textSecondary }]}
              >
                {t === '7' ? 'Last 7 Days' : 'Last 30 Days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bar Chart */}
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
            <View style={{ height: CHART_H + 40, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <BarChart bars={bars} mode={tab} />
          )}
        </View>

        {/* Completion summary */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: SPACING.base, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  header: { marginBottom: SPACING.lg },
  headerTitle: { fontSize: TYPOGRAPHY['2xl'], fontWeight: TYPOGRAPHY.heavy },
  headerSub: { fontSize: TYPOGRAPHY.sm, marginTop: 2 },

  chaiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: RADII.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
  },
  chaiBannerEmoji: { fontSize: 36 },
  chaiScoreNum: { fontSize: TYPOGRAPHY['2xl'], fontWeight: TYPOGRAPHY.heavy },
  chaiScoreLabel: { fontSize: TYPOGRAPHY.base, fontWeight: TYPOGRAPHY.semibold },
  chaiScoreSub: { fontSize: TYPOGRAPHY.xs },
  chaiTrack: {
    width: 8,
    height: 64,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  chaiFill: { width: '100%', borderRadius: 4 },

  tabRow: {
    flexDirection: 'row',
    borderRadius: RADII.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    marginBottom: SPACING.base,
    gap: 4,
  },
  tabBtn: { flex: 1, paddingVertical: SPACING.sm, borderRadius: RADII.md, alignItems: 'center' },
  tabBtnText: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.semibold },

  chartCard: {
    borderRadius: RADII.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
  },
  chartHeader: { marginBottom: SPACING.md },
  chartTitle: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold },
  chartSub: { fontSize: TYPOGRAPHY.xs, marginTop: 2 },

  chartWrap: { position: 'relative' },
  gridLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: BAR_GAP,
    height: CHART_H + 40,
    paddingBottom: 20,
  },
  barCol: { alignItems: 'center', justifyContent: 'flex-end' },
  barCountLabel: { fontSize: TYPOGRAPHY.xs - 1, fontWeight: TYPOGRAPHY.semibold, marginBottom: 2 },
  barTrack: { width: '100%', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%' },
  barLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
    marginTop: 4,
    textAlign: 'center',
  },

  completionCard: {
    borderRadius: RADII.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  completionTitle: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold },
  completionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  completionTrack: { flex: 1, height: 12, borderRadius: 6, overflow: 'hidden' },
  completionFill: { height: '100%', borderRadius: 6 },
  completionPct: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.heavy,
    minWidth: 48,
    textAlign: 'right',
  },
  completionLegend: { flexDirection: 'row', gap: SPACING.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: TYPOGRAPHY.sm },

  sectionTitle: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.bold, marginBottom: SPACING.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  bigStat: {
    width: (width - SPACING.base * 2 - SPACING.sm) / 2,
    borderRadius: RADII.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
    alignItems: 'flex-start',
    gap: 3,
  },
  bigStatEmoji: { fontSize: 28, marginBottom: 2 },
  bigStatValue: { fontSize: TYPOGRAPHY.xl, fontWeight: TYPOGRAPHY.heavy },
  bigStatLabel: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.medium },
  bigStatSub: { fontSize: TYPOGRAPHY.xs },
});
