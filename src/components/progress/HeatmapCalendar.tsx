import { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import { toDateString } from '../../db/utils';

interface HeatmapCalendarProps {
  /** Map of date string (YYYY-MM-DD) → completion rate (0–1) for that day. */
  data: Record<string, number>;
  /** Number of weeks to show (default 12). */
  weeks?: number;
}

const DAY_SIZE = 14;
const DAY_GAP = 3;
const LABEL_WIDTH = 28;

export default function HeatmapCalendar({ data, weeks = 12 }: HeatmapCalendarProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    const todayStr = toDateString(today);

    // Find the most recent Sunday (start of the current week column)
    const endDate = new Date(today);
    const dayOfWeek = endDate.getDay(); // 0 = Sunday
    endDate.setDate(endDate.getDate() + (6 - dayOfWeek)); // go to Saturday of this week

    const totalDays = weeks * 7;
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - totalDays + 1);

    // Build grid: weeks × 7 days
    const grid: { date: string; rate: number | null }[][] = [];
    const monthLabels: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;

    const cursor = new Date(startDate);
    for (let w = 0; w < weeks; w++) {
      const week: { date: string; rate: number | null }[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = toDateString(cursor);
        const isFuture = dateStr > todayStr;
        const rate = isFuture ? null : (data[dateStr] ?? null);

        week.push({ date: dateStr, rate });

        // Track month labels
        const month = cursor.getMonth();
        if (d === 0 && month !== lastMonth) {
          monthLabels.push({
            label: cursor.toLocaleDateString('en-US', { month: 'short' }),
            colIndex: w
          });
          lastMonth = month;
        }

        cursor.setDate(cursor.getDate() + 1);
      }
      grid.push(week);
    }

    return { grid, monthLabels };
  }, [data, weeks]);

  const getColor = (rate: number | null): string => {
    if (rate === null) return colors.border + '33'; // future or no data
    if (rate === 0) return colors.border + '55'; // no completions
    if (rate < 0.25) return colors.primary + '33';
    if (rate < 0.5) return colors.primary + '66';
    if (rate < 0.75) return colors.primary + '99';
    return colors.primary; // 75%+
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.container}>
      {/* Month labels */}
      <View style={[styles.monthRow, { paddingLeft: LABEL_WIDTH }]}>
        {monthLabels.map((m, i) => (
          <Text
            key={i}
            style={[
              styles.monthLabel,
              {
                color: colors.textMuted,
                left: m.colIndex * (DAY_SIZE + DAY_GAP)
              }
            ]}
          >
            {m.label}
          </Text>
        ))}
      </View>

      <View style={styles.gridRow}>
        {/* Day labels */}
        <View style={[styles.dayLabels, { width: LABEL_WIDTH }]}>
          {dayLabels.map((label, i) => (
            <Text
              key={i}
              style={[
                styles.dayLabel,
                { color: colors.textMuted, height: DAY_SIZE + DAY_GAP }
              ]}
            >
              {i % 2 === 1 ? label : ''}
            </Text>
          ))}
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {grid.map((week, wi) => (
            <View key={wi} style={[styles.weekCol, { marginRight: DAY_GAP }]}>
              {week.map((day, di) => (
                <View
                  key={di}
                  style={[
                    styles.dayCell,
                    {
                      width: DAY_SIZE,
                      height: DAY_SIZE,
                      borderRadius: 3,
                      backgroundColor: getColor(day.rate),
                      marginBottom: DAY_GAP
                    }
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.textMuted }]}>Less</Text>
        {[0, 0.25, 0.5, 0.75, 1].map((rate) => (
          <View
            key={rate}
            style={[
              styles.legendCell,
              {
                backgroundColor: getColor(rate),
                width: 12,
                height: 12,
                borderRadius: 2
              }
            ]}
          />
        ))}
        <Text style={[styles.legendText, { color: colors.textMuted }]}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs
  },
  monthRow: {
    height: 18,
    position: 'relative'
  },
  monthLabel: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.medium,
    position: 'absolute'
  },
  gridRow: {
    flexDirection: 'row'
  },
  dayLabels: {
    justifyContent: 'flex-start'
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.medium,
    textAlign: 'center',
    textAlignVertical: 'center'
  },
  grid: {
    flexDirection: 'row'
  },
  weekCol: {
    flexDirection: 'column'
  },
  dayCell: {},
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: SPACING.xs
  },
  legendText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.medium
  },
  legendCell: {}
});
