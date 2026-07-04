import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import { toDateString } from '../db/utils';

interface Props {
  habitColor: string;
  history: Record<string, 'completed' | 'skipped' | 'partial'>;
}

const DAYS_OF_WEEK = ['M', 'W', 'F'];

export default function CalendarHeatmap({ habitColor, history }: Props) {
  const { colors } = useTheme();

  // Generate last 13 weeks of dates (ending today)
  const grid: Date[][] = [];
  const today = new Date();

  // Find the Monday of the week 12 weeks ago
  const startDate = new Date(today);
  const day = startDate.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  startDate.setDate(startDate.getDate() + diffToMonday - 12 * 7);

  // Build 13 columns (weeks), each containing 7 rows (days, Monday to Sunday)
  for (let w = 0; w < 13; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      week.push(date);
    }
    grid.push(week);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>90-Day History</Text>

      <View style={styles.heatmapRow}>
        {/* Day labels (M, W, F) */}
        <View style={styles.dayLabels}>
          {DAYS_OF_WEEK.map((lbl, idx) => (
            <Text key={idx} style={[styles.dayLabelText, { color: colors.textMuted }]}>
              {lbl}
            </Text>
          ))}
        </View>

        {/* Heatmap Grid */}
        <View style={styles.gridContainer}>
          <ScrollViewHorizontalOnly>
            <View style={styles.weeksContainer}>
              {grid.map((week, wIdx) => (
                <View key={wIdx} style={styles.weekColumn}>
                  {week.map((date, dIdx) => {
                    const dateKey = toDateString(date);
                    const status = history[dateKey];
                    const isFuture = date > today;

                    let bg = colors.border + '33'; // Default transparent grey
                    let opacity = 1;

                    if (isFuture) {
                      bg = 'transparent';
                      opacity = 0;
                    } else if (status === 'completed') {
                      bg = habitColor;
                    } else if (status === 'partial') {
                      bg = habitColor + '88';
                    } else if (status === 'skipped') {
                      bg = '#FF9800'; // Orange for skipped
                    }

                    return (
                      <View
                        key={dIdx}
                        style={[
                          styles.daySquare,
                          {
                            backgroundColor: bg,
                            opacity
                          }
                        ]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollViewHorizontalOnly>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>Less</Text>
        <View style={[styles.daySquare, { backgroundColor: colors.border + '33' }]} />
        <View style={[styles.daySquare, { backgroundColor: habitColor + '88' }]} />
        <View style={[styles.daySquare, { backgroundColor: habitColor }]} />
        <View style={[styles.daySquare, { backgroundColor: '#FF9800' }]} />
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>More / Skipped</Text>
      </View>
    </View>
  );
}

// A simple horizontal scroll wrapper for the weeks container.
// Note: plain <View> with `overflow: 'scroll'` does NOT scroll on native
// (iOS/Android) — only on web. A real ScrollView is required for touch scrolling.
function ScrollViewHorizontalOnly({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    borderRadius: RADII.xl,
    borderWidth: 1,
    marginTop: SPACING.base
  },
  title: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    marginBottom: SPACING.md
  },
  heatmapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm
  },
  dayLabels: {
    justifyContent: 'space-between',
    height: 100,
    paddingVertical: 4
  },
  dayLabelText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold
  },
  gridContainer: {
    flex: 1
  },
  weeksContainer: {
    flexDirection: 'row',
    gap: 6
  },
  weekColumn: {
    flexDirection: 'column',
    gap: 6
  },
  daySquare: {
    width: 10,
    height: 10,
    borderRadius: 2
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: SPACING.md
  },
  legendText: {
    fontSize: 10,
    marginHorizontal: 2
  }
});
