import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import type { ThemeColors } from '../theme';

interface Props {
  colors: ThemeColors;
  onArchive: () => void;
  onDelete: () => void;
}

export default function HabitDangerZone({ colors, onArchive, onDelete }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [
          styles.dangerBtn,
          {
            backgroundColor: colors.warning + '18',
            borderColor: colors.warning + '44',
            opacity: pressed ? 0.8 : 1
          }
        ]}
        onPress={onArchive}
      >
        <Text style={styles.dangerIcon}>📦</Text>
        <View>
          <Text style={[styles.dangerLabel, { color: colors.warning }]}>Archive Habit</Text>
          <Text style={[styles.dangerSub, { color: colors.textMuted }]}>
            Hide from home, keep history
          </Text>
        </View>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.dangerBtn,
          {
            backgroundColor: colors.danger + '18',
            borderColor: colors.danger + '44',
            opacity: pressed ? 0.8 : 1
          }
        ]}
        onPress={onDelete}
      >
        <Text style={styles.dangerIcon}>🗑️</Text>
        <View>
          <Text style={[styles.dangerLabel, { color: colors.danger }]}>Delete Habit</Text>
          <Text style={[styles.dangerSub, { color: colors.textMuted }]}>
            Permanently remove all data
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: SPACING.sm
  },

  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: RADII.lg,
    borderWidth: 1,
    padding: SPACING.md
  },

  dangerIcon: {
    fontSize: 24
  },

  dangerLabel: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold
  },

  dangerSub: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: 2
  }
});
