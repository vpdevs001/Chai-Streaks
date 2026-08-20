import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, useWindowDimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import { formatDayLabel, shortDayLabel, shortMonthDay } from '../../utils/dateHelpers';

interface TimeBarItem {
  date: string;
  seconds: number;
}

interface TimeBarChartProps {
  timeBars: Record<string, number>;
  mode: '7' | '30';
  days: string[];
  onSelectDate?: (date: string | null) => void;
  selectedDate?: string | null;
}

const CHART_H = 160;
const BAR_GAP = 4;
const BAR_W_30 = 32;
const CARD_H_PADDING = SPACING.lg * 2;

function formatHoursMinutesCompact(seconds: number): string {
  if (seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatHoursMinutesFull(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h} hour${h > 1 ? 's' : ''}`;
  if (m > 0) return `${m} minute${m > 1 ? 's' : ''}`;
  return '0 minutes';
}

export default function TimeBarChart({
  timeBars,
  mode,
  days,
  onSelectDate,
  selectedDate: externalSelectedDate
}: TimeBarChartProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [internalSelectedDate, setInternalSelectedDate] = useState<string | null>(null);

  const selectedDate =
    externalSelectedDate !== undefined ? externalSelectedDate : internalSelectedDate;

  const handleSelect = (date: string) => {
    const next = selectedDate === date ? null : date;
    setInternalSelectedDate(next);
    onSelectDate?.(next);
  };

  const data: TimeBarItem[] = useMemo(() => {
    return days.map((date) => ({
      date,
      seconds: timeBars[date] ?? 0
    }));
  }, [days, timeBars]);

  const maxSeconds = useMemo(() => {
    const rawMax = Math.max(0, ...Object.values(timeBars));
    // Default min scale: at least 1 hour (3600s) for visually balanced bars
    return Math.max(3600, rawMax);
  }, [timeBars]);

  // Available width = screen - outer padding - card padding
  const availableW = width - SPACING.base * 2 - CARD_H_PADDING;
  const barW = mode === '7' ? (availableW - BAR_GAP * 6) / 7 : BAR_W_30;

  const selectedItem = selectedDate ? (data.find((d) => d.date === selectedDate) ?? null) : null;
  const selectedSeconds = selectedItem?.seconds ?? 0;

  return (
    <View style={styles.chartWrap}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((f) => {
        const gridSeconds = Math.round(f * maxSeconds);
        const gridHours = (gridSeconds / 3600).toFixed(1).replace('.0', '');
        return (
          <View
            key={f}
            style={[
              styles.gridLine,
              { bottom: f * CHART_H + 24, borderColor: colors.border + '55' }
            ]}
          >
            <Text style={[styles.gridLineLabel, { color: colors.textMuted }]}>{gridHours}h</Text>
          </View>
        );
      })}

      <FlatList
        data={data}
        keyExtractor={(item) => item.date}
        horizontal
        scrollEnabled={mode === '30'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.barsRow, mode === '7' && { width: availableW }]}
        ItemSeparatorComponent={() => <View style={{ width: BAR_GAP }} />}
        renderItem={({ item, index: i }) => {
          const fillH = maxSeconds > 0 ? (item.seconds / maxSeconds) * CHART_H : 0;
          const isToday = i === data.length - 1;
          const isEmpty = item.seconds === 0;
          const isSelected = selectedDate === item.date;
          const showDateLabel = mode === '7' || i % 7 === 0 || i === data.length - 1;

          return (
            <Pressable
              onPress={() => handleSelect(item.date)}
              style={({ pressed }) => [styles.barCol, { width: barW, opacity: pressed ? 0.7 : 1 }]}
            >
              {/* Duration label on top for 7-day or when has tracked time */}
              <View style={styles.topLabelSlot}>
                {item.seconds > 0 && (
                  <Text
                    style={[
                      styles.barCountLabel,
                      { color: isSelected || isToday ? colors.primary : colors.textSecondary }
                    ]}
                    numberOfLines={1}
                  >
                    {formatHoursMinutesCompact(item.seconds)}
                  </Text>
                )}
              </View>

              {/* Track + Fill */}
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
                      height: Math.max(isEmpty ? 0 : 3, fillH),
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

              {/* Day / date label */}
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
                    {mode === '7' ? shortDayLabel(item.date) : shortMonthDay(item.date)}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        }}
      />

      {/* Selected day breakdown card */}
      {selectedItem && (
        <View
          style={[
            styles.selectedInfo,
            { backgroundColor: colors.card, borderColor: colors.primary + '66' }
          ]}
        >
          <Text style={[styles.selectedInfoDate, { color: colors.text }]}>
            {formatDayLabel(selectedItem.date)}
          </Text>

          {selectedSeconds > 0 ? (
            <View style={styles.selectedPills}>
              <View style={[styles.pill, { backgroundColor: colors.primary + '22' }]}>
                <Text style={[styles.pillDot, { color: colors.primary }]}>●</Text>
                <Text style={[styles.pillText, { color: colors.primary }]}>
                  {formatHoursMinutesFull(selectedSeconds)} tracked
                </Text>
              </View>

              <Text style={[styles.selectedPct, { color: colors.primary }]}>
                {Math.round((selectedSeconds / 3600) * 10) / 10} hrs
              </Text>
            </View>
          ) : (
            <Text style={[styles.selectedInfoDetail, { color: colors.textSecondary }]}>
              No time tracked on this date
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
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end'
  },
  gridLineLabel: {
    fontSize: 9,
    marginTop: -12,
    marginRight: 2
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_H + 42,
    paddingBottom: 0
  },
  barCol: {
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  topLabelSlot: {
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2
  },
  barCountLabel: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.semibold,
    textAlign: 'center'
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
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4
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
    justifyContent: 'space-between',
    gap: SPACING.xs
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
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
    fontWeight: TYPOGRAPHY.heavy
  },
  selectedInfoDetail: {
    fontSize: TYPOGRAPHY.xs
  }
});
