import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, useWindowDimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import { formatDayLabel, shortDayLabel, shortMonthDay } from '../../utils/dateHelpers';
import type { DayBar } from '../../hooks/useStats';

const CHART_H = 160;
const BAR_GAP = 4;
const BAR_W_30 = 32;
const CARD_H_PADDING = SPACING.lg * 2; // padding inside chartCard

export default function BarChart({ bars, mode }: { bars: DayBar[]; mode: '7' | '30' }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Available width = screen - outer padding - card padding
  const availableW = width - SPACING.base * 2 - CARD_H_PADDING;
  const barW =
    mode === '7'
      ? (availableW - BAR_GAP * 6) / 7
      : BAR_W_30;

  const selectedBar = selectedDate ? (bars.find((b) => b.date === selectedDate) ?? null) : null;
  const hasTrackedHabits = !!selectedBar && selectedBar.total > 0;
  const selCompleted = selectedBar?.count ?? 0;
  const selSkipped = selectedBar?.skipped ?? 0;
  const selMissed = selectedBar ? Math.max(0, selectedBar.total - selCompleted - selSkipped) : 0;
  const selPct = hasTrackedHabits
    ? Math.round((selCompleted / selectedBar!.total) * 100)
    : 0;

  return (
    <View style={styles.chartWrap}>
      {/* grid lines */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <View
          key={f}
          style={[styles.gridLine, { bottom: f * CHART_H + 20, borderColor: colors.border }]}
        />
      ))}

      <FlatList
        data={bars}
        keyExtractor={(bar) => bar.date}
        horizontal
        scrollEnabled={mode === '30'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.barsRow,
          mode === '7' && { width: availableW }
        ]}
        ItemSeparatorComponent={() => <View style={{ width: BAR_GAP }} />}
        renderItem={({ item: bar, index: i }) => {
          const fillH = bar.total > 0 ? (bar.count / bar.total) * CHART_H : 0;
          const isToday = i === bars.length - 1;
          const isEmpty = bar.count === 0;
          const isSelected = selectedDate === bar.date;
          const showDateLabel =
            mode === '7' || i % 7 === 0 || i === bars.length - 1;

          return (
            <Pressable
              onPress={() => setSelectedDate(isSelected ? null : bar.date)}
              style={({ pressed }) => [
                styles.barCol,
                { width: barW, opacity: pressed ? 0.7 : 1 }
              ]}
            >
              {/* count label on top for 7-day */}
              {mode === '7' && bar.count > 0 && (
                <Text style={[styles.barCountLabel, { color: colors.textSecondary }]}>
                  {bar.count}
                </Text>
              )}

              {/* track + fill */}
              <View
                style={[
                  styles.barTrack,
                  {
                    height: CHART_H,
                    backgroundColor: colors.border + '55',
                    borderWidth: isSelected ? 1.5 : 0,
                    borderColor: isSelected ? colors.primary : 'transparent',
                    borderRadius: RADII.sm
                  }
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
                      borderTopLeftRadius: RADII.sm,
                      borderTopRightRadius: RADII.sm
                    }
                  ]}
                />
              </View>

              {/* day / date label — fixed height so all bars align */}
              <View style={styles.labelSlot}>
                {showDateLabel ? (
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.barLabel,
                      {
                        color: isSelected || isToday ? colors.primary : colors.textMuted,
                        fontSize: mode === '30' ? TYPOGRAPHY.xs - 2 : TYPOGRAPHY.xs
                      }
                    ]}
                  >
                    {mode === '7' ? shortDayLabel(bar.date) : shortMonthDay(bar.date)}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        }}
      />

      {/* Selected day breakdown */}
      {selectedBar && (
        <View
          style={[
            styles.selectedInfo,
            { backgroundColor: colors.card, borderColor: colors.primary + '66' }
          ]}
        >
          <Text style={[styles.selectedInfoDate, { color: colors.text }]}>
            {formatDayLabel(selectedBar.date)}
          </Text>

          {hasTrackedHabits ? (
            <View style={styles.selectedPills}>
              <View style={[styles.pill, { backgroundColor: colors.success + '22' }]}>
                <Text style={[styles.pillDot, { color: colors.success }]}>●</Text>
                <Text style={[styles.pillText, { color: colors.success }]}>
                  {selCompleted} done
                </Text>
              </View>
              {selSkipped > 0 && (
                <View style={[styles.pill, { backgroundColor: colors.danger + '22' }]}>
                  <Text style={[styles.pillDot, { color: colors.danger }]}>●</Text>
                  <Text style={[styles.pillText, { color: colors.danger }]}>
                    {selSkipped} skipped
                  </Text>
                </View>
              )}
              {selMissed > 0 && (
                <View style={[styles.pill, { backgroundColor: colors.textMuted + '22' }]}>
                  <Text style={[styles.pillDot, { color: colors.textMuted }]}>●</Text>
                  <Text style={[styles.pillText, { color: colors.textMuted }]}>
                    {selMissed} missed
                  </Text>
                </View>
              )}
              <Text style={[styles.selectedPct, { color: colors.primary }]}>
                {selPct}%
              </Text>
            </View>
          ) : (
            <Text style={[styles.selectedInfoDetail, { color: colors.textSecondary }]}>
              No habits tracked yet
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chartWrap: {
    position: 'relative'
  },

  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth
  },

  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_H + 36,
    paddingBottom: 0
  },

  barCol: {
    alignItems: 'center',
    justifyContent: 'flex-end'
  },

  barCountLabel: {
    fontSize: TYPOGRAPHY.xs - 1,
    fontWeight: TYPOGRAPHY.semibold,
    marginBottom: 2
  },

  barTrack: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'flex-end'
  },

  barFill: {
    width: '100%'
  },

  labelSlot: {
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 3
  },

  barLabel: {
    fontWeight: TYPOGRAPHY.medium,
    textAlign: 'center'
  },

  selectedInfo: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADII.lg,
    borderWidth: 1,
    gap: SPACING.sm
  },

  selectedInfoDate: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold
  },

  selectedPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.xs
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADII.full
  },

  pillDot: {
    fontSize: 8,
    lineHeight: 12
  },

  pillText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold
  },

  selectedPct: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.heavy,
    marginLeft: 'auto'
  },

  selectedInfoDetail: {
    fontSize: TYPOGRAPHY.xs
  }
});
