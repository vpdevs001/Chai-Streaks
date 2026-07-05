import React, { useState } from 'react';
import { View, Text, Pressable, Switch, StyleSheet, Platform } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent
} from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import { parseReminderTime, formatReminderTime } from '../db/utils';

interface ReminderTimePickerProps {
  /** Stored value in 'HH:MM' (24h) format, or '' when no reminder is set. */
  value: string;
  onChange: (value: string) => void;
}

const DEFAULT_HOUR = 9;
const DEFAULT_MINUTE = 0;

function valueToDate(value: string): Date {
  const parsed = parseReminderTime(value);
  const d = new Date();
  d.setSeconds(0, 0);
  d.setHours(parsed?.hour ?? DEFAULT_HOUR, parsed?.minute ?? DEFAULT_MINUTE);
  return d;
}

function formatDisplay(value: string): string {
  const parsed = parseReminderTime(value);
  if (!parsed) return '';
  const d = new Date();
  d.setHours(parsed.hour, parsed.minute, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/**
 * Native time picker for a habit's daily reminder, backed by
 * @react-native-community/datetimepicker. Replaces the old free-text
 * "HH:MM" input — this always produces a valid time, so there's no
 * parsing/validation burden on the caller.
 */
export default function ReminderTimePicker({ value, onChange }: ReminderTimePickerProps) {
  const { colors, scheme } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const enabled = !!value;

  const handleToggle = (next: boolean) => {
    if (next) {
      onChange(formatReminderTime(DEFAULT_HOUR, DEFAULT_MINUTE));
    } else {
      setShowPicker(false);
      onChange('');
    }
  };

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    // Android renders the picker as a native dialog that manages its own
    // visibility — close ours on any dismissal (cancel or set).
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type !== 'set' || !selected) return;
    }
    if (selected) {
      onChange(formatReminderTime(selected.getHours(), selected.getMinutes()));
    }
  };

  return (
    <View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Daily Reminder</Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>
            Get notified to complete this habit
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>

      {enabled && (
        <Pressable
          onPress={() => setShowPicker(true)}
          style={({ pressed }) => [
            styles.timeBtn,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1
            }
          ]}
        >
          <Text style={styles.timeEmoji}>⏰</Text>
          <Text style={[styles.timeText, { color: colors.text }]}>{formatDisplay(value)}</Text>
          <Text style={[styles.timeHint, { color: colors.textMuted }]}>Change</Text>
        </Pressable>
      )}

      {enabled && showPicker && (
        <>
          <DateTimePicker
            value={valueToDate(value)}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            themeVariant={scheme === 'dark' ? 'dark' : 'light'}
            onChange={handleChange}
          />
          {Platform.OS === 'ios' && (
            <Pressable
              onPress={() => setShowPicker(false)}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm
  },

  rowLabel: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold
  },

  rowSub: {
    fontSize: TYPOGRAPHY.sm,
    marginTop: 2
  },

  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADII.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm
  },

  timeEmoji: {
    fontSize: TYPOGRAPHY.md
  },

  timeText: {
    flex: 1,
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold
  },

  timeHint: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium
  },

  doneBtn: {
    alignSelf: 'flex-end',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md
  },

  doneText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold
  }
});
