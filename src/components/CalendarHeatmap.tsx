import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import { toDateString } from '../db/utils';

interface Props {
  habitColor: string;
  history: Record<string, 'completed' | 'skipped' | 'partial' | 'frozen'>;
}

const CELL = 12;
const CELL_GAP = 3;
const NUM_WEEKS = 18; // ~4 months

const DAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 128, g: 128, b: 128 };
}

export default function CalendarHeatmap({ habitColor, history }: Props) {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const rgb = hexToRgb(habitColor);

  // Generate grid: NUM_WEEKS columns of 7 days (Mon→Sun)
  const today = new Date();
  const todayStr = toDateString(today);

  // Find the Monday of the week NUM_WEEKS-1 ago
  const startDate = new Date(today);
  const dayOfWeek = startDate.getDay(); // 0=Sun
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startDate.setDate(startDate.getDate() + diffToMonday - (NUM_WEEKS - 1) * 7);
  startDate.setHours(0, 0, 0, 0);

  // Build weeks
  const grid: Date[][] = [];
  for (let w = 0; w < NUM_WEEKS; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      week.push(date);
    }
    grid.push(week);
  }

  // Determine month label for each week (show label when month changes or first week)
  const monthLabels: (string | null)[] = grid.map((week, wIdx) => {
    const firstDayOfWeek = week[0];
    const month = firstDayOfWeek.getMonth();
    if (wIdx === 0) return MONTHS_SHORT[month];
    const prevWeekFirstDay = grid[wIdx - 1][0];
    if (prevWeekFirstDay.getMonth() !== month) return MONTHS_SHORT[month];
    return null;
  });

  // Selected date display info
  const getSelectedInfo = () => {
    if (!selectedDate) return null;
    const d = new Date(selectedDate + 'T00:00:00');
    const label = d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    const status = history[selectedDate];
    if (!status) return `${label} · No activity`;
    if (status === 'completed') return `${label} · ✅ Completed`;
    if (status === 'skipped') return `${label} · ✕ Skipped`;
    if (status === 'partial') return `${label} · ◑ Partial`;
    if (status === 'frozen') return `${label} · 📜 Recovered with a Chai Scroll`;
    return label;
  };

  const getCellColor = (date: Date, dateKey: string) => {
    const isFuture = date > today;
    const status = history[dateKey];
    const isToday = dateKey === todayStr;

    if (isFuture) return 'transparent';
    if (status === 'completed') return habitColor;
    if (status === 'partial') return `rgba(${rgb.r},${rgb.g},${rgb.b},0.45)`;
    if (status === 'skipped') return colors.danger + 'BB';
    if (status === 'frozen') return colors.warning + 'BB';
    // Empty — subtle grid cell
    return `rgba(${rgb.r},${rgb.g},${rgb.b},0.08)`;
  };

  const getCellBorderColor = (dateKey: string) => {
    if (dateKey === todayStr) return colors.primary;
    if (selectedDate === dateKey) return colors.text;
    return 'transparent';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Activity History</Text>

      <View style={styles.heatmapRow}>
        {/* Day-of-week labels (M T W T F S S) */}
        <View style={styles.dayLabels}>
          {DAYS_SHORT.map((d, i) => (
            <Text key={i} style={[styles.dayLabelText, { color: colors.textMuted }]}>
              {i % 2 === 0 ? d : ''}
            </Text>
          ))}
        </View>

        {/* Grid */}
        <View style={styles.gridContainer}>
          {/* Month labels row */}
          <View style={styles.monthLabelsRow}>
            {grid.map((_, wIdx) => (
              <View
                key={wIdx}
                style={[styles.monthLabelCell, { width: CELL, marginRight: CELL_GAP }]}
              >
                {monthLabels[wIdx] ? (
                  <Text style={[styles.monthLabelText, { color: colors.textMuted }]}>
                    {monthLabels[wIdx]}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>

          {/* Scrollable week columns */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.weeksContainer}>
              {grid.map((week, wIdx) => (
                <View key={wIdx} style={styles.weekColumn}>
                  {week.map((date, dIdx) => {
                    const dateKey = toDateString(date);
                    const isFuture = date > today;
                    const cellColor = getCellColor(date, dateKey);
                    const borderColor = getCellBorderColor(dateKey);

                    return (
                      <Pressable
                        key={dIdx}
                        onPress={() => {
                          if (!isFuture) {
                            setSelectedDate(selectedDate === dateKey ? null : dateKey);
                          }
                        }}
                        style={({ pressed }) => [
                          styles.cell,
                          {
                            backgroundColor: cellColor,
                            borderColor,
                            borderWidth: borderColor !== 'transparent' ? 1.5 : 0,
                            opacity: isFuture ? 0 : pressed ? 0.7 : 1
                          }
                        ]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Selected date info */}
      {selectedDate && (
        <View
          style={[
            styles.selectedInfo,
            { backgroundColor: colors.inputBg, borderColor: colors.border }
          ]}
        >
          <Text style={[styles.selectedInfoText, { color: colors.text }]}>{getSelectedInfo()}</Text>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.textMuted }]}>Less</Text>
        <View style={[styles.cell, { backgroundColor: `rgba(${rgb.r},${rgb.g},${rgb.b},0.08)` }]} />
        <View style={[styles.cell, { backgroundColor: `rgba(${rgb.r},${rgb.g},${rgb.b},0.30)` }]} />
        <View style={[styles.cell, { backgroundColor: `rgba(${rgb.r},${rgb.g},${rgb.b},0.60)` }]} />
        <View style={[styles.cell, { backgroundColor: habitColor }]} />
        <Text style={[styles.legendText, { color: colors.textMuted }]}>More</Text>
        <View style={{ width: SPACING.sm }} />
        <View style={[styles.cell, { backgroundColor: colors.danger + 'BB' }]} />
        <Text style={[styles.legendText, { color: colors.textMuted }]}>Skipped</Text>
        <View style={{ width: SPACING.sm }} />
        <View style={[styles.cell, { backgroundColor: colors.warning + 'BB' }]} />
        <Text style={[styles.legendText, { color: colors.textMuted }]}>📜 Recovered</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    borderRadius: RADII.xl,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: SPACING.base
  },

  title: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: SPACING.md
  },

  heatmapRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs
  },

  dayLabels: {
    justifyContent: 'space-between',
    paddingTop: 18, // Offset for month label row height
    paddingBottom: 1,
    height: 18 + 7 * (CELL + CELL_GAP)
  },

  dayLabelText: {
    fontSize: 9,
    fontWeight: '600',
    width: 8,
    textAlign: 'right'
  },

  gridContainer: {
    flex: 1,
    overflow: 'hidden'
  },

  monthLabelsRow: {
    flexDirection: 'row',
    height: 16,
    marginBottom: 2,
    overflow: 'hidden'
  },

  monthLabelCell: {
    justifyContent: 'flex-start'
  },

  monthLabelText: {
    fontSize: 9,
    fontWeight: '700'
  },

  weeksContainer: {
    flexDirection: 'row',
    gap: CELL_GAP
  },

  weekColumn: {
    flexDirection: 'column',
    gap: CELL_GAP,
    width: CELL
  },

  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 2.5
  },

  selectedInfo: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    borderRadius: RADII.md,
    borderWidth: StyleSheet.hairlineWidth
  },

  selectedInfoText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium
  },

  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.md,
    justifyContent: 'flex-end',
    flexWrap: 'wrap'
  },

  legendText: {
    fontSize: 9,
    fontWeight: '600'
  }
});
