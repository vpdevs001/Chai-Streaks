import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';

export default function EmptyHabits({ onAdd }: { onAdd: () => void }) {
  const { colors } = useTheme();

  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🌱</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No habits yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Start small. One habit changes everything.
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.emptyBtn,
          {
            backgroundColor: colors.primary,
            opacity: pressed ? 0.85 : 1
          }
        ]}
        onPress={onAdd}
      >
        <Text style={styles.emptyBtnText}>Create your first habit</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
    gap: SPACING.md
  },

  emptyEmoji: {
    fontSize: 56
  },

  emptyTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold
  },

  emptySubtitle: {
    fontSize: TYPOGRAPHY.base,
    textAlign: 'center',
    lineHeight: 22
  },

  emptyBtn: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING['2xl'],
    borderRadius: RADII.full
  },

  emptyBtnText: {
    color: '#fff',
    fontWeight: TYPOGRAPHY.bold,
    fontSize: TYPOGRAPHY.base
  }
});
