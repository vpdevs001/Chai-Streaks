import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  LayoutChangeEvent
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../../constants';
import { toDateString } from '../../db/utils';

interface HeatmapCalendarProps {
  /** Map of date string (YYYY-MM-DD) → completion rate (0–1) for that day. */
  data: Record<string, number>;
  /** Number of weeks to show (default 12). */
  weeks?: number;
  /** Called when a day cell is tapped. */
  onDayPress?: (date: string) => void;
}

const DAY_GAP = 3;
const LABEL_WIDTH = 22;

export default function HeatmapCalendar({ data, weeks = 12, onDayPress }: HeatmapCalendarProps) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Available width within the card
  const effectiveWidth =
    containerWidth > 0 ? containerWidth : windowWidth - SPACING.base * 2 - SPACING.lg * 2;
  const daySize = Math.max(
    12,
    Math.floor((effectiveWidth - LABEL_WIDTH - (weeks - 1) * DAY_GAP) / weeks)
  );

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - containerWidth) > 2) {
      setContainerWidth(w);
    }
  };

  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    const todayStr = toDateString(today);

    // Find the most recent Saturday (end of current week column)
    const endDate = new Date(today);
    const dayOfWeek = endDate.getDay(); // 0 = Sunday
    endDate.setDate(endDate.getDate() + (6 - dayOfWeek));

    const totalDays = weeks * 7;
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - totalDays + 1);

    // Build grid: weeks × 7 days
    const grid: { date: string; rate: number | null }[][] = [];
    const monthLabelsList: { label: string; colIndex: number; leftPx: number }[] = [];
    let lastMonth = -1;
    let lastLabelCol = -10;

    const cursor = new Date(startDate);
    for (let w = 0; w < weeks; w++) {
      const week: { date: string; rate: number | null }[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = toDateString(cursor);
        const isFuture = dateStr > todayStr;
        const rate = isFuture ? null : (data[dateStr] ?? null);

        week.push({ date: dateStr, rate });

        // Track month labels (only on the first day of each week or month transition)
        const month = cursor.getMonth();
        if (d === 0) {
          if (month !== lastMonth && w - lastLabelCol >= 3) {
            const leftPx = LABEL_WIDTH + w * (daySize + DAY_GAP);
            monthLabelsList.push({
              label: cursor.toLocaleDateString('en-US', { month: 'short' }),
              colIndex: w,
              leftPx
            });
            lastLabelCol = w;
            lastMonth = month;
          }
        }

        cursor.setDate(cursor.getDate() + 1);
      }
      grid.push(week);
    }

    return { grid, monthLabels: monthLabelsList };
  }, [data, weeks, daySize]);

  const getColor = (rate: number | null): string => {
    if (rate === null) return colors.border + '22'; // future or no data
    if (rate === 0) return colors.border + '44'; // no completions
    if (rate < 0.25) return colors.primary + '33';
    if (rate < 0.5) return colors.primary + '66';
    if (rate < 0.75) return colors.primary + '99';
    return colors.primary; // 75%+
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Month labels row with absolute positioning to prevent squashing */}
      <View style={styles.monthRow}>
        {monthLabels.map((m, i) => (
          <Text
            key={`${m.label}_${i}`}
            style={[
              styles.monthLabel,
              {
                color: colors.textMuted,
                left: m.leftPx
              }
            ]}
          >
            {m.label}
          </Text>
        ))}
      </View>

      <View style={styles.gridRow}>
        {/* Day labels (S, M, T, W, T, F, S) */}
        <View style={[styles.dayLabels, { width: LABEL_WIDTH }]}>
          {dayLabels.map((label, i) => (
            <Text
              key={i}
              style={[
                styles.dayLabel,
                {
                  color: colors.textMuted,
                  height: daySize + DAY_GAP,
                  fontSize: Math.min(10, daySize - 2)
                }
              ]}
            >
              {i % 2 === 1 ? label : ''}
            </Text>
          ))}
        </View>

        {/* Full-width Grid */}
        <View style={styles.grid}>
          {grid.map((week, wi) => (
            <View
              key={wi}
              style={[
                styles.weekCol,
                {
                  width: daySize,
                  marginRight: wi < weeks - 1 ? DAY_GAP : 0
                }
              ]}
            >
              {week.map((day, di) => (
                <Pressable
                  key={di}
                  onPress={() => onDayPress?.(day.date)}
                  style={({ pressed }) => [
                    styles.dayCell,
                    {
                      width: daySize,
                      height: daySize,
                      borderRadius: Math.max(2, Math.floor(daySize * 0.22)),
                      backgroundColor: getColor(day.rate),
                      marginBottom: DAY_GAP,
                      opacity: pressed ? 0.7 : 1
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
    width: '100%',
    gap: SPACING.xs
  },
  monthRow: {
    height: 18,
    position: 'relative',
    width: '100%'
  },
  monthLabel: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold,
    position: 'absolute'
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%'
  },
  dayLabels: {
    justifyContent: 'flex-start'
  },
  dayLabel: {
    fontWeight: TYPOGRAPHY.medium,
    textAlign: 'left',
    lineHeight: 14
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start'
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
