import React, { useState } from 'react';
import { View, Text, Pressable, Switch, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import { parseReminderTime, formatReminderTime } from '../db/utils';

interface ReminderPickerProps {
  value: string; // JSON configuration or empty string
  onChange: (value: string) => void;
}

interface HourlyConfig {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  interval: number; // hours
}

export default function ReminderPicker({ value, onChange }: ReminderPickerProps) {
  const { colors, scheme } = useTheme();
  const [pickerMode, setPickerMode] = useState<'add' | 'start' | 'end' | null>(null);

  // Parse state from the JSON or legacy string
  const enabled = !!value;
  let mode: 'specific' | 'hourly' = 'specific';
  let times: string[] = [];
  let hourly: HourlyConfig = { start: '09:00', end: '18:00', interval: 1 };

  if (enabled) {
    if (value.startsWith('{')) {
      try {
        const parsed = JSON.parse(value);
        if (parsed.type === 'specific') {
          mode = 'specific';
          times = parsed.times || [];
        } else if (parsed.type === 'hourly') {
          mode = 'hourly';
          hourly = parsed.hourly || { start: '09:00', end: '18:00', interval: 1 };
        }
      } catch (e) {
        // Fallback
        times = [value];
      }
    } else {
      // Legacy "HH:MM"
      times = [value];
    }
  }

  const updateTimes = (newTimes: string[]) => {
    onChange(JSON.stringify({ type: 'specific', times: newTimes }));
  };

  const updateHourly = (newHourly: Partial<HourlyConfig>) => {
    onChange(JSON.stringify({ type: 'hourly', hourly: { ...hourly, ...newHourly } }));
  };

  const handleToggleEnabled = (val: boolean) => {
    if (val) {
      onChange(JSON.stringify({ type: 'specific', times: ['09:00'] }));
    } else {
      onChange('');
    }
  };

  const handleModeChange = (newMode: 'specific' | 'hourly') => {
    if (newMode === 'specific') {
      updateTimes(times.length > 0 ? times : ['09:00']);
    } else {
      updateHourly(hourly);
    }
  };

  const handleDeleteTime = (idx: number) => {
    const next = times.filter((_, i) => i !== idx);
    updateTimes(next);
  };

  const handleTimePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setPickerMode(null);
      if (event.type !== 'set' || !selected) return;
    }

    if (selected) {
      const timeStr = formatReminderTime(selected.getHours(), selected.getMinutes());
      if (pickerMode === 'add') {
        updateTimes([...times, timeStr].sort());
      } else if (pickerMode === 'start') {
        updateHourly({ start: timeStr });
      } else if (pickerMode === 'end') {
        updateHourly({ end: timeStr });
      }
    }
  };

  // Helper to format local display time
  const formatDisplayTime = (timeStr: string) => {
    const parsed = parseReminderTime(timeStr);
    if (!parsed) return '';
    const d = new Date();
    d.setHours(parsed.hour, parsed.minute, 0, 0);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // Determine picker date value
  const getPickerDate = () => {
    let target = '09:00';
    if (pickerMode === 'start') target = hourly.start;
    else if (pickerMode === 'end') target = hourly.end;
    const parsed = parseReminderTime(target);
    const d = new Date();
    d.setHours(parsed?.hour ?? 9, parsed?.minute ?? 0, 0, 0);
    return d;
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Habit Reminders</Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>
            Set daily alerts or hourly check-ins
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={handleToggleEnabled}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
        />
      </View>

      {enabled && (
        <View style={styles.body}>
          {/* Mode Switch Tabs */}
          <View
            style={[
              styles.tabContainer,
              { backgroundColor: colors.inputBg, borderColor: colors.border }
            ]}
          >
            <Pressable
              style={[
                styles.tab,
                mode === 'specific' && [styles.tabActive, { backgroundColor: colors.primary }]
              ]}
              onPress={() => handleModeChange('specific')}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: mode === 'specific' ? '#fff' : colors.textSecondary }
                ]}
              >
                ⏰ Specific Times
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                mode === 'hourly' && [styles.tabActive, { backgroundColor: colors.primary }]
              ]}
              onPress={() => handleModeChange('hourly')}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: mode === 'hourly' ? '#fff' : colors.textSecondary }
                ]}
              >
                💧 Hourly Interval
              </Text>
            </Pressable>
          </View>

          {/* Specific Times View */}
          {mode === 'specific' && (
            <View style={styles.specificSection}>
              {times.map((t, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.timeRow,
                    { backgroundColor: colors.card, borderColor: colors.border }
                  ]}
                >
                  <Text style={[styles.timeText, { color: colors.text }]}>
                    🔔 {formatDisplayTime(t)}
                  </Text>
                  <Pressable
                    onPress={() => handleDeleteTime(idx)}
                    style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.6 : 1 }]}
                    hitSlop={6}
                  >
                    <Text style={[styles.deleteIcon, { color: colors.danger }]}>✕</Text>
                  </Pressable>
                </View>
              ))}

              <Pressable
                onPress={() => setPickerMode('add')}
                style={({ pressed }) => [
                  styles.addBtn,
                  {
                    backgroundColor: colors.primary + '11',
                    borderColor: colors.primary + '44',
                    opacity: pressed ? 0.8 : 1
                  }
                ]}
              >
                <Text style={[styles.addBtnText, { color: colors.primary }]}>
                  + Add Reminder Time
                </Text>
              </Pressable>
            </View>
          )}

          {/* Hourly View */}
          {mode === 'hourly' && (
            <View style={styles.hourlySection}>
              {/* Range pickers */}
              <View style={styles.rangeRow}>
                <Pressable
                  onPress={() => setPickerMode('start')}
                  style={({ pressed }) => [
                    styles.timePickerBtn,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.85 : 1
                    }
                  ]}
                >
                  <Text style={[styles.rangeLabel, { color: colors.textMuted }]}>Start Time</Text>
                  <Text style={[styles.rangeVal, { color: colors.text }]}>
                    {formatDisplayTime(hourly.start)}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setPickerMode('end')}
                  style={({ pressed }) => [
                    styles.timePickerBtn,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.85 : 1
                    }
                  ]}
                >
                  <Text style={[styles.rangeLabel, { color: colors.textMuted }]}>End Time</Text>
                  <Text style={[styles.rangeVal, { color: colors.text }]}>
                    {formatDisplayTime(hourly.end)}
                  </Text>
                </Pressable>
              </View>

              {/* Interval pickers */}
              <Text style={[styles.intervalTitle, { color: colors.textSecondary }]}>
                Interval Range
              </Text>
              <View style={styles.intervalOptions}>
                {[1, 2, 3, 4].map((i) => {
                  const isActive = hourly.interval === i;
                  return (
                    <Pressable
                      key={i}
                      style={({ pressed }) => [
                        styles.intervalChip,
                        {
                          backgroundColor: isActive ? colors.primary : colors.card,
                          borderColor: isActive ? colors.primary : colors.border
                        },
                        { opacity: pressed ? 0.8 : 1 }
                      ]}
                      onPress={() => updateHourly({ interval: i })}
                    >
                      <Text
                        style={[
                          styles.intervalChipText,
                          { color: isActive ? '#fff' : colors.text }
                        ]}
                      >
                        {i === 1 ? 'Every hour' : `Every ${i}h`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Date Picker Overlay */}
      {pickerMode && (
        <>
          <DateTimePicker
            value={getPickerDate()}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            themeVariant={scheme === 'dark' ? 'dark' : 'light'}
            onChange={handleTimePickerChange}
          />
          {Platform.OS === 'ios' && (
            <Pressable
              onPress={() => setPickerMode(null)}
              style={({ pressed }) => [styles.doneBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.doneText, { color: colors.primary }]}>Done</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xs
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md
  },

  rowLabel: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold
  },

  rowSub: {
    fontSize: TYPOGRAPHY.sm,
    marginTop: 2
  },

  body: {
    marginTop: SPACING.xs,
    gap: SPACING.md
  },

  tabContainer: {
    flexDirection: 'row',
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: 3,
    gap: 3
  },

  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center'
  },

  tabActive: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },

  tabText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold
  },

  specificSection: {
    gap: SPACING.xs
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADII.lg,
    borderWidth: StyleSheet.hairlineWidth
  },

  timeText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold
  },

  deleteBtn: {
    padding: 4
  },

  deleteIcon: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semibold
  },

  addBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: SPACING.xs
  },

  addBtnText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.bold
  },

  hourlySection: {
    gap: SPACING.md
  },

  rangeRow: {
    flexDirection: 'row',
    gap: SPACING.sm
  },

  timePickerBtn: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADII.lg,
    borderWidth: 1,
    justifyContent: 'center'
  },

  rangeLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: TYPOGRAPHY.bold,
    marginBottom: 4
  },

  rangeVal: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold
  },

  intervalTitle: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.xs
  },

  intervalOptions: {
    flexDirection: 'row',
    gap: SPACING.sm
  },

  intervalChip: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADII.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },

  intervalChipText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold
  },

  doneBtn: {
    alignSelf: 'flex-end',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginTop: 4
  },

  doneText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold
  }
});
