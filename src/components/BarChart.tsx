import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Pressable } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../constants';
import { formatDayLabel, shortDayLabel, shortMonthDay } from '../utils/dateHelpers';
import type { DayBar } from '../hooks/useStats';

const { width } = Dimensions.get('window');
const CHART_H = 160;
const BAR_GAP = 4;
const BAR_W_30 = 32;

export default function BarChart({ bars, mode }: { bars: DayBar[]; mode: '7' | '30' }) {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const barW =
    mode === '7' ? (width - SPACING.base * 2 - SPACING.lg * 2 - BAR_GAP * 6) / 7 : BAR_W_30;

  const selectedBar = selectedDate ? (bars.find((b) => b.date === selectedDate) ?? null) : null;
  const hasTrackedHabits = !!selectedBar && selectedBar.total > 0;
  const selectedPct = hasTrackedHabits
    ? Math.round((selectedBar!.count / selectedBar!.total) * 100)
    : 0;

  return (
    <View style={styles.chartWrap}>
      {/* grid lines */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <View
          key={f}
          style={[styles.gridLine, { bottom: f * CHART_H, borderColor: colors.border }]}
        />
      ))}

      <FlatList
        data={bars}
        keyExtractor={(bar) => bar.date}
        horizontal
        scrollEnabled={mode === '30'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.barsRow}
        ItemSeparatorComponent={() => <View style={{ width: BAR_GAP }} />}
        renderItem={({ item: bar, index: i }) => {
          const fillH = bar.total > 0 ? (bar.count / bar.total) * CHART_H : 0;
          const isToday = i === bars.length - 1;
          const isEmpty = bar.count === 0;
          const isSelected = selectedDate === bar.date;

          return (
            <Pressable
              onPress={() => setSelectedDate(isSelected ? null : bar.date)}
              style={({ pressed }) => [
                styles.barCol,
                { width: barW, gap: BAR_GAP / 2, opacity: pressed ? 0.7 : 1 }
              ]}
            >
              {/* count label on top for 7-day */}
              {mode === '7' && bar.count > 0 && (
                <Text style={[styles.barCountLabel, { color: colors.textSecondary }]}>
                  {bar.count}
                </Text>
              )}
              <View
                style={[
                  styles.barTrack,
                  {
                    height: CHART_H,
                    backgroundColor: colors.border + '55',
                    borderWidth: isSelected ? 1.5 : 0,
                    borderColor: colors.text
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
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4
                    }
                  ]}
                />
              </View>
              {mode === '7' ? (
                <Text
                  style={[
                    styles.barLabel,
                    { color: isSelected || isToday ? colors.primary : colors.textMuted }
                  ]}
                >
                  {shortDayLabel(bar.date)}
                </Text>
              ) : i % 5 === 0 || i === bars.length - 1 ? (
                <Text
                  style={[
                    styles.barLabel,
                    {
                      color: isSelected || isToday ? colors.primary : colors.textMuted,
                      fontSize: TYPOGRAPHY.xs - 1
                    }
                  ]}
                >
                  {shortMonthDay(bar.date)}
                </Text>
              ) : (
                <View style={{ height: 12 }} />
              )}
            </Pressable>
          );
        }}
      />

      {selectedBar && (
        <View
          style={[
            styles.selectedInfo,
            { backgroundColor: colors.inputBg, borderColor: colors.border }
          ]}
        >
          <Text style={[styles.selectedInfoDate, { color: colors.text }]}>
            {formatDayLabel(selectedBar.date)}
          </Text>
          {hasTrackedHabits ? (
            <>
              <Text style={[styles.selectedInfoPct, { color: colors.primary }]}>
                {selectedPct}%
              </Text>
              <Text style={[styles.selectedInfoDetail, { color: colors.textSecondary }]}>
                {selectedBar.count}/{selectedBar.total} completed
                {selectedBar.skipped > 0 ? ` · ${selectedBar.skipped} skipped` : ''}
              </Text>
            </>
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
    gap: BAR_GAP,
    height: CHART_H + 40,
    paddingBottom: 20
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
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end'
  },

  barFill: {
    width: '100%'
  },

  barLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
    marginTop: 4,
    textAlign: 'center'
  },

  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth
  },

  selectedInfoDate: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold
  },

  selectedInfoPct: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.heavy
  },

  selectedInfoDetail: {
    fontSize: TYPOGRAPHY.xs,
    marginLeft: 'auto'
  }
});
